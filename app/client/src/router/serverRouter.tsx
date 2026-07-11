import { AdminPage } from "@client/pages/AdminPage";
import { ManagePage } from "@client/pages/ManagePage";
import { ResultDetailPage } from "@client/pages/ResultDetailPage";
import { AppRoutes } from "@client/router/appRoutes";
import { type InitialData } from "@client/router/routes";

export function ServerApp({ initialData = {} }: { initialData?: InitialData }) {
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
