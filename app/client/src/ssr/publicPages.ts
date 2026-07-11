import { getResult, getResults } from "@client/api";
import { type InitialData, paths } from "@client/router/routes";

export interface CachePolicy {
    maxAgeMs: number;
    staleWhileRevalidateMs: number;
    cacheControl: string;
}

export interface PublicPage {
    /** The canonical path used for both rendering and the on-disk cache key. */
    pathname: string;
    cachePolicy: CachePolicy;
    loadInitialData(): Promise<InitialData>;
    hasInitialData(initialData: InitialData): boolean;
}

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

/**
 * Defines the public pages that can be statically generated. Keeping URL
 * matching, data loading, and cache policy together prevents SSR and SSG
 * paths from silently drifting apart.
 */
export function resolvePublicPage(pathname: string): PublicPage | undefined {
    if (pathname === paths.home || pathname === paths.results) {
        return {
            pathname: paths.results,
            cachePolicy: resultListPolicy,
            loadInitialData: async () => ({ results: await getResults() }),
            hasInitialData: initialData => initialData.results !== undefined,
        };
    }

    const match = pathname.match(/^\/results\/([^/]+)$/);
    if (!match?.[1]) return undefined;

    const id = match[1];
    return {
        pathname: paths.resultDetail(id),
        cachePolicy: resultDetailPolicy,
        loadInitialData: async () => ({ result: await getResult(id) }),
        hasInitialData: initialData => initialData.result !== undefined,
    };
}
