import { Hono } from "hono";
import { cors } from "hono/cors";
import { routes as publicRoutes } from "./public";
import { routes as adminRoutes } from "./admin";
import { ApplicationError } from "../error/structure";
import { HTTPException } from "hono/http-exception";

export const app = new Hono().basePath("/api");

app.use("/*", cors());

app.onError((err, c) => {
    if (err instanceof HTTPException) {
        return err.getResponse();
    }

    console.error(err);
    return c.text("Internal Server Error", 500);
});

export const routes = app
    .get("/health", (c) => c.json({ ok: true }))
    .route("/", publicRoutes)
    .route("/", adminRoutes);

export type Routes = typeof routes;
