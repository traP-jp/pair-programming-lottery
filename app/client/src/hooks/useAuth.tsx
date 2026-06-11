import {
    createContext,
    useContext,
    useEffect,
    useState,
    type ReactNode,
} from "react";
import { getSchedule } from "@client/api";

interface AuthContextType {
    isAdmin: boolean;
    loading: boolean;
    error: string | null;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [isAdmin, setIsAdmin] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        getSchedule()
            .then(() => {
                setIsAdmin(true);
                setError(null);
            })
            .catch((err) => {
                if (err instanceof Error && err.message === "unauthorized") {
                    setIsAdmin(false);
                    setError(null);
                } else {
                    setError(
                        err instanceof Error
                            ? err.message
                            : "認証の確認に失敗しました",
                    );
                }
            })
            .finally(() => {
                setLoading(false);
            });
    }, []);

    return (
        <AuthContext.Provider value={{ isAdmin, loading, error }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}

export function AdminRoute({ children }: { children: ReactNode }) {
    const { isAdmin, loading, error } = useAuth();

    if (loading) {
        return (
            <div
                className="container"
                style={{ textAlign: "center", padding: "2rem" }}
            >
                <span className="spinner" />
                <p className="text-muted">読み込み中...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="container">
                <div className="inline-error">認証エラー: {error}</div>
            </div>
        );
    }

    if (!isAdmin) {
        return (
            <div
                className="container"
                style={{ textAlign: "center", padding: "3rem 1rem" }}
            >
                <div
                    className="inline-error"
                    style={{ display: "inline-block", margin: "0" }}
                >
                    管理者権限がありません
                </div>
            </div>
        );
    }

    return <>{children}</>;
}
