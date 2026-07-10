import { isAbsolute, relative, resolve } from "node:path";

import { loadInitialData, render } from "@client/entry-server";

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

const clientDirectory = resolve(import.meta.dir, "../client");
const apiOrigin = process.env.SSR_API_ORIGIN ?? "http://localhost:3000";
const port = Number(process.env.PORT ?? 4173);

function injectSsrHtml(template: string, appHtml: string, initialData: unknown) {
    const serializedData = JSON.stringify(initialData).replaceAll("<", "\\u003c");
    return template
        .replace("<!--ssr-outlet-->", appHtml)
        .replace("<!--ssr-data-->", serializedData);
}

async function proxyApi(request: Request, url: URL) {
    const target = new URL(`${url.pathname}${url.search}`, apiOrigin);
    const headers = new Headers(request.headers);
    headers.delete("host");

    try {
        return await fetch(target, {
            method: request.method,
            headers,
            body: request.method === "GET" || request.method === "HEAD" ? undefined : request.body,
        });
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
    return new Response(file);
}

Bun.serve({
    port,
    async fetch(request) {
        const url = new URL(request.url);

        if (url.pathname.startsWith("/api/")) return proxyApi(request, url);

        const asset = await serveAsset(url.pathname);
        if (asset) return asset;

        const initialData = await loadInitialData(url.pathname);
        const template = await Bun.file(resolve(clientDirectory, "index.html")).text();
        return new Response(
            injectSsrHtml(template, render(url.pathname, initialData), initialData),
            {
                headers: { "Content-Type": "text/html; charset=utf-8" },
            }
        );
    },
});

console.log(`🚀 Client running at http://localhost:${port}`);
