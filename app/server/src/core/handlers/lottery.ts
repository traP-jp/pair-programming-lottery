import { ApiErrorMessages } from "@server/error/messages";
import { collectUserPrefs } from "@server/external/traq";
import { formatResult } from "@server/core/services/lottery/format";
import { runLottery as runLotteryService } from "@server/core/services/lottery/matching";
import {
    getBotUserIds,
    getStampMap,
    getUserNameMap,
    traq,
} from "@server/core/services/traq";

export const createLotteryHandlers = () => {
    const runLotteryHandler = async (messageId: string) => {
        const { stampIdToName } = await getStampMap();
        const botUserIds = await getBotUserIds();
        const users = await collectUserPrefs(
            traq,
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

        const userNameMap = await getUserNameMap();
        const result = runLotteryService(users);

        return formatResult(result, userNameMap);
    };

    return { runLotteryHandler };
};
