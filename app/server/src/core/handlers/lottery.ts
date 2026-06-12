import type { LotteryResult } from "@server/core/services/lottery/format";
import { ApiErrorMessages } from "@server/error/messages";
import type { MatchingResult, UserPrefs } from "@server/types";

export interface ILotteryService {
    runLottery(users: UserPrefs[]): MatchingResult;
    formatResult(result: MatchingResult, userNameMap: Map<string, string>): LotteryResult;
}

export interface ILotteryTraqService {
    collectUserPrefs(messageId: string): Promise<UserPrefs[]>;
    getuserNameMap(): Promise<Map<string, string>>;
}

export const createLotteryHandlers = (
    traqService: ILotteryTraqService,
    lotteryService: ILotteryService
) => {
    const runLotteryHandler = async (messageId: string) => {
        const users = await traqService.collectUserPrefs(messageId);

        const userCount = users.length;

        if (userCount < 2) {
            throw ApiErrorMessages.TARGET_USERS_MUST_BE_MULTIPLE(messageId, userCount);
        }

        const userNameMap = await traqService.getuserNameMap();
        const result = lotteryService.runLottery(users);

        return lotteryService.formatResult(result, userNameMap);
    };

    return { runLotteryHandler };
};
