import { postLotteryMessage } from "@server/external/traq";
import { getStampMap, traq } from "@server/core/services/traq";

export const createPostMessageHandlers = () => {
    const postMessageHandler = async (channelId: string) => {
        const { stampNameToId } = await getStampMap();
        const messageId = await postLotteryMessage(traq, channelId, stampNameToId);
        return messageId;
    };

    return { postMessageHandler };
};
