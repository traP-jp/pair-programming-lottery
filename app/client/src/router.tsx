import { Suspense, lazy } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

import { AdminPageRoute, Layout } from "@client/appShell";
import { ResultsPage } from "@client/pages/ResultsPage";
import { type InitialData, paths } from "@client/routeDefinitions";

const ResultDetailPage = lazy(async () => ({
    default: (await import("@client/pages/ResultDetailPage")).ResultDetailPage,
}));
const ManagePage = lazy(async () => ({
    default: (await import("@client/pages/ManagePage")).ManagePage,
}));
const AdminPage = lazy(async () => ({
    default: (await import("@client/pages/AdminPage")).AdminPage,
}));

function PageLoading() {
    return (
        <div className="container">
            <p className="text-muted">読み込み中...</p>
        </div>
    );
}

export function App({ initialData = {} }: { initialData?: InitialData }) {
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
                    path={paths.home}
                    element={<ResultsPage initialResults={initialData.results} />}
                />
                <Route
                    path={paths.results}
                    element={<ResultsPage initialResults={initialData.results} />}
                />
                <Route
                    path={paths.resultDetailPattern}
                    element={
                        <Suspense fallback={<PageLoading />}>
                            <ResultDetailPage initialRecord={initialData.result} />
                        </Suspense>
                    }
                />
                <Route
                    path={paths.manage}
                    element={
                        <AdminPageRoute>
                            <Suspense fallback={<PageLoading />}>
                                <ManagePage />
                            </Suspense>
                        </AdminPageRoute>
                    }
                />
                <Route
                    path={paths.admin}
                    element={
                        <AdminPageRoute>
                            <Suspense fallback={<PageLoading />}>
                                <AdminPage />
                            </Suspense>
                        </AdminPageRoute>
                    }
                />
            </Route>
        </Routes>
    );
}

export function Root({ initialData }: { initialData?: InitialData }) {
    return (
        <BrowserRouter>
            <App initialData={initialData} />
        </BrowserRouter>
    );
}
