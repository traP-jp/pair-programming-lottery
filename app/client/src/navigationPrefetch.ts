import { prefetchResult } from "@client/api";

export async function prefetchResultNavigation(id: string) {
    const detailPage = import.meta.env.SSR
        ? Promise.resolve()
        : import("@client/pages/ResultDetailPage");
    await Promise.all([prefetchResult(id), detailPage]);
}
