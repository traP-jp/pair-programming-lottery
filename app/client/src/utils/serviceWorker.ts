import { PAGE_CACHE, isPublicPage } from "@client/config/cache";

async function cacheCurrentDocument(page: string) {
    try {
        const cache = await caches.open(PAGE_CACHE);
        const html = `<!doctype html>\n${document.documentElement.outerHTML}`;
        await cache.put(
            new Request(page),
            new Response(html, {
                headers: { "Content-Type": "text/html; charset=utf-8" },
            })
        );
    } catch (error) {
        console.error("Failed to cache current document", error);
    }
}

export function cacheCurrentPage() {
    if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;
    if (!isPublicPage(new URL(window.location.href))) return;

    const urls = performance
        .getEntriesByType("resource")
        .map(entry => entry.name)
        .filter(url => {
            try {
                return new URL(url).origin === window.location.origin;
            } catch {
                return false;
            }
        });

    void navigator.serviceWorker.ready
        .then(async registration => {
            await cacheCurrentDocument(window.location.href);
            registration.active?.postMessage({
                type: "cache-current-page",
                page: window.location.href,
                urls,
            });
        })
        .catch(error => console.error("Failed to cache current page", error));
}
