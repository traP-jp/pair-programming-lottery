import { createFactory } from "hono/factory";
import {
    getScheduleHandler,
    postScheduleHandler,
    triggerLotteryHandler,
    triggerPostHandler,
} from "../handlers/schedule";
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

export const triggerPost = factory.createHandlers(async (c) => {
    const messageId = await triggerPostHandler();
    return c.json({ messageId });
});

export const triggerLottery = factory.createHandlers(async (c) => {
    const responseId = await triggerLotteryHandler();
    return c.json({ responseId });
});
