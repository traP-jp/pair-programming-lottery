export interface IPostMessageTraqService {
    postLotteryMessage(channelId: string): Promise<string>;
}

export const createPostMessageHandlers = (traqService: IPostMessageTraqService) => {
    const postMessageHandler = async (channelId: string) => {
        const messageId = await traqService.postLotteryMessage(channelId);
        return messageId;
    };

    return { postMessageHandler };
};
