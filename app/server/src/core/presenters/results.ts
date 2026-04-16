import { getResultHandler, getResultsHandler } from "../handlers/results";
import { createFactory } from "hono/factory";
import { validateGetResultParams } from "../validators/results";
import { validator } from "hono/validator";

const factory = createFactory();

export const getResults = factory.createHandlers(async (c) => {
    return c.json(await getResultsHandler());
});

export const getResult = factory.createHandlers(
    validator("param", validateGetResultParams),
    async (c) => {
        const params = c.req.valid("param");
        const results = await getResultHandler(params.id);
        return c.json(results ?? []);
    },
);
