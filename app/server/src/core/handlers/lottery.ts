import type { LotteryResponse } from "@server/core/repository/lotteryResponse";
import type { LotteryResult } from "@server/core/services/lottery/format";
import { ApiErrorMessages } from "@server/error/messages";
import type { MatchingResult, UserPrefs } from "@server/types";

export interface ILotteryService {
    runLottery(users: UserPrefs[], pastLotteries: LotteryResponse[]): MatchingResult;
    formatResult(result: MatchingResult, userNameMap: Map<string, string>): LotteryResult;
}

export interface ILotteryTraqService {
    collectUserPrefs(messageId: string): Promise<UserPrefs[]>;
    getUserNameMap(): Promise<Map<string, string>>;
}

export interface ILotteryResponseRepository {
    findRecentResultsWithDetail(limit: number): Promise<LotteryResponse[]>;
}

export const createLotteryHandlers = (
    lotteryResponseRepository: ILotteryResponseRepository,
    traqService: ILotteryTraqService,
    lotteryService: ILotteryService
) => {
    const runLotteryHandler = async (messageId: string) => {
        const users = await traqService.collectUserPrefs(messageId);

        const userCount = users.length;

        if (userCount < 2) {
            throw ApiErrorMessages.TARGET_USERS_MUST_BE_MULTIPLE(messageId, userCount);
        }

        const userNameMap = await traqService.getUserNameMap();

        // 過去3回分の抽選結果を取得してペナルティ計算に利用する
        const pastLotteries = await lotteryResponseRepository.findRecentResultsWithDetail(3);

        const result = lotteryService.runLottery(users, pastLotteries);

        return lotteryService.formatResult(result, userNameMap);
    };

    return { runLotteryHandler };
};
