import { validatePostScheduleBody } from "@server/core/validators/schedule";
import type { Prisma, Schedule } from "@server/generated/prisma/client";
import { createFactory } from "hono/factory";
import { validator } from "hono/validator";

export interface IScheduleHandlers {
    getScheduleHandler(): Promise<Schedule | null>;
    postScheduleHandler(data: Omit<Prisma.ScheduleUpsertArgs["create"], "id">): Promise<Schedule>;
    triggerPostHandler(): Promise<string>;
    triggerLotteryHandler(): Promise<string>;
}

export const createSchedulePresenter = (handlers: IScheduleHandlers) => {
    const factory = createFactory();

    const getSchedule = factory.createHandlers(async c => {
        const schedule = await handlers.getScheduleHandler();
        return c.json(schedule ?? null);
    });

    const putSchedule = factory.createHandlers(
        validator("json", validatePostScheduleBody),
        async c => {
            const date = c.req.valid("json");
            const schedule = await handlers.postScheduleHandler(date);
            return c.json(schedule);
        }
    );

    const triggerPost = factory.createHandlers(async c => {
        const messageId = await handlers.triggerPostHandler();
        return c.json({ messageId });
    });

    const triggerLottery = factory.createHandlers(async c => {
        const responseId = await handlers.triggerLotteryHandler();
        return c.json({ responseId });
    });

    return { getSchedule, putSchedule, triggerPost, triggerLottery };
};
