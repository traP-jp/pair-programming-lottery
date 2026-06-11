import { createFactory } from "hono/factory";
import { validateGetResultParams, validateSaveResultBody } from "../validators/results";
import { validator } from "hono/validator";
import type { createResultsHandlers } from "../handlers/results";

export const createResultsPresenter = (
    handlers: ReturnType<typeof createResultsHandlers>
) => {
    const factory = createFactory();

    const getResults = factory.createHandlers(async (c) => {
        return c.json(await handlers.getResultsHandler());
    });

    const getResult = factory.createHandlers(
        validator("param", validateGetResultParams),
        async (c) => {
            const params = c.req.valid("param");
            const results = await handlers.getResultHandler(params.id);
            return c.json(results ?? []);
        },
    );

    const saveResult = factory.createHandlers(
        validator("json", validateSaveResultBody),
        async (c) => {
            const body = c.req.valid("json");
            return c.json(await handlers.saveResultHandler(body.messageId, body.result));
        },
    );

    return { getResults, getResult, saveResult };
};
