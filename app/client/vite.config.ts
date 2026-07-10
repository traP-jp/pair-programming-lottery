import { readFile } from "node:fs/promises";

import react from "@vitejs/plugin-react";
import { type Plugin, defineConfig } from "vite";

function injectSsrHtml(template: string, appHtml: string, initialData: unknown) {
    const serializedData = JSON.stringify(initialData).replaceAll("<", "\\u003c");
    return template
        .replace("<!--ssr-outlet-->", appHtml)
        .replace("<!--ssr-data-->", serializedData);
}

function developmentSsrPlugin(): Plugin {
    return {
        name: "dev-ssr",
        configureServer(server) {
            server.middlewares.use(async (request, response, next) => {
                const url = request.originalUrl ?? request.url ?? "/";
                const accept = request.headers.accept ?? "";
                if (url.startsWith("/api/") || !accept.includes("text/html")) return next();

                try {
                    const { loadInitialData, render } =
                        await server.ssrLoadModule("/src/entry-server.tsx");
                    const template = await readFile("index.html", "utf8");
                    const initialData = await loadInitialData(url);
                    const html = injectSsrHtml(
                        await server.transformIndexHtml(url, template),
                        render(url, initialData),
                        initialData
                    );
                    response.statusCode = 200;
                    response.setHeader("Content-Type", "text/html");
                    response.end(html);
                } catch (error) {
                    server.ssrFixStacktrace(error as Error);
                    next(error);
                }
            });
        },
    };
}

function developmentServiceWorkerPlugin(): Plugin {
    return {
        name: "dev-service-worker",
        configureServer(server) {
            server.middlewares.use(async (request, response, next) => {
                const url = request.originalUrl ?? request.url ?? "/";
                if (url.split("?", 1)[0] !== "/sw.js") return next();

                try {
                    const transformed = await server.transformRequest("/src/sw.ts");
                    if (!transformed) throw new Error("Could not transform the Service Worker");
                    response.statusCode = 200;
                    response.setHeader("Content-Type", "application/javascript");
                    response.end(transformed.code);
                } catch (error) {
                    server.ssrFixStacktrace(error as Error);
                    next(error);
                }
            });
        },
    };
}

export default defineConfig(({ isSsrBuild }) => ({
    plugins: [react(), developmentSsrPlugin(), developmentServiceWorkerPlugin()],
    resolve: {
        tsconfigPaths: true,
    },
    server: {
        port: 5173,
        proxy: {
            "/api": {
                target: process.env.VITE_API_TARGET ?? "http://localhost:3000",
                changeOrigin: true,
                headers: {
                    "X-Forwarded-User": "uni_kakurenbo",
                },
            },
        },
        watch: {
            usePolling: true,
        },
    },
    build: {
        outDir: isSsrBuild ? "dist/server" : "dist/client",
    },
}));
