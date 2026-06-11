import { createFactory } from "hono/factory";
import { validator } from "hono/validator";
import { validatePostScheduleBody } from "../validators/schedule";
import type { createScheduleHandlers } from "../handlers/schedule";

export const createSchedulePresenter = (
    handlers: ReturnType<typeof createScheduleHandlers>
) => {
    const factory = createFactory();

    const getSchedule = factory.createHandlers(async (c) => {
        const schedule = await handlers.getScheduleHandler();
        return c.json(schedule ?? null);
    });

    const putSchedule = factory.createHandlers(
        validator("json", validatePostScheduleBody),
        async (c) => {
            const date = c.req.valid("json");
            const schedule = await handlers.postScheduleHandler(date);
            return c.json(schedule);
        },
    );

    const triggerPost = factory.createHandlers(async (c) => {
        const messageId = await handlers.triggerPostHandler();
        return c.json({ messageId });
    });

    const triggerLottery = factory.createHandlers(async (c) => {
        const responseId = await handlers.triggerLotteryHandler();
        return c.json({ responseId });
    });

    return { getSchedule, putSchedule, triggerPost, triggerLottery };
};
