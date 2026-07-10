import type { LotteryResponse } from "@server/core/repository/lotteryResponse";
import { formatResult } from "@server/core/services/lottery/format";
import type { LotteryResult } from "@server/core/services/lottery/format";
import { runLottery } from "@server/core/services/lottery/matching";
import { getPairKey } from "@server/core/services/lottery/pairKey";
import type { MatchingResult, UserPrefs } from "@server/types";

export function buildPastPairHistory(pastLotteries: LotteryResponse[]): Map<string, number> {
    const history = new Map<string, number>();

    pastLotteries.forEach((lottery, index) => {
        const ago = index;
        const result = lottery.result;
        for (const pair of result.pairs) {
            if (pair.members.length === 2) {
                const u1 = pair.members[0]!.id;
                const u2 = pair.members[1]!.id;
                const key = getPairKey(u1, u2);
                if (!history.has(key)) {
                    history.set(key, ago);
                }
            }
        }
    });

    return history;
}

export function createLotteryService() {
    return {
        runLottery(users: UserPrefs[], pastLotteries: LotteryResponse[] = []): MatchingResult {
            const pastPairs = buildPastPairHistory(pastLotteries);
            return runLottery(users, pastPairs);
        },
        formatResult(result: MatchingResult, userNameMap: Map<string, string>): LotteryResult {
            return formatResult(result, userNameMap);
        },
    };
}
