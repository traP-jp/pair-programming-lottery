import type { ILotteryResponseRepository } from "@server/repository/lotteryResponse";
import { getCurrentYearMonthJst } from "@server/core/services/time";
import type { LotteryResponse } from "@server/core/services/lottery/format";
import { traq } from "@server/core/services/traq";

export const createResultsHandlers = (lotteryResponseRepo: ILotteryResponseRepository) => {
    const getResultsHandler = async () => {
        const records = await lotteryResponseRepo.findMany({
            orderBy: { createdAt: "desc" },
            take: 20,
        });
        return records;
    };

    const getResultHandler = async (id: string) => {
        const record = await lotteryResponseRepo.findById(id);
        if (!record) return null;
        return record;
    };

    const saveResultHandler = async (messageId: string, result: LotteryResponse) => {
        const messageRes = await traq.messages.getMessage(messageId);
        const message = ("data" in messageRes ? messageRes.data : messageRes) as {
            channelId: string;
        } | null;

        if (!message) {
            throw new Error(`message not found: ${messageId}`);
        }

        return lotteryResponseRepo.create({
            channelId: message.channelId,
            month: getCurrentYearMonthJst(),
            result: result as any,
        });
    };

    return { getResultsHandler, getResultHandler, saveResultHandler };
};
