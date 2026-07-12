import { createHash } from "node:crypto";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { isAbsolute, relative, resolve } from "node:path";

import { type InitialData, paths } from "@client/router/routes";
import { loadInitialData, render } from "@client/ssr/entryServer";
import { type CachePolicy, type PublicPage, resolvePublicPage } from "@client/ssr/publicPages";
import { injectSsrHtml } from "@client/ssr/ssrHtml";

interface CachedPage {
    generatedAt: number;
    html: string;
}

const clientDirectory = resolve(import.meta.dir, "../client");
const apiOrigin = process.env.SSR_API_ORIGIN ?? "http://localhost:3000";
const port = Number(process.env.PORT ?? 4173);
const template = await Bun.file(resolve(clientDirectory, "index.html")).text();
const buildId = createHash("sha256").update(template).digest("hex").slice(0, 12);
const cacheDirectory = resolve(
    process.env.SSG_CACHE_DIR ?? resolve(import.meta.dir, "../cache"),
    buildId
);
const regenerating = new Map<string, Promise<CachedPage>>();

function getCacheKey(page: PublicPage) {
    return page.pathname.replaceAll("/", "_").replace(/^_/, "") || "results";
}

function getCachePath(page: PublicPage) {
    return resolve(cacheDirectory, `${getCacheKey(page)}.json`);
}

async function readCachedPage(page: PublicPage): Promise<CachedPage | undefined> {
    try {
        const cachedPage = JSON.parse(await readFile(getCachePath(page), "utf8")) as CachedPage;
        if (typeof cachedPage.generatedAt !== "number" || typeof cachedPage.html !== "string")
            return undefined;
        return cachedPage;
    } catch {
        return undefined;
    }
}

async function writeCachedPage(publicPage: PublicPage, page: CachedPage) {
    await mkdir(cacheDirectory, { recursive: true });
    await writeFile(getCachePath(publicPage), JSON.stringify(page), "utf8");
}

async function invalidatePage(pathname: string) {
    const page = resolvePublicPage(pathname);
    if (page) await rm(getCachePath(page), { force: true });
}

async function generatePage(pathname: string, initialData?: InitialData): Promise<CachedPage> {
    const page = resolvePublicPage(pathname);
    if (!page) throw new Error(`Could not generate non-public page: ${pathname}`);

    initialData ??= await page.loadInitialData();
    if (!page.hasInitialData(initialData))
        throw new Error(`Could not generate ${pathname}: API data is unavailable`);

    return {
        generatedAt: Date.now(),
        html: injectSsrHtml(template, render(page.pathname, initialData), initialData),
    };
}

async function regeneratePage(pathname: string, initialData?: InitialData): Promise<CachedPage> {
    const page = resolvePublicPage(pathname);
    if (!page) throw new Error(`Could not regenerate non-public page: ${pathname}`);

    const pending = regenerating.get(page.pathname);
    if (pending) return pending;

    const generation = generatePage(page.pathname, initialData)
        .then(async cachedPage => {
            await writeCachedPage(page, cachedPage);
            return cachedPage;
        })
        .finally(() => regenerating.delete(page.pathname));
    regenerating.set(page.pathname, generation);
    return generation;
}

function pageResponse(
    page: CachedPage,
    policy: CachePolicy,
    cacheStatus: "HIT" | "MISS" | "STALE" | "GENERATING"
) {
    return new Response(page.html, {
        headers: {
            "Cache-Control": policy.cacheControl,
            "Content-Type": "text/html; charset=utf-8",
            "X-SSG-Cache": cacheStatus,
        },
    });
}

function generatingResponse(pathname: string) {
    return new Response(injectSsrHtml(template, render(pathname, {}), {}), {
        headers: {
            "Cache-Control": "no-store",
            "Content-Type": "text/html; charset=utf-8",
            "X-SSG-Cache": "GENERATING",
        },
    });
}

function shouldBypassPageCache(request: Request) {
    const cacheControl = request.headers.get("Cache-Control") ?? "";
    return cacheControl.includes("no-cache") || cacheControl.includes("no-store");
}

