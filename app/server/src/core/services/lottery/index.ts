import { runLottery } from "@server/core/services/lottery/matching";
import { formatResult } from "@server/core/services/lottery/format";
import type { UserPrefs, MatchingResult } from "@server/types";
import type { LotteryResult } from "@server/core/services/lottery/format";

export function createLotteryService() {
    return {
        runLottery(users: UserPrefs[]): MatchingResult {
            return runLottery(users);
        },
        formatResult(
            result: MatchingResult,
            userNameMap: Map<string, string>,
        ): LotteryResult {
            return formatResult(result, userNameMap);
        },
    };
}
