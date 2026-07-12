const CACHE_SUFFIX = "v3";

export const ASSET_CACHE = `pair-programming-lottery-assets-${CACHE_SUFFIX}`;
export const DETAIL_CACHE = `pair-programming-lottery-details-${CACHE_SUFFIX}`;
export const RESULTS_CACHE = `pair-programming-lottery-results-${CACHE_SUFFIX}`;
export const PAGE_CACHE = `pair-programming-lottery-pages-${CACHE_SUFFIX}`;

export function isPublicPage(page: URL) {
    const pathname = page.pathname;
    if (pathname === "/") return true;
    if (pathname.startsWith("/results")) return true;
    return false;
}

export function cacheNameForUrl(url: URL) {
    if (url.pathname.startsWith("/assets/")) return ASSET_CACHE;
    if (url.pathname === "/api/public/results") return RESULTS_CACHE;
    if (/^\/api\/public\/results\/[^/]+$/.test(url.pathname)) return DETAIL_CACHE;
    return undefined;
}
