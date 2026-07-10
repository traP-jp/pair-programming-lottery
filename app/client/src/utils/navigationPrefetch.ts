import { prefetchResult } from "@client/api";
import { preloadResultDetailPage } from "@client/pages/pageLoaders";

export async function prefetchResultNavigation(id: string) {
    const detailPage = import.meta.env.SSR ? Promise.resolve() : preloadResultDetailPage();
    await Promise.all([prefetchResult(id), detailPage]);
}
