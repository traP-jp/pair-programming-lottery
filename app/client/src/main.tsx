import { StrictMode } from "react";
import { hydrateRoot } from "react-dom/client";

import { Root } from "@client/router";

import type { InitialData } from "./router/routes";

import "@client/index.css";

if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
        void navigator.serviceWorker.register("/sw.js");
    });
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
