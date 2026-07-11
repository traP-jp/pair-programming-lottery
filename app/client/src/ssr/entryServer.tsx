import { renderToString } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";

import { type InitialData } from "@client/router/routes";
import { ServerApp } from "@client/router/serverRouter";
import { resolvePublicPage } from "@client/ssr/publicPages";

export async function loadInitialData(url: string): Promise<InitialData> {
    const pathname = new URL(url, "http://localhost").pathname;
    const publicPage = resolvePublicPage(pathname);
    if (!publicPage) return {};

    try {
        return await publicPage.loadInitialData();
    } catch (error) {
        // Keep the page usable when the API is temporarily unavailable: the
        // browser will retry after hydration using the existing client logic.
        console.error("Failed to load SSR data", error);
    }

    return {};
}

export function render(url: string, initialData: InitialData) {
    return renderToString(
        <MemoryRouter initialEntries={[url]}>
            <ServerApp initialData={initialData} />
        </MemoryRouter>
    );
}
