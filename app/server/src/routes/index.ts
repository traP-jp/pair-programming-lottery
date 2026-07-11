import { Hono } from "hono";
import { cors } from "hono/cors";
import { HTTPException } from "hono/http-exception";

import type { AdminRoutes } from "./admin";
import type { PublicRoutes } from "./public";

export const createApp = (publicRoutes: PublicRoutes, adminRoutes: AdminRoutes) => {
    const app = new Hono().basePath("/api");

    app.use("/*", cors());

    app.onError((error, c) => {
        if (error instanceof HTTPException) {
            return error.getResponse();
        }

        console.error(error);
        return c.json({ message: "Internal Server Error" }, 500);
    });

    const routes = app
        .get("/health", c => c.json({ ok: true }))
        .route("/public", publicRoutes)
        .route("/admin", adminRoutes);

    return routes;
};

export type Routes = ReturnType<typeof createApp>;
