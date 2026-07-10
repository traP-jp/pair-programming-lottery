import { createLotteryHandlers } from "@server/core/handlers/lottery";
import { createPostMessageHandlers } from "@server/core/handlers/postMessage";
import { createResultsHandlers } from "@server/core/handlers/results";
import { createScheduleHandlers } from "@server/core/handlers/schedule";
import { createLotteryPresenter } from "@server/core/presenters/lottery";
import { createPostMessagePresenter } from "@server/core/presenters/postMessage";
import { createResultsPresenter } from "@server/core/presenters/results";
import { createSchedulePresenter } from "@server/core/presenters/schedule";
import { lotteryResponseRepository, scheduleRepository } from "@server/core/repository";
import { createLotteryService } from "@server/core/services/lottery";
import { createSchedulerService } from "@server/core/services/scheduler";
import { createTraqService } from "@server/core/services/traq";
import { TraqClient } from "@server/external/traq";
import { createApp } from "@server/routes";
import { createAdminRoutes } from "@server/routes/admin";
import { createPublicRoutes } from "@server/routes/public";
import { getEnv } from "@server/utilities/env";

// Services
const traqClient = new TraqClient(getEnv("TRAQ_ACCESS_TOKEN"));
const traqService = createTraqService(traqClient);
const lotteryService = createLotteryService();
const schedulerService = createSchedulerService(
    scheduleRepository,
    lotteryResponseRepository,
    traqService
);

// Handlers
const resultsHandlers = createResultsHandlers(lotteryResponseRepository, traqService);
const scheduleHandlers = createScheduleHandlers(scheduleRepository, traqService, schedulerService);
const lotteryHandlers = createLotteryHandlers(
    lotteryResponseRepository,
    traqService,
    lotteryService
);
const postMessageHandlers = createPostMessageHandlers(traqService);

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
    postMessagePresenter
);

const app = createApp(publicRoutes, adminRoutes);

schedulerService.startScheduler();

const port = Number(getEnv("PORT", { fallback: 3000 }));

export default { port, fetch: app.fetch };

console.log(`🚀 Server running at http://localhost:${port}`);
