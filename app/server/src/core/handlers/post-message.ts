import { postLotteryMessage } from "@server/external/traq";
export interface IPostMessageTraqService {
    client: any;
    getStampMap(): Promise<{ stampNameToId: Map<string, string> }>;
}

export const createPostMessageHandlers = (traqService: IPostMessageTraqService) => {
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
