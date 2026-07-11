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

const ASSET_CACHE = "pair-programming-lottery-assets-v1";
const DETAIL_CACHE = "pair-programming-lottery-details-v1";

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
                                key !== DETAIL_CACHE
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

serviceWorker.addEventListener("fetch", event => {
    const requestUrl = new URL(event.request.url);
    if (event.request.method !== "GET" || requestUrl.origin !== serviceWorker.location.origin)
        return;

    if (requestUrl.pathname.startsWith("/assets/")) {
        event.respondWith(cacheFirst(event.request, ASSET_CACHE));
        return;
    }

    if (/^\/api\/results\/[^/]+$/.test(requestUrl.pathname)) {
        event.respondWith(cacheFirst(event.request, DETAIL_CACHE));
    }
});

serviceWorker.addEventListener("message", event => {
    if (event.data?.type !== "result-saved" || !event.data.result?.id) return;

    const result = event.data.result;
    const request = new Request(
        new URL(`/api/results/${result.id}`, serviceWorker.location.origin)
    );
    const response = new Response(JSON.stringify(result), {
        headers: { "Content-Type": "application/json" },
    });
    event.waitUntil(caches.open(DETAIL_CACHE).then(cache => cache.put(request, response)));
});
