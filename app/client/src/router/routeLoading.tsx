import { type ReactNode, Suspense } from "react";

export function PageLoading() {
    return (
        <div className="container">
            <p className="text-muted">読み込み中...</p>
        </div>
    );
}

export function PageSuspense({ children }: { children: ReactNode }) {
    return <Suspense fallback={<PageLoading />}>{children}</Suspense>;
}
