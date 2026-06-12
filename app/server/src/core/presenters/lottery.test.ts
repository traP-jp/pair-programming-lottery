import { describe, expect, it, mock } from "bun:test";

import { Hono } from "hono";

import { type ILotteryHandlers, createLotteryPresenter } from "./lottery";

describe("lottery presenter", () => {
    it("should process runLottery route successfully", async () => {
        const mockHandlers: ILotteryHandlers = {
            runLotteryHandler: mock(async messageId => ({ pairs: [], participantCount: 0 }) as any),
        };

        const presenter = createLotteryPresenter(mockHandlers);
        const app = new Hono().post("/lottery", ...presenter.runLottery);

        const response = await app.request("/lottery", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ messageId: "msg-123" }),
        });

        expect(response.status).toBe(200);
        const body = await response.json();
        expect(body).toEqual({ pairs: [], participantCount: 0 });
        expect(mockHandlers.runLotteryHandler).toHaveBeenCalledWith("msg-123");
    });
});
