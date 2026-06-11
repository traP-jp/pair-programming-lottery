import { Hono, type HonoRequest } from "hono";
import { getEnv } from "@server/utilities/env";
import { adminOnlyMiddleware } from "@server/core/middlewares/admin";
import type { createResultsPresenter } from "@server/core/presenters/results";
import type { createSchedulePresenter } from "@server/core/presenters/schedule";
import type { createLotteryPresenter } from "@server/core/presenters/lottery";
import type { createPostMessagePresenter } from "@server/core/presenters/post-message";

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
