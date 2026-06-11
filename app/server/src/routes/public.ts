import { Hono } from "hono";
import type { createResultsPresenter } from "@server/core/presenters/results";

export const createPublicRoutes = (
    resultsPresenter: ReturnType<typeof createResultsPresenter>,
) => {
    const app = new Hono();

    return app
        .get("/results", ...resultsPresenter.getResults)
        .get("/results/:id", ...resultsPresenter.getResult);
};
