import {
    ASSET_CACHE,
    DETAIL_CACHE,
    PAGE_CACHE,
    RESULTS_CACHE,
    cacheNameForUrl,
    isPublicPage,
} from "@client/config/cache";

declare const self: ServiceWorkerGlobalScope;

async function cacheOfflineEntryPage() {
    const request = new Request(new URL("/results", self.location.origin));
    const response = await fetch(request);
    if (response.ok) await (await caches.open(PAGE_CACHE)).put(request, response);
}

self.addEventListener("install", event => {
    event.waitUntil(
        Promise.all([cacheOfflineEntryPage().catch(() => undefined), self.skipWaiting()])
    );
});

self.addEventListener("activate", event => {
    event.waitUntil(
        caches
            .keys()
            .then(keys =>
                Promise.all(
                    keys
                        .filter(
                            key =>
                                key.startsWith("pair-programming-lottery-") &&
                                key !== ASSET_CACHE &&
                                key !== DETAIL_CACHE &&
                                key !== RESULTS_CACHE &&
                                key !== PAGE_CACHE
                        )
                        .map(key => caches.delete(key))
                )
            )
            .then(() => self.clients.claim())
    );
});

async function cacheFirst(request: Request, cacheName: string) {
    const cache = await caches.open(cacheName);
    const cached = await cache.match(request, { ignoreVary: true });
    if (cached) return cached;

    const response = await fetch(request);
    if (response.ok) await cache.put(request, response.clone());
    return response;
}

function staleWhileRevalidate(event: FetchEvent, cacheName: string) {
    const cache = caches.open(cacheName);
    const revalidate = cache.then(async cache_ => {
        const response = await fetch(event.request, { cache: "no-cache" });
        if (response.ok) await cache_.put(event.request, response.clone());
        return response;
    });

    event.waitUntil(revalidate.catch(() => undefined));
    event.respondWith(
        cache.then(
            async cache_ => (await cache_.match(event.request, { ignoreVary: true })) ?? revalidate
        )
    );
}

async function networkFirst(request: Request, cacheName: string) {
    const cache = await caches.open(cacheName);

    try {
        const headers = new Headers(request.headers);
        headers.set("Cache-Control", "no-cache");
        const networkRequest = new Request(request, {
            cache: "no-store",
            headers,
        });
        const response = await fetch(networkRequest);
        if (response.ok) await cache.put(request, response.clone());
        return response;
    } catch {
        const cached = await cache.match(request, { ignoreVary: true });
        if (cached) return cached;

        if (cacheName === PAGE_CACHE) {
            const exactPage = await cache.match(request.url);
            if (exactPage) return exactPage;
        }

        throw new Error("Network request failed");
    }
}

function shouldBypassCache(request: Request) {
    const cacheControl = request.headers.get("Cache-Control") ?? "";
    return (
        request.cache === "no-cache" ||
        request.cache === "no-store" ||
        request.cache === "reload" ||
        cacheControl.includes("no-cache") ||
        cacheControl.includes("no-store")
    );
}

// Fill-if-missing only: keeping entries fresh is the job of the explicit
// bypass-cache refreshes (networkFirst updates the cache on success), so this
// must not refetch URLs that are already cached.
async function ensureCached(url: string, cacheName: string) {
    try {
        const request = new Request(url);
        const cache = await caches.open(cacheName);
        if (await cache.match(request, { ignoreVary: true })) return;

        const response = await fetch(request);
        if (response.ok) {
            await cache.put(request, response);
        } else {
            console.warn(`[SW] Failed to cache ${url}: ${response.status}`);
        }
    } catch (error) {
        console.error(`[SW] Error caching ${url}:`, error);
    }
}

self.addEventListener("fetch", event => {
    const requestUrl = new URL(event.request.url);
    if (event.request.method !== "GET" || requestUrl.origin !== self.location.origin) return;

    if (event.request.mode === "navigate") {
        if (shouldBypassCache(event.request)) {
            event.respondWith(networkFirst(event.request, PAGE_CACHE));
        } else {
            staleWhileRevalidate(event, PAGE_CACHE);
        }
        return;
    }

    const cacheName = cacheNameForUrl(requestUrl);
    if (cacheName === ASSET_CACHE || cacheName === DETAIL_CACHE || cacheName === RESULTS_CACHE) {
        event.respondWith(
            shouldBypassCache(event.request)
                ? networkFirst(event.request, cacheName)
                : cacheFirst(event.request, cacheName)
        );
    }
});

self.addEventListener("message", event => {
    const data = event.data as
        { type?: string; page?: string; urls?: string[]; result?: { id?: string } } | undefined;
    if (data?.type === "cache-current-page" && data.page && data.urls) {
        const page = new URL(data.page);
        const urls = [...new Set(data.urls)]
            .map(url => new URL(url))
            .filter(url => url.origin === self.location.origin);
        event.waitUntil(
            Promise.allSettled([
                ...(page.origin === self.location.origin && isPublicPage(page)
                    ? [ensureCached(page.href, PAGE_CACHE)]
                    : []),
                ensureCached(
                    new URL("/api/public/results", self.location.origin).href,
                    RESULTS_CACHE
                ),
                ...urls.flatMap(url => {
                    const cacheName = cacheNameForUrl(url);
                    return cacheName ? [ensureCached(url.href, cacheName)] : [];
                }),
            ])
        );
        return;
    }

    if (data?.type !== "result-saved" || !data.result?.id) return;

    const result = data.result;
    const request = new Request(new URL(`/api/public/results/${result.id}`, self.location.origin));
    const response = new Response(JSON.stringify(result), {
        headers: { "Content-Type": "application/json" },
    });
    event.waitUntil(caches.open(DETAIL_CACHE).then(cache => cache.put(request, response)));
});
