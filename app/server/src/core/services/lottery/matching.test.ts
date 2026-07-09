import { describe, expect, it } from "bun:test";

import { runLottery } from "./matching";

import type { Region, Role, UserPrefs } from "../../../types";

describe("runLottery", () => {
    const createUser = (
        id: string,
        regions: Region[],
        levels: Level[],
        origRegSize = regions.length,
        origLevelSize = levels.length
    ): UserPrefs => ({
        id,
        regions: new Set(regions),
        levels: new Set(levels),
        originalRegionSize: origRegSize,
        originalLevelSize: origLevelSize,
    });

    it("should pair users with matching regions and avoid beginner-beginner pairs", () => {
        // We have 4 users.
        // User A and B both want frontend, A is beginner, B is muscle.
        // User C and D both want backend, C is beginner, D is muscle.
        const userA = createUser("A", ["frontend"], ["beginner"]);
        const userB = createUser("B", ["frontend"], ["muscle"]);
        const userC = createUser("C", ["backend"], ["beginner"]);
        const userD = createUser("D", ["backend"], ["muscle"]);

        const result = runLottery([userA, userB, userC, userD]);

        expect(result.pairs.length).toBe(2);
        expect(result.insertedUser).toBeNull();
        expect(result.insertedIntoPairs).toBeNull();

        // Total score should be:
        // Pair 1 (A-B): region match (100)
        // Pair 2 (C-D): region match (100)
        // Total = 200
        expect(result.totalScore).toBe(200);
        expect(result.regionImbalance).toBe(0); // 1 frontend pair, 1 backend pair
    });

    it("should handle odd number of users by leaving one out and placing them in insertedUser", () => {
        const users = [
            createUser("A", ["frontend"], ["beginner"]),
            createUser("B", ["frontend"], ["muscle"]),
            createUser("C", ["backend"], ["beginner"]),
            createUser("D", ["backend"], ["muscle"]),
            createUser("E", ["frontend"], ["muscle"]),
        ];

        const result = runLottery(users);

        expect(result.pairs.length).toBe(2);
        expect(result.insertedUser).not.toBeNull();
        expect(result.insertedIntoPairs).not.toBeNull();
        // The insertedUser should be one of the users
        expect(users.map(u => u.id)).toContain(result.insertedUser!.id);
        // insertedIntoPairs should contain either 1 or 2 pairs where the insertedUser is assigned
        expect(result.insertedIntoPairs!.length).toBeGreaterThanOrEqual(1);
    });

    it("should minimize region imbalance if scores are tied", () => {
        // We have 2 frontend-preferring and 2 backend-preferring.
        // To minimize region imbalance, they should be paired (frontend-frontend) and (backend-backend)
        // giving regionImbalance = 0.
        const userA = createUser("A", ["frontend"], ["beginner"]);
        const userB = createUser("B", ["frontend"], ["muscle"]);
        const userC = createUser("C", ["backend"], ["beginner"]);
        const userD = createUser("D", ["backend"], ["muscle"]);

        const result = runLottery([userA, userC, userB, userD]);
        expect(result.regionImbalance).toBe(0);
    });

    it("should handle odd number of users with a flexible user and swap it to be left out", () => {
        const userA = createUser("A", ["frontend", "backend"], ["beginner"]);
        const userB = createUser("B", ["frontend"], ["muscle"]);
        const userC = createUser("C", ["backend"], ["muscle"]);

        const result = runLottery([userA, userB, userC]);

        expect(result.pairs.length).toBe(1);
        expect(result.insertedUser).not.toBeNull();
        expect(result.insertedIntoPairs).not.toBeNull();
        expect(result.insertedIntoPairs!.length).toBe(1);
    });
});
