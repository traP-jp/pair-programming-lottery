import { Hono, type HonoRequest } from "hono";
import { getEnv } from "../utilities/env";
import { adminOnlyMiddleware } from "../core/middlewares/admin";
import type { createResultsPresenter } from "../core/presenters/results";
import type { createSchedulePresenter } from "../core/presenters/schedule";
import type { createLotteryPresenter } from "../core/presenters/lottery";
import type { createPostMessagePresenter } from "../core/presenters/post-message";

export const createAdminRoutes = (
    resultsPresenter: ReturnType<typeof createResultsPresenter>,
    schedulePresenter: ReturnType<typeof createSchedulePresenter>,
    lotteryPresenter: ReturnType<typeof createLotteryPresenter>,
    postMessagePresenter: ReturnType<typeof createPostMessagePresenter>
) => {
    const app = new Hono();

    app.use("*", adminOnlyMiddleware);

    return app
        .post("/results", ...resultsPresenter.saveResult)
        .post("/lottery", ...lotteryPresenter.runLottery)
        .post("/post-message", ...postMessagePresenter.postMessage)
        .get("/schedule", ...schedulePresenter.getSchedule)
        .put("/schedule", ...schedulePresenter.putSchedule)
        .post("/schedule/trigger-post", ...schedulePresenter.triggerPost)
        .post("/schedule/trigger-lottery", ...schedulePresenter.triggerLottery);
};
