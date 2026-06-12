import { describe, expect, it, mock } from "bun:test";

import { type IPostMessageTraqService, createPostMessageHandlers } from "./postMessage";

describe("postMessage handlers", () => {
    it("should successfully call postLotteryMessage and return messageId", async () => {
        const mockTraqService: IPostMessageTraqService = {
            postLotteryMessage: mock(async channelId => `msg-${channelId}`),
        };

        const handlers = createPostMessageHandlers(mockTraqService);
        const result = await handlers.postMessageHandler("chan-123");

        expect(result).toBe("msg-chan-123");
        expect(mockTraqService.postLotteryMessage).toHaveBeenCalledWith("chan-123");
    });
});
