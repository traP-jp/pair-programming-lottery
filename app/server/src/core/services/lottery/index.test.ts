import { describe, expect, it } from "bun:test";

import type { LotteryResponse } from "@server/core/repository/lotteryResponse";

import { buildPastPairHistory, createLotteryService } from "./index";

describe("lottery service wrapper", () => {
    it("should correctly run matching and format matching results", () => {
        const service = createLotteryService();
        const users = [
            {
                id: "u1",
                regions: new Set(["frontend"]),
                isBeginner: true,
                originalRegionSize: 1,
                originalLevelSize: 1,
            },
            {
                id: "u2",
                regions: new Set(["backend"]),
                isBeginner: false,
                originalRegionSize: 1,
                originalLevelSize: 1,
            },
        ] as any[];

        const matchingResult = service.runLottery(users);
        expect(matchingResult.pairs.length).toBe(1);

        const userNameMap = new Map([
            ["u1", "user-one"],
            ["u2", "user-two"],
        ]);

        const formatted = service.formatResult(matchingResult, userNameMap);
        expect(formatted.pairs.length).toBe(1);
        expect(formatted.participantCount).toBe(2);
    });

    it("should build past pair history correctly from lottery responses", () => {
        const pastLotteries: LotteryResponse[] = [
            {
                id: "res-1",
                createdAt: new Date(),
                channelId: "chan",
                month: "2026-06",
                result: {
                    pairs: [
                        { members: [{ id: "A" }, { id: "B" }] },
                        { members: [{ id: "C" }, { id: "D" }] },
                    ],
                } as any,
            },
            {
                id: "res-2",
                createdAt: new Date(),
                channelId: "chan",
                month: "2026-05",
                result: {
                    pairs: [
                        { members: [{ id: "B" }, { id: "C" }] },
                        { members: [{ id: "A" }, { id: "B" }] },
                    ],
                } as any,
            },
        ];

        const history = buildPastPairHistory(pastLotteries);

        expect(history.get("A:B")).toBe(0); // from res-1 (ago=0)
        expect(history.get("C:D")).toBe(0); // from res-1 (ago=0)
        expect(history.get("B:C")).toBe(1); // from res-2 (ago=1)
    });
});
