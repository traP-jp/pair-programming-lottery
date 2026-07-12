import { StrictMode } from "react";
import { hydrateRoot } from "react-dom/client";

import { Root } from "@client/router";

import type { InitialData } from "./router/routes";

import "@client/index.css";

if ("serviceWorker" in navigator) {
    void navigator.serviceWorker
        .register("/sw.js")
        .then(async registration => {
            await navigator.serviceWorker.ready;

            const urls = performance
                .getEntriesByType("resource")
                .map(entry => entry.name)
                .filter(url => new URL(url).origin === location.origin);
            registration.active?.postMessage({
                type: "cache-current-page",
                page: location.href,
                urls,
            });
        })
        .catch(error => console.error("Failed to register service worker", error));
}

declare global {
    interface Window {
        __INITIAL_DATA__?: InitialData;
    }
}

hydrateRoot(
    document.querySelector("#root")!,
    <StrictMode>
        <Root initialData={window.__INITIAL_DATA__} />
    </StrictMode>
);
