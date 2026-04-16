import { createFactory } from "hono/factory";
import { getScheduleHandler, postScheduleHandler } from "../handlers/schedule";
import { validatePostMessageBody } from "../validators/post-message";
import { validator } from "hono/validator";
import { validatePostScheduleBody } from "../validators/schedule";

const factory = createFactory();

export const getSchedule = factory.createHandlers(async (c) => {
    const schedule = await getScheduleHandler();
    return c.json(schedule ?? null);
});

export const putSchedule = factory.createHandlers(
    validator("json", validatePostScheduleBody),
    async (c) => {
        const date = c.req.valid("json");
        const schedule = await postScheduleHandler(date);
        return c.json(schedule);
    },
);
