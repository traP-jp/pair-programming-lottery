import { postLotteryMessage } from "../../external/traq";
import { getStampMap, traq } from "../services/traq";

export const postMessageHandler = async (channelId: string) => {
    const { stampNameToId } = await getStampMap();
    const messageId = await postLotteryMessage(traq, channelId, stampNameToId);
    return messageId;
};
