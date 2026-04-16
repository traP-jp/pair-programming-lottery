import { Hono, type HonoRequest } from "hono";
import { validator } from "hono/validator";
import { postLotteryMessage } from "../external/traq";
import { getEnv } from "../utilities/env";
import { prisma } from "../external/db";
import { runScheduledLottery } from "../core/services/scheduler";
import { getSchedule, putSchedule } from "../core/presenters/schedule";
import { postMessage } from "../core/presenters/post-message";
import { runLottery } from "../core/presenters/lottery";

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
    .post("/lottery", ...runLottery)
    .post("/post-message", ...postMessage)
    .get("/schedule", ...getSchedule)
    .put("/schedule", ...putSchedule)
    .post("/schedule/trigger-post")
    .post("/schedule/trigger-lottery");
