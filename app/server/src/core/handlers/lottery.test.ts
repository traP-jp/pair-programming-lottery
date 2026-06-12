import { describe, expect, it, mock } from "bun:test";

import { type ILotteryService, type ILotteryTraqService, createLotteryHandlers } from "./lottery";

describe("lottery handlers", () => {
    it("should throw error if userCount < 2", async () => {
        const mockTraqService: ILotteryTraqService = {
            collectUserPrefs: mock(async () => [{ id: "u1" } as any]),
            getuserNameMap: mock(async () => new Map()),
        };
        const mockLotteryService: ILotteryService = {
            runLottery: mock(() => ({}) as any),
            formatResult: mock(() => ({}) as any),
        };

        const handlers = createLotteryHandlers(mockTraqService, mockLotteryService);
        expect(handlers.runLotteryHandler("msg-123")).rejects.toThrow();
    });

    it("should successfully run lottery and return formatted result if userCount >= 2", async () => {
        const users = [{ id: "u1" }, { id: "u2" }] as any[];
        const userNameMap = new Map([
            ["u1", "user-one"],
            ["u2", "user-two"],
        ]);
        const matchingResult = { pairs: [] };
        const lotteryResult = { pairs: [], participantCount: 2 };

        const mockTraqService: ILotteryTraqService = {
            collectUserPrefs: mock(async () => users),
            getuserNameMap: mock(async () => userNameMap),
        };
        const mockLotteryService: ILotteryService = {
            runLottery: mock(() => matchingResult as any),
            formatResult: mock(() => lotteryResult as any),
        };

        const handlers = createLotteryHandlers(mockTraqService, mockLotteryService);
        const result = await handlers.runLotteryHandler("msg-123");

        expect(result).toBe(lotteryResult as any);
        expect(mockTraqService.collectUserPrefs).toHaveBeenCalledWith("msg-123");
        expect(mockTraqService.getuserNameMap).toHaveBeenCalled();
        expect(mockLotteryService.runLottery).toHaveBeenCalledWith(users);
        expect(mockLotteryService.formatResult).toHaveBeenCalledWith(
            matchingResult as any,
            userNameMap
        );
    });
});
