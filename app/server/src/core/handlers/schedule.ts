import { ApiErrorMessages } from "../../error/messages";
import { ApplicationError } from "../../error/structure";
import { scheduleRepository } from "../../repository/schedule";
import { postLotteryMessage } from "../../external/traq";
import type { Prisma, Schedule } from "../../generated/prisma/client";
import type { Optional } from "../../generated/prisma/client/runtime/client";
import { runScheduledLottery } from "../services/scheduler";
import { getStampMap, traq } from "../services/traq";

export const getScheduleHandler = () => {
    return scheduleRepository.get();
};

export type PostScheduleBody = Parameters<typeof scheduleRepository.upsert>;

export const postScheduleHandler = (
    data: Omit<Prisma.ScheduleUpsertArgs["create"], "id">,
) => {
    return scheduleRepository.upsert(data);
};

export const triggerPostHandler = async () => {
    const schedule = await getScheduleHandler();
    if (!schedule)
        throw ApiErrorMessages.SCHEDULE_NOT_FOUND.asHttpException(400);

    const { stampNameToId } = await getStampMap();
    const messageId = await postLotteryMessage(
        traq,
        schedule.channelId,
        stampNameToId,
    );

    await scheduleRepository.update({
        lastMessageId: messageId,
        lastPostedAt: new Date(),
    });

    return messageId;
};

export const triggerLotteryHandler = async () => {
    const schedule = await scheduleRepository.get();
    if (!schedule)
        throw ApiErrorMessages.SCHEDULE_NOT_FOUND.asHttpException(400);
    if (!schedule.lastMessageId)
        throw ApiErrorMessages.NO_MESSAGE_POSTED.asHttpException(400);

    const now = new Date(Date.now() + 9 * 60 * 60 * 1000);
    const yearMonth = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`;

    const saved = await runScheduledLottery(
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
