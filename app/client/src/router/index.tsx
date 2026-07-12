import { useEffect } from "react";
import { BrowserRouter, useLocation } from "react-router-dom";

import { AppRoutes } from "@client/router/appRoutes";
import { type InitialData } from "@client/router/routes";
import { cacheCurrentPage } from "@client/utils/serviceWorker";

import { AdminPage, ManagePage, ResultDetailPage } from "../pages/lazy";

export function App({ initialData = {} }: { initialData?: InitialData }) {
    return (
        <AppRoutes
            initialData={initialData}
            pages={{
                resultDetail: <ResultDetailPage initialRecord={initialData.result} />,
                manage: <ManagePage />,
                admin: <AdminPage />,
            }}
        />
    );
}

export function Root({ initialData }: { initialData?: InitialData }) {
    return (
        <BrowserRouter>
            <PageCacheOnNavigation />
            <App initialData={initialData} />
        </BrowserRouter>
    );
}

function PageCacheOnNavigation() {
    const location = useLocation();

    useEffect(() => {
        cacheCurrentPage();
    }, [location.pathname]);

    return null;
}
