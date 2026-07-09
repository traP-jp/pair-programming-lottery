import { describe, expect, it } from "bun:test";

import { formatResult } from "./format";

import type { MatchingResult, UserPrefs } from "../../../types";

describe("formatResult", () => {
    const createUser = (
        id: string,
        regions: ("frontend" | "backend")[],
        levels: ("beginner" | "muscle")[]
    ): UserPrefs => ({
        id,
        regions: new Set(regions),
        levels: new Set(levels),
        originalRegionSize: regions.length,
        originalLevelSize: levels.length,
    });

    it("should format matching results correctly", () => {
        const userA = createUser("A", ["frontend"], ["beginner"]);
        const userB = createUser("B", ["frontend"], ["muscle"]);
        const userC = createUser("C", ["backend"], ["beginner"]);
        const userD = createUser("D", ["backend"], ["muscle"]);

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
        expect(firstPair.members[0]!.level).toBe("muscle");
        expect(firstPair.members[1]!.name).toBe("Alice");
        expect(firstPair.members[1]!.level).toBe("beginner");

        const secondPair = formatted.pairs[1]!;
        expect(secondPair.region).toBe("backend");
        expect(secondPair.members[0]!.name).toBe("D"); // fallback to ID
        expect(secondPair.members[0]!.level).toBe("muscle");
        expect(secondPair.members[1]!.name).toBe("Charlie");
        expect(secondPair.members[1]!.level).toBe("beginner");
    });

    it("should format inserted user information correctly", () => {
        const userA = createUser("A", ["frontend"], ["beginner"]);
        const userB = createUser("B", ["frontend"], ["muscle"]);
        const userC = createUser("C", ["backend"], ["beginner"]);
        const userD = createUser("D", ["backend"], ["muscle"]);
        const userE = createUser("E", ["frontend"], ["muscle"]);

        const pair1: [UserPrefs, UserPrefs] = [userA, userB];
        const pair2: [UserPrefs, UserPrefs] = [userC, userD];

        const matchingResult: MatchingResult = {
            pairs: [pair1, pair2],
            insertedUser: userE,
            insertedIntoPairs: [pair1],
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

        expect(formatted.participantCount).toBe(5);
        expect(formatted.insertedUser).not.toBeNull();
        expect(formatted.insertedUser!.name).toBe("Eve");

        // Eve is inserted into pair1. After sorting, frontend pair (pair1) should be at index 0.
        expect(formatted.insertedUser!.pairIndices).toContain(0);
        expect(formatted.pairs[0]!.hasInsertedUser).toBe(true);
        expect(formatted.pairs[1]!.hasInsertedUser).toBe(false);
    });

    it("should format correctly when u2 has single level but u1 has multiple levels", () => {
        const userA = createUser("A", ["frontend"], ["beginner", "muscle"]);
        const userB = createUser("B", ["frontend"], ["muscle"]);

        const matchingResult: MatchingResult = {
            pairs: [[userA, userB]],
            insertedUser: null,
            insertedIntoPairs: null,
            totalScore: 100,
            regionImbalance: 0,
        };

        const formatted = formatResult(
            matchingResult,
            new Map([
                ["A", "Alice"],
                ["B", "Bob"],
            ])
        );
        expect(formatted.pairs[0]!.members[0]!.level).toBe("muscle"); // B is muscle
        expect(formatted.pairs[0]!.members[1]!.level).toBe("beginner"); // A becomes beginner
    });

    it("should format correctly when both users have multiple levels", () => {
        const userA = createUser("A", ["frontend"], ["beginner", "muscle"]);
        const userB = createUser("B", ["frontend"], ["beginner", "muscle"]);

        const matchingResult: MatchingResult = {
            pairs: [[userA, userB]],
            insertedUser: null,
            insertedIntoPairs: null,
            totalScore: 100,
            regionImbalance: 0,
        };

        const formatted = formatResult(
            matchingResult,
            new Map([
                ["A", "Alice"],
                ["B", "Bob"],
            ])
        );
        expect(formatted.pairs[0]!.members[0]!.level).toBe("muscle");
        expect(formatted.pairs[0]!.members[1]!.level).toBe("beginner");
    });

    it("should format correctly when u2 has single level beginner but u1 has multiple levels", () => {
        const userA = createUser("A", ["frontend"], ["beginner", "muscle"]);
        const userB = createUser("B", ["frontend"], ["beginner"]);

        const matchingResult: MatchingResult = {
            pairs: [[userA, userB]],
            insertedUser: null,
            insertedIntoPairs: null,
            totalScore: 100,
            regionImbalance: 0,
        };

        const formatted = formatResult(
            matchingResult,
            new Map([
                ["A", "Alice"],
                ["B", "Bob"],
            ])
        );
        expect(formatted.pairs[0]!.members[0]!.level).toBe("muscle");
        expect(formatted.pairs[0]!.members[1]!.level).toBe("beginner");
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
