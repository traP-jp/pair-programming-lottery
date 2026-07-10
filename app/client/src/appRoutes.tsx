import type { ReactNode } from "react";
import { Navigate, Route, Routes } from "react-router-dom";

import { AdminPageRoute, Layout } from "@client/appShell";
import { ResultsPage } from "@client/pages/ResultsPage";
import { type InitialData, paths } from "@client/routeDefinitions";

interface RoutePages {
    resultDetail: ReactNode;
    manage: ReactNode;
    admin: ReactNode;
}

/**
 * Route structure shared by browser rendering and SSR. The caller supplies
 * page elements so the browser can use lazy imports while SSR renders the
 * same routes synchronously.
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
                    element={pages.resultDetail}
                />
                <Route
                    path={paths.manage}
                    element={<AdminPageRoute>{pages.manage}</AdminPageRoute>}
                />
                <Route
                    path={paths.admin}
                    element={<AdminPageRoute>{pages.admin}</AdminPageRoute>}
                />
            </Route>
        </Routes>
    );
}
