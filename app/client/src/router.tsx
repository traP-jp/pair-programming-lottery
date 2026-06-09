import {
    createHashRouter,
    RouterProvider,
    Link,
    Outlet,
} from "react-router-dom";
import { App } from "./App";
import { ResultsPage } from "./pages/ResultsPage";
import { ResultDetailPage } from "./pages/ResultDetailPage";
import { AdminPage } from "./pages/AdminPage";
import { AuthProvider, AdminRoute } from "./hooks/useAuth";

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
                        <Link to="/" className="nav-link">
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

const router = createHashRouter([
    {
        element: <Layout />,
        children: [
            {
                path: "/",
                element: (
                    <AdminRoute>
                        <App />
                    </AdminRoute>
                ),
            },
            { path: "/results", element: <ResultsPage /> },
            { path: "/results/:id", element: <ResultDetailPage /> },
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
