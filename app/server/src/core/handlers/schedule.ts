import { ApiErrorMessages } from "@server/error/messages";
import type { IScheduleRepository } from "@server/core/repository/schedule";
import type { Prisma } from "@server/generated/prisma/client";
import { getCurrentYearMonthJst } from "@server/utilities/time";

export interface IScheduleTraqService {
    postLotteryMessage(channelId: string): Promise<string>;
}

export interface IScheduleSchedulerService {
    runScheduledLottery(
        channelId: string,
        messageId: string,
        yearMonth: string,
    ): Promise<{ id: string } | null>;
}

export const createScheduleHandlers = (
    scheduleRepo: IScheduleRepository,
    traqService: IScheduleTraqService,
    schedulerService: IScheduleSchedulerService,
) => {
    const getScheduleHandler = () => {
        return scheduleRepo.get();
    };

    const postScheduleHandler = (
        data: Omit<Prisma.ScheduleUpsertArgs["create"], "id">,
    ) => {
        return scheduleRepo.upsert(data);
    };

    const triggerPostHandler = async () => {
        const schedule = await getScheduleHandler();
        if (!schedule)
            throw ApiErrorMessages.SCHEDULE_NOT_FOUND.asHttpException(400);

        const messageId = await traqService.postLotteryMessage(schedule.channelId);

        await scheduleRepo.update({
            lastMessageId: messageId,
            lastPostedAt: new Date(),
        });

        return messageId;
    };

    const triggerLotteryHandler = async () => {
        const schedule = await scheduleRepo.get();
        if (!schedule)
            throw ApiErrorMessages.SCHEDULE_NOT_FOUND.asHttpException(400);
        if (!schedule.lastMessageId)
            throw ApiErrorMessages.NO_MESSAGE_POSTED.asHttpException(400);

        const yearMonth = getCurrentYearMonthJst(new Date());

        const saved = await schedulerService.runScheduledLottery(
            schedule.channelId,
            schedule.lastMessageId,
            yearMonth,
        );

        if (!saved) {
            throw ApiErrorMessages.NO_ENOUGH_PARTICIPANTS.asHttpException(400);
        }

        return saved.id;
    };

    return {
        getScheduleHandler,
        postScheduleHandler,
        triggerPostHandler,
        triggerLotteryHandler,
    };
};
