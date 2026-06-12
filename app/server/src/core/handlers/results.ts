import type { ILotteryResponseRepository } from "@server/core/repository/lotteryResponse";
import { getCurrentYearMonthJst } from "@server/utilities/time";
import type { LotteryResult } from "@server/core/services/lottery/format";

export interface IResultsTraqService {
    getChannelId(messageId: string): Promise<string>;
}

export const createResultsHandlers = (
    lotteryResponseRepo: ILotteryResponseRepository,
    traqService: IResultsTraqService,
) => {
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

    const saveResultHandler = async (
        messageId: string,
        result: LotteryResult,
    ) => {
        const channelId = await traqService.getChannelId(messageId);

        return lotteryResponseRepo.create({
            channelId,
            month: getCurrentYearMonthJst(),
            result,
        });
    };

    return { getResultsHandler, getResultHandler, saveResultHandler };
};
