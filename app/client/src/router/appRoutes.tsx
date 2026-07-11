import { type ReactNode, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";

import { AdminPageRoute, Layout } from "@client/appShell";
import { ResultsPage } from "@client/pages/ResultsPage";
import { type InitialData, paths } from "@client/router/routes";

interface RoutePages {
    resultDetail: ReactNode;
    manage: ReactNode;
    admin: ReactNode;
}

function PageLoading() {
    return (
        <div className="container">
            <p className="text-muted">読み込み中...</p>
        </div>
    );
}

function PageSuspense({ children }: { children: ReactNode }) {
    return <Suspense fallback={<PageLoading />}>{children}</Suspense>;
}

/**
 * Route structure shared by browser rendering and SSR. The caller supplies
 * page elements so the browser can use lazy imports while SSR renders the
 * same routes synchronously. Suspense boundaries live here so hydration sees
 * the same route tree on both sides.
 */
export function AppRoutes({
    initialData = {},
    pages,
}: {
    initialData?: InitialData;
    pages: RoutePages;
}) {
    return (
        <Routes>
            <Route element={<Layout />}>
                <Route
                    path="*"
                    element={
                        <Navigate
                            to={paths.results}
                            replace
                        />
                    }
                />
                <Route
                    index
                    element={<ResultsPage initialResults={initialData.results} />}
                />
                <Route
                    path={paths.results}
                    element={<ResultsPage initialResults={initialData.results} />}
                />
                <Route
                    path={paths.resultDetailPattern}
                    element={<PageSuspense>{pages.resultDetail}</PageSuspense>}
                />
                <Route
                    path={paths.manage}
                    element={
                        <AdminPageRoute>
                            <PageSuspense>{pages.manage}</PageSuspense>
                        </AdminPageRoute>
                    }
                />
                <Route
                    path={paths.admin}
                    element={
                        <AdminPageRoute>
                            <PageSuspense>{pages.admin}</PageSuspense>
                        </AdminPageRoute>
                    }
                />
            </Route>
        </Routes>
    );
}
