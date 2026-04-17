import { Hono, type HonoRequest } from "hono";
import { getEnv } from "../utilities/env";
import {
    getSchedule,
    putSchedule,
    triggerLottery,
    triggerPost,
} from "../core/presenters/schedule";
import { postMessage } from "../core/presenters/post-message";
import { runLottery } from "../core/presenters/lottery";
import { saveResult } from "../core/presenters/results";

const ADMINS = getEnv("ADMINS").split(",");

function isAdmin(request: HonoRequest): boolean {
    const userId = request.header("X-Forwarded-User") ?? "";
    return ADMINS.includes(userId);
}

const app = new Hono();

app.use("*", async (context, next) => {
    if (!isAdmin(context.req))
        return context.json({ error: "Unauthorized" }, 401);

    await next();
});

export const routes = app
    .post("/results", ...saveResult)
    .post("/lottery", ...runLottery)
    .post("/post-message", ...postMessage)
    .get("/schedule", ...getSchedule)
    .put("/schedule", ...putSchedule)
    .post("/schedule/trigger-post", ...triggerPost)
    .post("/schedule/trigger-lottery", ...triggerLottery);
