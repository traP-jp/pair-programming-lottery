import { postLotteryMessage } from "@server/external/traq";
import type { TraqService } from "@server/core/services/traq";

export const createPostMessageHandlers = (traqService: TraqService) => {
    const postMessageHandler = async (channelId: string) => {
        const { stampNameToId } = await traqService.getStampMap();
        const messageId = await postLotteryMessage(
            traqService.client,
            channelId,
            stampNameToId,
        );
        return messageId;
    };

    return { postMessageHandler };
};
