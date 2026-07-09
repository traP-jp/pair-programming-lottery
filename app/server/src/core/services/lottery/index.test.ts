import { describe, expect, it } from "bun:test";

import { createLotteryService } from "./index";

describe("lottery service wrapper", () => {
    it("should correctly run matching and format matching results", () => {
        const service = createLotteryService();
        const users = [
            {
                id: "u1",
                regions: new Set(["frontend"]),
                levels: new Set(["beginner"]),
                originalRegionSize: 1,
                originalLevelSize: 1,
            },
            {
                id: "u2",
                regions: new Set(["backend"]),
                levels: new Set(["muscle"]),
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
});
