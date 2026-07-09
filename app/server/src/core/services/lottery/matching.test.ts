import { describe, expect, it } from "bun:test";

import { runLottery } from "./matching";

import type { Region, Role, UserPrefs } from "../../../types";

describe("runLottery", () => {
    const createUser = (
        id: string,
        regions: Region[],
        isBeginner: boolean,
        origRegSize = regions.length,
        origLevelSize = isBeginner ? 1 : 0
    ): UserPrefs => ({
        id,
        regions: new Set(regions),
        isBeginner,
        originalRegionSize: origRegSize,
        originalLevelSize: origLevelSize,
    });

    it("should pair users with matching regions and avoid beginner-beginner pairs", () => {
        // We have 4 users.
        // User A and B both want frontend, A is beginner, B is muscle.
        // User C and D both want backend, C is beginner, D is muscle.
        const userA = createUser("A", ["frontend"], true);
        const userB = createUser("B", ["frontend"], false);
        const userC = createUser("C", ["backend"], true);
        const userD = createUser("D", ["backend"], false);

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

    it("should handle odd number of users by cloning one user to form pairs of 2", () => {
        const users = [
            createUser("A", ["frontend"], true),
            createUser("B", ["frontend"], false),
            createUser("C", ["backend"], true),
            createUser("D", ["backend"], false),
            createUser("E", ["frontend"], false),
        ];

        const result = runLottery(users);

        // 5 users -> 1 cloned -> 6 users -> 3 pairs
        expect(result.pairs.length).toBe(3);
        expect(result.insertedUser).not.toBeNull();
        expect(result.insertedIntoPairs).not.toBeNull();
        expect(users.map(u => u.id)).toContain(result.insertedUser!.id);
        // insertedUser should be in exactly 2 pairs
        expect(result.insertedIntoPairs!.length).toBe(2);
    });

    it("should minimize region imbalance if scores are tied", () => {
        const userA = createUser("A", ["frontend"], true);
        const userB = createUser("B", ["frontend"], false);
        const userC = createUser("C", ["backend"], true);
        const userD = createUser("D", ["backend"], false);

        const result = runLottery([userA, userC, userB, userD]);
        expect(result.regionImbalance).toBe(0);
    });

    it("should prioritize experienced users for cloning over beginners", () => {
        // We have 3 users. 2 beginners, 1 muscle.
        // Cloning the muscle should give a better score because cloning a beginner gives PENALTY_INSERTED_BEGINNER
        const userA = createUser("A", ["frontend"], true);
        const userB = createUser("B", ["frontend"], true);
        const userC = createUser("C", ["frontend"], false);

        const result = runLottery([userA, userB, userC]);

        expect(result.pairs.length).toBe(2);
        // User C (muscle) should be chosen as insertedUser to avoid penalty
        expect(result.insertedUser!.id).toBe("C");
    });

    it("should prioritize experienced partners for the cloned user", () => {
        // We have 5 users.
        // userA: muscle (will be cloned)
        // userB: muscle, userC: muscle
        // userD: beginner, userE: beginner
        // If userA is cloned, its partners should ideally be userB and userC to avoid PENALTY_INSERTED_PARTNER_BEGINNER.
        const userA = createUser("A", ["frontend"], false);
        const userB = createUser("B", ["frontend"], false);
        const userC = createUser("C", ["frontend"], false);
        const userD = createUser("D", ["frontend"], true);
        const userE = createUser("E", ["frontend"], true);

        const result = runLottery([userA, userB, userC, userD, userE]);

        expect(result.pairs.length).toBe(3);

        if (result.insertedUser!.id === "A") {
            const partners = result.insertedIntoPairs!.map(p =>
                p[0].id === "A" ? p[1].id : p[0].id
            );
            // Partners should be B and C, since D and E are beginners and would incur penalties.
            expect(partners).toContain("B");
            expect(partners).toContain("C");
        }
    });
});
