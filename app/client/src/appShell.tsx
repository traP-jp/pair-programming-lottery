import { Link, Outlet } from "react-router-dom";

import { AdminRoute, AuthProvider } from "@client/hooks/useAuth";
import { paths } from "@client/router/routes";

export function Layout() {
    return (
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
    );
}

export function AdminPageRoute({ children }: { children: React.ReactNode }) {
    return (
        <AuthProvider>
            <AdminRoute>{children}</AdminRoute>
        </AuthProvider>
    );
}
