import { BrowserRouter, Link, Navigate, Outlet, Route, Routes } from "react-router-dom";

import type { ResultDetail, ResultSummary } from "@client/api";
import { AdminRoute, AuthProvider } from "@client/hooks/useAuth";
import { AdminPage } from "@client/pages/AdminPage";
import { ManagePage } from "@client/pages/ManagePage";
import { ResultDetailPage } from "@client/pages/ResultDetailPage";
import { ResultsPage } from "@client/pages/ResultsPage";

export const paths = {
    home: "/",
    results: "/results",
    resultDetail: (id: string) => `/results/${id}`,
    resultDetailPattern: "/results/:id",
    manage: "/manage",
    admin: "/admin",
} as const;

export interface InitialData {
    result?: ResultDetail | null;
    results?: ResultSummary[];
}

function Layout() {
    return (
        <AuthProvider>
            <div>
                <nav className="nav-bar">
                    <Link
                        to={paths.home}
                        className="nav-brand"
                    >
                        ペアプロ抽選
                    </Link>
                    <div className="nav-links">
                        <Link
                            to={paths.results}
                            className="nav-link"
                        >
                            結果
                        </Link>
                        <Link
                            to={paths.manage}
                            className="nav-link"
                        >
                            操作
                        </Link>
                        <Link
                            to={paths.admin}
                            className="nav-link"
                        >
                            管理
                        </Link>
                    </div>
                </nav>
                <Outlet />
            </div>
        </AuthProvider>
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
                    element={<ResultDetailPage initialRecord={initialData.result} />}
                />
                <Route
                    path={paths.manage}
                    element={
                        <AdminRoute>
                            <ManagePage />
                        </AdminRoute>
                    }
                />
                <Route
                    path={paths.admin}
                    element={
                        <AdminRoute>
                            <AdminPage />
                        </AdminRoute>
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
