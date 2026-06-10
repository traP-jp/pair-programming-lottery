import {
    createBrowserRouter,
    RouterProvider,
    Link,
    Outlet,
    Navigate,
} from "react-router-dom";
import { ManagePage } from "@/pages/ManagePage";
import { ResultsPage } from "@/pages/ResultsPage";
import { ResultDetailPage } from "@/pages/ResultDetailPage";
import { AdminPage } from "@/pages/AdminPage";
import { AuthProvider, AdminRoute } from "@/hooks/useAuth";

function Layout() {
    return (
        <AuthProvider>
            <div>
                <nav className="nav-bar">
                    <Link to="/" className="nav-brand">
                        ペアプロ抽選
                    </Link>
                    <div className="nav-links">
                        <Link to="/results" className="nav-link">
                            結果
                        </Link>
                        <Link to="/manage" className="nav-link">
                            操作
                        </Link>
                        <Link to="/admin" className="nav-link">
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
            { path: "*", element: <Navigate to="/results" replace /> },
            { path: "/results", element: <ResultsPage /> },
            { path: "/results/:id", element: <ResultDetailPage /> },

            {
                path: "/manage",
                element: (
                    <AdminRoute>
                        <ManagePage />
                    </AdminRoute>
                ),
            },
            {
                path: "/admin",
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