async function servePublicPage(pathname: string, request?: Request) {
    const publicPage = resolvePublicPage(pathname);
    if (!publicPage) return undefined;

    const page = await readCachedPage(publicPage);
    if (request && shouldBypassPageCache(request)) {
        try {
            return pageResponse(await regeneratePage(pathname), publicPage.cachePolicy, "MISS");
        } catch (error) {
            console.error("Failed to regenerate bypassed page", error);
            if (page) return pageResponse(page, publicPage.cachePolicy, "STALE");
            return generatingResponse(pathname);
        }
    }

    const age = page ? Date.now() - page.generatedAt : Number.POSITIVE_INFINITY;
    if (page && age <= publicPage.cachePolicy.maxAgeMs)
        return pageResponse(page, publicPage.cachePolicy, "HIT");

    if (
        page &&
        age <= publicPage.cachePolicy.maxAgeMs + publicPage.cachePolicy.staleWhileRevalidateMs
    ) {
        void regeneratePage(pathname).catch(error =>
            console.error("Failed to revalidate page", error)
        );
        return pageResponse(page, publicPage.cachePolicy, "STALE");
    }

    if (!page) {
        void regeneratePage(pathname).catch(error =>
            console.error("Failed to generate page", error)
        );
        return generatingResponse(pathname);
    }

    try {
        return pageResponse(await regeneratePage(pathname), publicPage.cachePolicy, "MISS");
    } catch (error) {
        console.error("Failed to generate page", error);
        if (page) return pageResponse(page, publicPage.cachePolicy, "STALE");
    }

    return generatingResponse(pathname);
}

async function proxyApi(request: Request, url: URL) {
    const target = new URL(`${url.pathname}${url.search}`, apiOrigin);
    const headers = new Headers(request.headers);
    headers.delete("host");

    try {
        const response = await fetch(target, {
            method: request.method,
            headers,
            body: request.method === "GET" || request.method === "HEAD" ? undefined : request.body,
        });

        if (request.method === "POST" && url.pathname === "/api/admin/results" && response.ok) {
            try {
                const { id } = (await response.clone().json()) as { id?: string };
                if (id) {
                    const detailPath = paths.resultDetail(id);
                    await Promise.all([invalidatePage(paths.results), invalidatePage(detailPath)]);
                    await Promise.all([regeneratePage(paths.results), regeneratePage(detailPath)]);
                }
            } catch (error) {
                console.error("Failed to generate pages for saved result", error);
            }
        }

        return response;
    } catch {
        return Response.json({ error: "API サーバーに接続できません" }, { status: 502 });
    }
}

async function serveAsset(pathname: string) {
    const assetPath = resolve(clientDirectory, `.${pathname}`);
    const assetRelativePath = relative(clientDirectory, assetPath);
    if (assetRelativePath.startsWith("..") || isAbsolute(assetRelativePath)) return undefined;

    const file = Bun.file(assetPath);
    if (!(await file.exists())) return undefined;
    return new Response(file, {
        headers:
            pathname === "/sw.js"
                ? { "Cache-Control": "no-store" }
                : pathname.startsWith("/assets/")
                  ? { "Cache-Control": "public, max-age=31536000, immutable" }
                  : undefined,
    });
}

async function warmPublicPages() {
    const listPage = resolvePublicPage(paths.results);
    if (!listPage) throw new Error("Could not resolve results page");
    const initialData = await listPage.loadInitialData();
    if (!listPage.hasInitialData(initialData) || initialData.results === undefined) {
        throw new Error("Could not warm public pages: results API is unavailable");
    }

    await regeneratePage(paths.results, initialData);
    for (const result of initialData.results) {
        await regeneratePage(paths.resultDetail(result.id));
    }
}

await warmPublicPages();

Bun.serve({
    port,
    async fetch(request) {
        const url = new URL(request.url);

        if (url.pathname.startsWith("/api/")) return proxyApi(request, url);

        const asset = await serveAsset(url.pathname);
        if (asset) return asset;

        const cachedPage = await servePublicPage(url.pathname, request);
        if (cachedPage) return cachedPage;

        const initialData = await loadInitialData(url.pathname);
        return new Response(
            injectSsrHtml(template, render(url.pathname, initialData), initialData),
            {
                headers: {
                    "Cache-Control": "no-store",
                    "Content-Type": "text/html; charset=utf-8",
                },
            }
        );
    },
});

console.log(`🚀 Client running at http://localhost:${port}`);
