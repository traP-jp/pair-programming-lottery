import { ApiErrorMessages } from "../../error/messages";
import { collectUserPrefs } from "../../external/traq";
import { formatResult } from "../services/lottery/format";
import { runLottery as runLotteryService } from "../services/lottery/matching";
import {
    getBotUserIds,
    getStampMap,
    getUserNameMap,
    traq,
} from "../services/traq";

export const runLotteryHandler = async (messageId: string) => {
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
