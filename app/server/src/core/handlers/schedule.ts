import { ApiErrorMessages } from "../../error/messages";
import { ApplicationError } from "../../error/structure";
import type { IScheduleRepository } from "../../repository/schedule";
import type { ILotteryResponseRepository } from "../../repository/lotteryResponse";
import { postLotteryMessage } from "../../external/traq";
import type { Prisma, Schedule } from "../../generated/prisma/client";
import type { Optional } from "../../generated/prisma/client/runtime/client";
import { runScheduledLottery } from "../services/scheduler";
import { getStampMap, traq } from "../services/traq";

export type PostScheduleBody = Parameters<IScheduleRepository["upsert"]>;

export const createScheduleHandlers = (
    scheduleRepo: IScheduleRepository,
    lotteryResponseRepo: ILotteryResponseRepository
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

        const now = new Date(Date.now() + 9 * 60 * 60 * 1000);
        const yearMonth = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`;

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

    return { getScheduleHandler, postScheduleHandler, triggerPostHandler, triggerLotteryHandler };
};
