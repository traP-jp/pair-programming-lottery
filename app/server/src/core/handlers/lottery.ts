import { ApiErrorMessages } from "@server/error/messages";
import { collectUserPrefs } from "@server/external/traq";
import { formatResult } from "@server/core/services/lottery/format";
import { runLottery as runLotteryService } from "@server/core/services/lottery/matching";
import type { TraqService } from "@server/core/services/traq";

export const createLotteryHandlers = (traqService: TraqService) => {
    const runLotteryHandler = async (messageId: string) => {
        const { stampIdToName } = await traqService.getStampMap();
        const botUserIds = await traqService.getBotUserIds();
        const users = await collectUserPrefs(
            traqService.client,
            messageId,
            stampIdToName,
            botUserIds,
        );

        const userCount = users.length;

        if (userCount < 2) {
            throw ApiErrorMessages.TARGET_USERS_MUST_BE_MULTIPLE(
                messageId,
                userCount,
            );
        }

        const userNameMap = await traqService.getUserNameMap();
        const result = runLotteryService(users);

        return formatResult(result, userNameMap);
    };

    return { runLotteryHandler };
};
