import { ApiErrorMessages } from "../../error/messages";
import { ApplicationError } from "../../error/structure";
import { prisma } from "../../external/db";
import { postLotteryMessage } from "../../external/traq";
import type { Prisma, Schedule } from "../../generated/prisma/client";
import type { Optional } from "../../generated/prisma/client/runtime/client";
import { runScheduledLottery } from "../services/scheduler";
import { getStampMap, traq } from "../services/traq";

export const getScheduleHandler = () => {
    return prisma.schedule.findUnique({ where: { id: 1 } });
};

export type PostScheduleBody = Parameters<typeof prisma.schedule.upsert>;

export const postScheduleHandler = (
    data: Omit<Prisma.ScheduleUpsertArgs["create"], "id">,
) => {
    return prisma.schedule.upsert({
        where: { id: 1 },
        create: { id: 1, ...data },
        update: data,
    });
};

export const triggerPostHandler = async () => {
    const schedule = await getScheduleHandler();
    if (!schedule) return null;

    const { stampNameToId } = await getStampMap();
    const messageId = await postLotteryMessage(
        traq,
        schedule.channelId,
        stampNameToId,
    );

    await prisma.schedule.update({
        where: { id: 1 },
        data: { lastMessageId: messageId, lastPostedAt: new Date() },
    });

    return messageId;
};

export const triggerLotteryHandler = async () => {
    const schedule = await prisma.schedule.findUnique({ where: { id: 1 } });
    if (!schedule) throw ApiErrorMessages.SCHEDULE_NOT_FOUND;
    if (!schedule.lastMessageId) throw ApiErrorMessages.NO_MESSAGE_POSTED;

    const now = new Date(Date.now() + 9 * 60 * 60 * 1000);
    const yearMonth = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`;

    const saved = await runScheduledLottery(
        traq,
        schedule.channelId,
        schedule.lastMessageId,
        yearMonth,
    );

    if (!saved) throw ApiErrorMessages.NO_ENOUGH_PARTICIPANTS;
    return saved.id;
};
