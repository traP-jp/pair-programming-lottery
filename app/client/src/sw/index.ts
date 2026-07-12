interface ExtendableWorkerEvent {
    waitUntil(promise: Promise<unknown>): void;
}

interface FetchWorkerEvent extends ExtendableWorkerEvent {
    request: Request;
    respondWith(response: Response | Promise<Response>): void;
}

interface MessageWorkerEvent extends ExtendableWorkerEvent {
    data?: {
        type?: string;
        result?: { id?: string };
        page?: string;
        urls?: string[];
    };
}

interface ServiceWorkerContext {
    clients: { claim(): Promise<void> };
    location: { origin: string };
    skipWaiting(): Promise<void>;
    addEventListener(type: "install", listener: () => void): void;
    addEventListener(type: "activate", listener: (event: ExtendableWorkerEvent) => void): void;
    addEventListener(type: "fetch", listener: (event: FetchWorkerEvent) => void): void;
    addEventListener(type: "message", listener: (event: MessageWorkerEvent) => void): void;
}

const serviceWorker = globalThis as unknown as ServiceWorkerContext;

const ASSET_CACHE = "pair-programming-lottery-assets-v2";
const DETAIL_CACHE = "pair-programming-lottery-details-v2";
const RESULTS_CACHE = "pair-programming-lottery-results-v2";
const PAGE_CACHE = "pair-programming-lottery-pages-v2";

serviceWorker.addEventListener("install", () => {
    void serviceWorker.skipWaiting();
});
serviceWorker.addEventListener("activate", event => {
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
            .then(() => serviceWorker.clients.claim())
    );
});

async function cacheFirst(request: Request, cacheName: string) {
    const cache = await caches.open(cacheName);
    const cached = await cache.match(request);
    if (cached) return cached;

    const response = await fetch(request);
    if (response.ok) await cache.put(request, response.clone());
    return response;
}

function staleWhileRevalidate(event: FetchWorkerEvent, cacheName: string) {
    const cache = caches.open(cacheName);
    const revalidate = cache.then(async cache_ => {
        const response = await fetch(event.request, { cache: "no-cache" });
        if (response.ok) await cache_.put(event.request, response.clone());
        return response;
    });

    event.waitUntil(revalidate.catch(() => undefined));
    event.respondWith(
        cache.then(async cache_ => (await cache_.match(event.request)) ?? revalidate)
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
        const cached = await cache.match(request);
        if (cached) return cached;
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

function cacheNameForUrl(url: URL) {
    if (url.pathname.startsWith("/assets/")) return ASSET_CACHE;
    if (url.pathname === "/api/public/results") return RESULTS_CACHE;
    if (/^\/api\/public\/results\/[^/]+$/.test(url.pathname)) return DETAIL_CACHE;
    return undefined;
}

function isPublicPage(url: URL) {
    return (
        url.pathname === "/" ||
        url.pathname === "/results" ||
        /^\/results\/[^/]+$/.test(url.pathname)
    );
}

async function cacheUrl(url: string, cacheName: string) {
    const request = new Request(url);
    const response = await fetch(request);
    if (response.ok) await (await caches.open(cacheName)).put(request, response);
}

serviceWorker.addEventListener("fetch", event => {
    const requestUrl = new URL(event.request.url);
    if (event.request.method !== "GET" || requestUrl.origin !== serviceWorker.location.origin)
        return;

    if (event.request.mode === "navigate") {
        if (shouldBypassCache(event.request)) {
            event.respondWith(networkFirst(event.request, PAGE_CACHE));
        } else {
            staleWhileRevalidate(event, PAGE_CACHE);
        }
        return;
    }

    const cacheName = cacheNameForUrl(requestUrl);
    if (cacheName === ASSET_CACHE || cacheName === DETAIL_CACHE) {
        event.respondWith(
            shouldBypassCache(event.request)
                ? networkFirst(event.request, cacheName)
                : cacheFirst(event.request, cacheName)
        );
        return;
    }

    if (cacheName === RESULTS_CACHE) {
        if (shouldBypassCache(event.request)) {
            event.respondWith(networkFirst(event.request, cacheName));
        } else {
            staleWhileRevalidate(event, cacheName);
        }
    }
});

serviceWorker.addEventListener("message", event => {
    if (event.data?.type === "cache-current-page" && event.data.page && event.data.urls) {
        const page = new URL(event.data.page);
        const urls = [...new Set(event.data.urls)]
            .map(url => new URL(url))
            .filter(url => url.origin === serviceWorker.location.origin);
        event.waitUntil(
            Promise.allSettled([
                ...(page.origin === serviceWorker.location.origin && isPublicPage(page)
                    ? [cacheUrl(page.href, PAGE_CACHE)]
                    : []),
                cacheUrl(
                    new URL("/api/public/results", serviceWorker.location.origin).href,
                    RESULTS_CACHE
                ),
                ...urls.flatMap(url => {
                    const cacheName = cacheNameForUrl(url);
                    return cacheName ? [cacheUrl(url.href, cacheName)] : [];
                }),
            ])
        );
        return;
    }

    if (event.data?.type !== "result-saved" || !event.data.result?.id) return;

    const result = event.data.result;
    const request = new Request(
        new URL(`/api/public/results/${result.id}`, serviceWorker.location.origin)
    );
    const response = new Response(JSON.stringify(result), {
        headers: { "Content-Type": "application/json" },
    });
    event.waitUntil(caches.open(DETAIL_CACHE).then(cache => cache.put(request, response)));
});
