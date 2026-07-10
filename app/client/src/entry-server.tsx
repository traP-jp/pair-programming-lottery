import { renderToString } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";

import { getResult, getResults } from "@client/api";
import { type InitialData, paths } from "@client/routeDefinitions";
import { ServerApp } from "@client/serverRouter";

export async function loadInitialData(url: string): Promise<InitialData> {
    const pathname = new URL(url, "http://localhost").pathname;

    try {
        if (pathname === paths.results || pathname === paths.home) {
            return { results: await getResults() };
        }

        const match = pathname.match(/^\/results\/([^/]+)$/);
        if (match?.[1]) {
            return { result: await getResult(match[1]) };
        }
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
