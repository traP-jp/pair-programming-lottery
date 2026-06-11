import { Hono } from "hono";
import { cors } from "hono/cors";
import { HTTPException } from "hono/http-exception";
import type { PublicRoutes } from "./public";
import type { AdminRoutes } from "./admin";

export const createApp = (
    publicRoutes: PublicRoutes,
    adminRoutes: AdminRoutes,
) => {
    const app = new Hono().basePath("/api");

    app.use("/*", cors());

    app.onError((err, c) => {
        if (err instanceof HTTPException) {
            return err.getResponse();
        }

        console.error(err);
        return c.json({ message: "Internal Server Error" }, 500);
    });

    const routes = app
        .get("/health", (c) => c.json({ ok: true }))
        .route("/", publicRoutes)
        .route("/", adminRoutes);

    return routes;
};

export type Routes = ReturnType<typeof createApp>;
