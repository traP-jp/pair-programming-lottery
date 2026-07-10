import { Navigate, Route, Routes } from "react-router-dom";

import { AdminPageRoute, Layout } from "@client/appShell";
import { AdminPage } from "@client/pages/AdminPage";
import { ManagePage } from "@client/pages/ManagePage";
import { ResultDetailPage } from "@client/pages/ResultDetailPage";
import { ResultsPage } from "@client/pages/ResultsPage";
import { type InitialData, paths } from "@client/routeDefinitions";

export function ServerApp({ initialData = {} }: { initialData?: InitialData }) {
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
                        <AdminPageRoute>
                            <ManagePage />
                        </AdminPageRoute>
                    }
                />
                <Route
                    path={paths.admin}
                    element={
                        <AdminPageRoute>
                            <AdminPage />
                        </AdminPageRoute>
                    }
                />
            </Route>
        </Routes>
    );
}
