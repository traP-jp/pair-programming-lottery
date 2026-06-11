import { startScheduler } from "./core/services/scheduler";
import { createApiClient } from "./external/traq";
import { TRAQ_ACCESS_TOKEN } from "./config";
import { createApp } from "./routes";
import { createPublicRoutes } from "./routes/public";
import { createAdminRoutes } from "./routes/admin";
import { createResultsPresenter } from "./core/presenters/results";
import { createSchedulePresenter } from "./core/presenters/schedule";
import { createLotteryPresenter } from "./core/presenters/lottery";
import { createPostMessagePresenter } from "./core/presenters/post-message";
import { createResultsHandlers } from "./core/handlers/results";
import { createScheduleHandlers } from "./core/handlers/schedule";
import { createLotteryHandlers } from "./core/handlers/lottery";
import { createPostMessageHandlers } from "./core/handlers/post-message";
import { getEnv } from "./utilities/env";
import { scheduleRepository, lotteryResponseRepository } from "./repository";

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
