import { startScheduler } from "./core/services/scheduler";
import { createApiClient } from "./external/traq";
import { TRAQ_ACCESS_TOKEN } from "./config";
import { app } from "./routes";
import { getEnv } from "./utilities/env";

const traq = createApiClient(TRAQ_ACCESS_TOKEN);
startScheduler(traq);

const port = Number(getEnv("PORT", { fallback: 3000 }));

export default { port, fetch: app.fetch };

console.log(`🚀 Server running at http://localhost:${port}`);
