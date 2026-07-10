import { lazy } from "react";
import { BrowserRouter } from "react-router-dom";

import { AppRoutes } from "@client/appRoutes";
import {
    preloadAdminPage,
    preloadManagePage,
    preloadResultDetailPage,
} from "@client/pages/pageLoaders";
import { type InitialData } from "@client/routeDefinitions";

const ResultDetailPage = lazy(preloadResultDetailPage);
const ManagePage = lazy(preloadManagePage);
const AdminPage = lazy(preloadAdminPage);

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
            <App initialData={initialData} />
        </BrowserRouter>
    );
}
