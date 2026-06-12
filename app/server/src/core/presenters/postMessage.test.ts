import { describe, expect, it, mock } from "bun:test";

import { Hono } from "hono";

import { type IPostMessageHandlers, createPostMessagePresenter } from "./postMessage";

describe("postMessage presenter", () => {
    it("should process postMessage route successfully", async () => {
        const mockHandlers: IPostMessageHandlers = {
            postMessageHandler: mock(async channelId => `new-msg-${channelId}`),
        };

        const presenter = createPostMessagePresenter(mockHandlers);
        const app = new Hono().post("/post-message", ...presenter.postMessage);

        const response = await app.request("/post-message", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ channelId: "chan-123" }),
        });

        expect(response.status).toBe(200);
        const body = await response.json();
        expect(body).toEqual({ messageId: "new-msg-chan-123" });
        expect(mockHandlers.postMessageHandler).toHaveBeenCalledWith("chan-123");
    });
});
