import { Activity, useCallback, useRef, useState } from "react";
import { Outlet, useLocation, useMatch } from "react-router-dom";

import type { ResultSummary } from "@client/api";
import { ResultsPage } from "@client/pages/ResultsPage";
import { ResultDetailPage } from "@client/pages/lazy";
import { paths } from "@client/router/routes";
import { prefetchResultNavigation } from "@client/utils/navigationPrefetch";

import { PageSuspense } from "./routeLoading";

const MAX_PREPARED_DETAILS = 2;

export function ResultsArea({ initialResults }: { initialResults?: ResultSummary[] }) {
    const location = useLocation();
    const detailMatch = useMatch(paths.resultDetailPattern);
    const currentDetailId = detailMatch?.params.id;
    const [preparedDetailIds, setPreparedDetailIds] = useState<string[]>([]);
    const preparedDetailIdsReference = useRef(new Set<string>());
    const pendingPrefetches = useRef(new Map<string, Promise<void>>());

    const prepareDetail = useCallback(
        (id: string) => {
            if (preparedDetailIdsReference.current.has(id)) return;

            const pending = pendingPrefetches.current.get(id);
            if (pending) return;

            const request = prefetchResultNavigation(id)
                .then(() => {
                    preparedDetailIdsReference.current.add(id);
                    setPreparedDetailIds(previous => {
                        const ids = [...previous.filter(previousId => previousId !== id), id];
                        const prioritized =
                            currentDetailId && ids.includes(currentDetailId)
                                ? [
                                      currentDetailId,
                                      ...ids.filter(detailId => detailId !== currentDetailId),
                                  ]
                                : ids;
                        const retained =
                            currentDetailId && prioritized.includes(currentDetailId)
                                ? prioritized.slice(0, MAX_PREPARED_DETAILS)
                                : prioritized.slice(-MAX_PREPARED_DETAILS);
                        preparedDetailIdsReference.current = new Set(retained);
                        return retained;
                    });
                })
                .catch(() => undefined)
                .finally(() => pendingPrefetches.current.delete(id));

            pendingPrefetches.current.set(id, request);
        },
        [currentDetailId]
    );

    const isResultsRoute =
        location.pathname === paths.home ||
        location.pathname === paths.results ||
        Boolean(currentDetailId);
    const hasPreparedCurrentDetail =
        currentDetailId !== undefined && preparedDetailIds.includes(currentDetailId);

    return (
        <>
            <Activity mode={isResultsRoute && currentDetailId === undefined ? "visible" : "hidden"}>
                <ResultsPage
                    initialResults={initialResults}
                    onPrefetchDetail={prepareDetail}
                />
            </Activity>

            {preparedDetailIds.map(id => (
                <Activity
                    key={id}
                    mode={isResultsRoute && currentDetailId === id ? "visible" : "hidden"}
                >
                    <PageSuspense>
                        <ResultDetailPage resultId={id} />
                    </PageSuspense>
                </Activity>
            ))}

            {(!isResultsRoute || !hasPreparedCurrentDetail) && <Outlet />}
        </>
    );
}
