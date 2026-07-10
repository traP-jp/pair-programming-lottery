import { createHash } from "node:crypto";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { isAbsolute, relative, resolve } from "node:path";

import { loadInitialData, render } from "@client/entry-server";
import { type InitialData, paths } from "@client/routeDefinitions";

declare global {
    interface ImportMeta {
        readonly dir: string;
    }
}

declare const Bun: {
    file(path: string): Blob & {
        exists(): Promise<boolean>;
    };
    serve(options: {
        port: number;
        fetch(request: Request): Response | Promise<Response>;
    }): unknown;
};

interface CachedPage {
    generatedAt: number;
    html: string;
}

interface CachePolicy {
    maxAgeMs: number;
    staleWhileRevalidateMs: number;
    cacheControl: string;
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

const resultListPolicy: CachePolicy = {
    maxAgeMs: 60_000,
    staleWhileRevalidateMs: 300_000,
    cacheControl: "public, max-age=60, stale-while-revalidate=300",
};
const resultDetailPolicy: CachePolicy = {
    maxAgeMs: 86_400_000,
    staleWhileRevalidateMs: 604_800_000,
    cacheControl: "public, max-age=86400, immutable",
};

function injectSsrHtml(appHtml: string, initialData: unknown) {
    const serializedData = JSON.stringify(initialData).replaceAll("<", "\\u003c");
    return template
        .replace("<!--ssr-outlet-->", appHtml)
        .replace("<!--ssr-data-->", serializedData);
}

function getPagePolicy(pathname: string): CachePolicy | undefined {
    if (pathname === paths.home || pathname === paths.results) return resultListPolicy;
    if (/^\/results\/[^/]+$/.test(pathname)) return resultDetailPolicy;
    return undefined;
}

function getCacheKey(pathname: string) {
    const canonicalPath = pathname === paths.home ? paths.results : pathname;
    return canonicalPath.replaceAll("/", "_").replace(/^_/, "") || "results";
}

function getCachePath(pathname: string) {
    return resolve(cacheDirectory, `${getCacheKey(pathname)}.json`);
}

async function readCachedPage(pathname: string): Promise<CachedPage | undefined> {
    try {
        const page = JSON.parse(await readFile(getCachePath(pathname), "utf8")) as CachedPage;
        if (typeof page.generatedAt !== "number" || typeof page.html !== "string") return undefined;
        return page;
    } catch {
        return undefined;
    }
}

async function writeCachedPage(pathname: string, page: CachedPage) {
    await mkdir(cacheDirectory, { recursive: true });
    await writeFile(getCachePath(pathname), JSON.stringify(page), "utf8");
}

async function invalidatePage(pathname: string) {
    await rm(getCachePath(pathname), { force: true });
}

async function generatePage(pathname: string, initialData?: InitialData): Promise<CachedPage> {
    initialData ??= await loadInitialData(pathname);
    const isList = pathname === paths.home || pathname === paths.results;
    const hasRequiredData = isList
        ? initialData.results !== undefined
        : initialData.result !== undefined;
    if (!hasRequiredData)
        throw new Error(`Could not generate ${pathname}: API data is unavailable`);

    return {
        generatedAt: Date.now(),
        html: injectSsrHtml(render(pathname, initialData), initialData),
    };
}

async function regeneratePage(pathname: string, initialData?: InitialData): Promise<CachedPage> {
    const canonicalPath = pathname === paths.home ? paths.results : pathname;
    const pending = regenerating.get(canonicalPath);
    if (pending) return pending;

    const generation = generatePage(canonicalPath, initialData)
        .then(async page => {
            await writeCachedPage(canonicalPath, page);
            return page;
        })
        .finally(() => regenerating.delete(canonicalPath));
    regenerating.set(canonicalPath, generation);
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
    return new Response(injectSsrHtml(render(pathname, {}), {}), {
        headers: {
            "Cache-Control": "no-store",
            "Content-Type": "text/html; charset=utf-8",
            "X-SSG-Cache": "GENERATING",
        },
    });
}

async function servePublicPage(pathname: string) {
    const policy = getPagePolicy(pathname);
    if (!policy) return undefined;

    const page = await readCachedPage(pathname);
    const age = page ? Date.now() - page.generatedAt : Number.POSITIVE_INFINITY;
    if (page && age <= policy.maxAgeMs) return pageResponse(page, policy, "HIT");

    if (page) {
        void regeneratePage(pathname).catch(error =>
            console.error("Failed to revalidate page", error)
        );
        return pageResponse(page, policy, "STALE");
    }

    void regeneratePage(pathname).catch(error => console.error("Failed to generate page", error));
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

        if (request.method === "POST" && url.pathname === "/api/results" && response.ok) {
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
        headers: pathname.startsWith("/assets/")
            ? { "Cache-Control": "public, max-age=31536000, immutable" }
            : undefined,
    });
}

async function warmPublicPages() {
    const initialData = await loadInitialData(paths.results);
    if (initialData.results === undefined) {
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

        const cachedPage = await servePublicPage(url.pathname);
        if (cachedPage) return cachedPage;

        const initialData = await loadInitialData(url.pathname);
        return new Response(injectSsrHtml(render(url.pathname, initialData), initialData), {
            headers: { "Cache-Control": "no-store", "Content-Type": "text/html; charset=utf-8" },
        });
    },
});

console.log(`🚀 Client running at http://localhost:${port}`);
