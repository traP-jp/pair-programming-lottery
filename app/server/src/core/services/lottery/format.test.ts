import { describe, expect, it } from "bun:test";

import { formatResult } from "./format";

import type { MatchingResult, UserPrefs } from "../../../types";

describe("formatResult", () => {
    const createUser = (
        id: string,
        regions: ("frontend" | "backend")[],
        isBeginner: boolean
    ): UserPrefs => ({
        id,
        regions: new Set(regions),
        isBeginner,
        originalRegionSize: regions.length,
        originalLevelSize: isBeginner ? 1 : 0,
    });

    it("should format matching results correctly", () => {
        const userA = createUser("A", ["frontend"], true);
        const userB = createUser("B", ["frontend"], false);
        const userC = createUser("C", ["backend"], true);
        const userD = createUser("D", ["backend"], false);

        const matchingResult: MatchingResult = {
            pairs: [
                [userC, userD],
                [userA, userB],
            ],
            insertedUser: null,
            insertedIntoPairs: null,
            totalScore: 200,
            regionImbalance: 0,
        };

        const userIdToName = new Map([
            ["A", "Alice"],
            ["B", "Bob"],
            ["C", "Charlie"],
            // D is missing from map, should fallback to ID "D"
        ]);

        const formatted = formatResult(matchingResult, userIdToName);

        // participantCount
        expect(formatted.participantCount).toBe(4);

        // score metrics
        // maxScore for 2 pairs is 2 * 100 = 200.
        // normalized = 200 / 200 = 1.0.
        expect(formatted.score.total).toBe(200);
        expect(formatted.score.max).toBe(200);
        expect(formatted.score.normalized).toBe(1);

        // Pairs should be sorted: frontend (Alice/Bob) first, backend (Charlie/D) second
        expect(formatted.pairs.length).toBe(2);

        const firstPair = formatted.pairs[0]!;
        expect(firstPair.region).toBe("frontend");
        expect(firstPair.members[0]!.name).toBe("Bob");
        expect(firstPair.members[0]!.isBeginner).toBe(false);
        expect(firstPair.members[1]!.name).toBe("Alice");
        expect(firstPair.members[1]!.isBeginner).toBe(true);

        const secondPair = formatted.pairs[1]!;
        expect(secondPair.region).toBe("backend");
        expect(secondPair.members[0]!.name).toBe("D"); // fallback to ID
        expect(secondPair.members[0]!.isBeginner).toBe(false);
        expect(secondPair.members[1]!.name).toBe("Charlie");
        expect(secondPair.members[1]!.isBeginner).toBe(true);
    });

    it("should format inserted user information correctly", () => {
        const userA = createUser("A", ["frontend"], true);
        const userB = createUser("B", ["frontend"], false);
        const userC = createUser("C", ["backend"], true);
        const userD = createUser("D", ["backend"], false);
        const userE = createUser("E", ["frontend"], false);

        const pair1: [UserPrefs, UserPrefs] = [userA, userB];
        const pair2: [UserPrefs, UserPrefs] = [userC, userE];
        const pair3: [UserPrefs, UserPrefs] = [userD, userE];

        const matchingResult: MatchingResult = {
            pairs: [pair1, pair2, pair3],
            insertedUser: userE,
            insertedIntoPairs: [pair2, pair3],
            totalScore: 200,
            regionImbalance: 0,
        };

        const userIdToName = new Map([
            ["A", "Alice"],
            ["B", "Bob"],
            ["C", "Charlie"],
            ["D", "Dave"],
            ["E", "Eve"],
        ]);

        const formatted = formatResult(matchingResult, userIdToName);

        // 3 pairs * 2 - 1 insertedUser = 5 participants
        expect(formatted.participantCount).toBe(5);
        expect(formatted.insertedUser).not.toBeNull();
        expect(formatted.insertedUser!.name).toBe("Eve");

        // Eve is inserted into pair2 and pair3.
        // pair2 and pair3 are backend/frontend combinations or similar, but what matters is that 2 pairs have hasInsertedUser
        const insertedCount = formatted.pairs.filter(p => p.hasInsertedUser).length;
        expect(insertedCount).toBe(2);
        expect(formatted.insertedUser!.pairIndices.length).toBe(2);
    });

    it("should format correctly when a pair contains undefined/null members", () => {
        const matchingResult: MatchingResult = {
            pairs: [[null as any, null as any]],
            insertedUser: null,
            insertedIntoPairs: null,
            totalScore: 0,
            regionImbalance: 0,
        };

        const formatted = formatResult(matchingResult, new Map());
        expect(formatted.pairs[0]!.region).toBeNull();
        expect(formatted.pairs[0]!.members[0]!.name).toBe("?");
    });
});
