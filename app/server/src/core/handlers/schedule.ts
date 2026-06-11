import { ApiErrorMessages } from "@server/error/messages";
import { ApplicationError } from "@server/error/structure";
import type { IScheduleRepository } from "@server/repository/schedule";
import type { ILotteryResponseRepository } from "@server/repository/lotteryResponse";
import { postLotteryMessage } from "@server/external/traq";
import type { Prisma, Schedule } from "@server/generated/prisma/client";
import type { Optional } from "@server/generated/prisma/client/runtime/client";
import { runScheduledLottery } from "@server/core/services/scheduler";
import { getStampMap, traq } from "@server/core/services/traq";
import { getCurrentYearMonthJst } from "@server/core/services/time";

export type PostScheduleBody = Parameters<IScheduleRepository["upsert"]>;

export const createScheduleHandlers = (
    scheduleRepo: IScheduleRepository,
    lotteryResponseRepo: ILotteryResponseRepository,
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

        const { stampNameToId } = await getStampMap();
        const messageId = await postLotteryMessage(
            traq,
            schedule.channelId,
            stampNameToId,
        );

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

        const saved = await runScheduledLottery(
            scheduleRepo,
            lotteryResponseRepo,
            traq,
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
