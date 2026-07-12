import { StrictMode } from "react";
import { hydrateRoot } from "react-dom/client";

import { Root } from "@client/router";
import { cacheCurrentPage } from "@client/utils/serviceWorker";

import type { InitialData } from "./router/routes";

import "@client/index.css";

if ("serviceWorker" in navigator && !import.meta.env.DEV) {
    void navigator.serviceWorker
        .register("/sw.js", { scope: "/", updateViaCache: "none" })
        .then(async () => {
            await navigator.serviceWorker.ready;
            if (document.readyState === "complete") {
                cacheCurrentPage();
            } else {
                window.addEventListener("load", cacheCurrentPage);
            }
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
