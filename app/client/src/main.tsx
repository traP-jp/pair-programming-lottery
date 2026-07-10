import { StrictMode } from "react";
import { hydrateRoot } from "react-dom/client";

import { type InitialData, Root } from "@client/router";

import "@client/index.css";

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
