import { Suspense, lazy } from "react";
import { BrowserRouter } from "react-router-dom";

import { AppRoutes } from "@client/appRoutes";
import { type InitialData } from "@client/routeDefinitions";

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
        <AppRoutes
            initialData={initialData}
            pages={{
                resultDetail: (
                    <Suspense fallback={<PageLoading />}>
                        <ResultDetailPage initialRecord={initialData.result} />
                    </Suspense>
                ),
                manage: (
                    <Suspense fallback={<PageLoading />}>
                        <ManagePage />
                    </Suspense>
                ),
                admin: (
                    <Suspense fallback={<PageLoading />}>
                        <AdminPage />
                    </Suspense>
                ),
            }}
        />
    );
}

export function Root({ initialData }: { initialData?: InitialData }) {
    return (
        <BrowserRouter>
            <App initialData={initialData} />
        </BrowserRouter>
    );
}
