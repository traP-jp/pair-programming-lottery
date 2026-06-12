import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import "@client/index.css";
import { Root } from "@client/router";

createRoot(document.querySelector("#root")!).render(
    <StrictMode>
        <Root />
    </StrictMode>
);
