import { type ReactNode } from "react";
import { Navigate, Route, Routes } from "react-router-dom";

import { AdminPageRoute, Layout } from "@client/appShell";
import { ResultsArea } from "@client/router/resultsArea";
import { type InitialData, paths } from "@client/router/routes";

import { PageSuspense } from "./routeLoading";

interface RoutePages {
    resultDetail: ReactNode;
    manage: ReactNode;
    admin: ReactNode;
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
                    element={<ResultsArea initialResults={initialData.results} />}
                >
                    <Route
                        index
                        element={null}
                    />
                    <Route
                        path={paths.results.slice(1)}
                        element={null}
                    />
                    <Route
                        path={`${paths.results.slice(1)}/:id`}
                        element={<PageSuspense>{pages.resultDetail}</PageSuspense>}
                    />
                    <Route
                        path={paths.manage.slice(1)}
                        element={
                            <AdminPageRoute>
                                <PageSuspense>{pages.manage}</PageSuspense>
                            </AdminPageRoute>
                        }
                    />
                    <Route
                        path={paths.admin.slice(1)}
                        element={
                            <AdminPageRoute>
                                <PageSuspense>{pages.admin}</PageSuspense>
                            </AdminPageRoute>
                        }
                    />
                    <Route
                        path="*"
                        element={
                            <Navigate
                                to={paths.results}
                                replace
                            />
                        }
                    />
                </Route>
            </Route>
        </Routes>
    );
}
