import {
    createBrowserRouter,
    RouterProvider,
    Link,
    Outlet,
    Navigate,
} from "react-router-dom";
import { ManagePage } from "@client/pages/ManagePage";
import { ResultsPage } from "@client/pages/ResultsPage";
import { ResultDetailPage } from "@client/pages/ResultDetailPage";
import { AdminPage } from "@client/pages/AdminPage";
import { AuthProvider, AdminRoute } from "@client/hooks/useAuth";

export const paths = {
    home: "/",
    results: "/results",
    resultDetail: (id: string) => `/results/${id}`,
    resultDetailPattern: "/results/:id",
    manage: "/manage",
    admin: "/admin",
} as const;

function Layout() {
    return (
        <AuthProvider>
            <div>
                <nav className="nav-bar">
                    <Link to={paths.home} className="nav-brand">
                        ペアプロ抽選
                    </Link>
                    <div className="nav-links">
                        <Link to={paths.results} className="nav-link">
                            結果
                        </Link>
                        <Link to={paths.manage} className="nav-link">
                            操作
                        </Link>
                        <Link to={paths.admin} className="nav-link">
                            管理
                        </Link>
                    </div>
                </nav>
                <Outlet />
            </div>
        </AuthProvider>
    );
}

const router = createBrowserRouter([
    {
        element: <Layout />,
        children: [
            { path: "*", element: <Navigate to={paths.results} replace /> },
            { path: paths.results, element: <ResultsPage /> },
            { path: paths.resultDetailPattern, element: <ResultDetailPage /> },

            {
                path: paths.manage,
                element: (
                    <AdminRoute>
                        <ManagePage />
                    </AdminRoute>
                ),
            },
            {
                path: paths.admin,
                element: (
                    <AdminRoute>
                        <AdminPage />
                    </AdminRoute>
                ),
            },
        ],
    },
]);

export function Root() {
    return <RouterProvider router={router} />;
}
