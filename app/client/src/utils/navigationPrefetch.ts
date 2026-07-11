import { prefetchResult } from "@client/api";
import { ResultDetailPage } from "@client/pages/lazy";

export async function prefetchResultNavigation(id: string) {
    const detailPage = import.meta.env.SSR ? Promise.resolve() : ResultDetailPage.preload();
    await Promise.all([prefetchResult(id), detailPage]);
}
