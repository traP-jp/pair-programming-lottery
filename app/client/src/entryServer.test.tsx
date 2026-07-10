import { describe, expect, it } from "vitest";

import { render } from "./entryServer";
import type { InitialData } from "./routeDefinitions";

describe("entryServer render", () => {
    it("should include Suspense boundaries for lazy hydrated routes", () => {
        const initialData: InitialData = {
            result: {
                id: "res-123",
                month: "2026-06",
                channelId: "chan-1",
                createdAt: "2026-06-12T07:00:00.000Z",
                result: {
                    pairs: [],
                    insertedUser: null,
                    participantCount: 0,
                    score: {
                        normalized: 1,
                        total: 0,
                        max: 0,
                    },
                    config: {
                        regionMatchScore: 100,
                        penaltyBeginnerPair: 10000,
                        simulationRounds: 5000,
                    },
                },
            },
        };

        const html = render("/results/res-123", initialData);

        expect(html).toContain("<!--$-->");
        expect(html).toContain("<!--/$-->");
        expect(html).toContain("抽選結果");
    });
});
