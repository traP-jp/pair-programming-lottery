import { describe, expect, it } from "bun:test";

import { formatResult } from "./format";

import type { MatchingResult, UserPrefs } from "../../../types";

describe("formatResult", () => {
    const createUser = (
        id: string,
        regions: ("frontend" | "backend")[],
        roles: ("navigator" | "driver")[]
    ): UserPrefs => ({
        id,
        regions: new Set(regions),
        roles: new Set(roles),
        originalRegionSize: regions.length,
        originalRoleSize: roles.length,
    });

    it("should format matching results correctly", () => {
        const userA = createUser("A", ["frontend"], ["navigator"]);
        const userB = createUser("B", ["frontend"], ["driver"]);
        const userC = createUser("C", ["backend"], ["navigator"]);
        const userD = createUser("D", ["backend"], ["driver"]);

        const matchingResult: MatchingResult = {
            pairs: [
                [userC, userD],
                [userA, userB],
            ],
            insertedUser: null,
            insertedIntoPairs: null,
            totalScore: 220,
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
        // maxScore for 2 pairs is 2 * (100 + 10) = 220.
        // normalized = 220 / 220 = 1.0.
        expect(formatted.score.total).toBe(220);
        expect(formatted.score.max).toBe(220);
        expect(formatted.score.normalized).toBe(1);

        // Pairs should be sorted: frontend (Alice/Bob) first, backend (Charlie/D) second
        expect(formatted.pairs.length).toBe(2);

        const firstPair = formatted.pairs[0]!;
        expect(firstPair.region).toBe("frontend");
        expect(firstPair.members[0]!.name).toBe("Alice");
        expect(firstPair.members[0]!.role).toBe("navigator");
        expect(firstPair.members[1]!.name).toBe("Bob");
        expect(firstPair.members[1]!.role).toBe("driver");

        const secondPair = formatted.pairs[1]!;
        expect(secondPair.region).toBe("backend");
        expect(secondPair.members[0]!.name).toBe("Charlie");
        expect(secondPair.members[0]!.role).toBe("navigator");
        expect(secondPair.members[1]!.name).toBe("D"); // fallback to ID
        expect(secondPair.members[1]!.role).toBe("driver");
    });

    it("should format inserted user information correctly", () => {
        const userA = createUser("A", ["frontend"], ["navigator"]);
        const userB = createUser("B", ["frontend"], ["driver"]);
        const userC = createUser("C", ["backend"], ["navigator"]);
        const userD = createUser("D", ["backend"], ["driver"]);
        const userE = createUser("E", ["frontend"], ["driver"]);

        const pair1: [UserPrefs, UserPrefs] = [userA, userB];
        const pair2: [UserPrefs, UserPrefs] = [userC, userD];

        const matchingResult: MatchingResult = {
            pairs: [pair1, pair2],
            insertedUser: userE,
            insertedIntoPairs: [pair1],
            totalScore: 220,
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

    it("should format correctly when u2 has single role but u1 has multiple roles", () => {
        const userA = createUser("A", ["frontend"], ["navigator", "driver"]);
        const userB = createUser("B", ["frontend"], ["driver"]);

        const matchingResult: MatchingResult = {
            pairs: [[userA, userB]],
            insertedUser: null,
            insertedIntoPairs: null,
            totalScore: 110,
            regionImbalance: 0,
        };

        const formatted = formatResult(
            matchingResult,
            new Map([
                ["A", "Alice"],
                ["B", "Bob"],
            ])
        );
        expect(formatted.pairs[0]!.members[0]!.role).toBe("navigator");
    });

    it("should format correctly when both users have multiple roles", () => {
        const userA = createUser("A", ["frontend"], ["navigator", "driver"]);
        const userB = createUser("B", ["frontend"], ["navigator", "driver"]);

        const matchingResult: MatchingResult = {
            pairs: [[userA, userB]],
            insertedUser: null,
            insertedIntoPairs: null,
            totalScore: 110,
            regionImbalance: 0,
        };

        const formatted = formatResult(
            matchingResult,
            new Map([
                ["A", "Alice"],
                ["B", "Bob"],
            ])
        );
        expect(formatted.pairs[0]!.members[0]!.role).toBe("navigator");
        expect(formatted.pairs[0]!.members[1]!.role).toBe("driver");
    });

    it("should format correctly when u2 has single role navigator but u1 has multiple roles", () => {
        const userA = createUser("A", ["frontend"], ["navigator", "driver"]);
        const userB = createUser("B", ["frontend"], ["navigator"]);

        const matchingResult: MatchingResult = {
            pairs: [[userA, userB]],
            insertedUser: null,
            insertedIntoPairs: null,
            totalScore: 110,
            regionImbalance: 0,
        };

        const formatted = formatResult(
            matchingResult,
            new Map([
                ["A", "Alice"],
                ["B", "Bob"],
            ])
        );
        expect(formatted.pairs[0]!.members[0]!.role).toBe("navigator");
        expect(formatted.pairs[0]!.members[1]!.role).toBe("driver");
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
