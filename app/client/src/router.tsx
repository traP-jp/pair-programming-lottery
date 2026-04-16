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

function Layout() {
    return (
        <div>
            <nav className="nav-bar">
                <Link to="/" className="nav-brand">
                    🎲 ペアプロ抽選
                </Link>
                <div className="nav-links">
                    <Link to="/" className="nav-link">
                        手動操作
                    </Link>
                    <Link to="/results" className="nav-link">
                        結果一覧
                    </Link>
                    <Link to="/admin" className="nav-link">
                        管理
                    </Link>
                </div>
            </nav>
            <Outlet />
        </div>
    );
}

const router = createHashRouter([
    {
        element: <Layout />,
        children: [
            { path: "/", element: <App /> },
            { path: "/results", element: <ResultsPage /> },
            { path: "/results/:id", element: <ResultDetailPage /> },
            { path: "/admin", element: <AdminPage /> },
        ],
    },
]);

export function Root() {
    return <RouterProvider router={router} />;
}
