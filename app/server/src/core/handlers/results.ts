import { prisma } from "../../external/db";
import { getCurrentYearMonthJst } from "../services/time";
import type { LotteryResponse } from "../services/lottery/format";
import { traq } from "../services/traq";

export const getResultsHandler = () => {
    const records = prisma.lotteryResponse.findMany({
        orderBy: { createdAt: "desc" },
        take: 20,
        select: { id: true, createdAt: true, channelId: true, month: true },
    });
    return records;
};

export const getResultHandler = async (id: string) => {
    const record = await prisma.lotteryResponse.findUnique({
        where: { id },
    });
    if (!record) return null;
    return record;
};

export const saveResultHandler = async (
    messageId: string,
    result: LotteryResponse,
) => {
    const messageRes = await traq.messages.getMessage(messageId);
    const message = ("data" in messageRes ? messageRes.data : messageRes) as {
        channelId: string;
    } | null;

    if (!message) {
        throw new Error(`message not found: ${messageId}`);
    }

    return prisma.lotteryResponse.create({
        data: {
            channelId: message.channelId,
            month: getCurrentYearMonthJst(),
            result: result as any,
        },
    });
};
