import { startScheduler } from "@server/core/services/scheduler";
import { createApiClient } from "@server/external/traq";
import { TRAQ_ACCESS_TOKEN } from "@server/config";
import { createApp } from "@server/routes";
import { createPublicRoutes } from "@server/routes/public";
import { createAdminRoutes } from "@server/routes/admin";
import { createResultsPresenter } from "@server/core/presenters/results";
import { createSchedulePresenter } from "@server/core/presenters/schedule";
import { createLotteryPresenter } from "@server/core/presenters/lottery";
import { createPostMessagePresenter } from "@server/core/presenters/post-message";
import { createResultsHandlers } from "@server/core/handlers/results";
import { createScheduleHandlers } from "@server/core/handlers/schedule";
import { createLotteryHandlers } from "@server/core/handlers/lottery";
import { createPostMessageHandlers } from "@server/core/handlers/post-message";
import { getEnv } from "@server/utilities/env";
import {
    scheduleRepository,
    lotteryResponseRepository,
} from "@server/repository";

// Infrastructure
const traq = createApiClient(TRAQ_ACCESS_TOKEN);

// Handlers
const resultsHandlers = createResultsHandlers(lotteryResponseRepository);
const scheduleHandlers = createScheduleHandlers(
    scheduleRepository,
    lotteryResponseRepository,
);
const lotteryHandlers = createLotteryHandlers();
const postMessageHandlers = createPostMessageHandlers();

// Presenters
const resultsPresenter = createResultsPresenter(resultsHandlers);
const schedulePresenter = createSchedulePresenter(scheduleHandlers);
const lotteryPresenter = createLotteryPresenter(lotteryHandlers);
const postMessagePresenter = createPostMessagePresenter(postMessageHandlers);

// Routers
const publicRoutes = createPublicRoutes(resultsPresenter);
const adminRoutes = createAdminRoutes(
    resultsPresenter,
    schedulePresenter,
    lotteryPresenter,
    postMessagePresenter,
);

const app = createApp(publicRoutes, adminRoutes);

startScheduler(scheduleRepository, lotteryResponseRepository, traq);

const port = Number(getEnv("PORT", { fallback: 3000 }));

export default { port, fetch: app.fetch };

console.log(`🚀 Server running at http://localhost:${port}`);
