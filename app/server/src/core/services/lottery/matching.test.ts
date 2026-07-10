import { describe, expect, it } from "bun:test";

import { runLottery } from "./matching";
import { getPairKey } from "./pairKey";

import type { Region, UserPrefs } from "../../../types";

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
        // User A and B both want frontend, A is beginner, B is experienced.
        // User C and D both want backend, C is beginner, D is experienced.
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
        // We have 3 users. 2 beginners, 1 experienced.
        // Cloning the experienced user should give a better score because cloning a beginner gives PENALTY_INSERTED_BEGINNER
        const userA = createUser("A", ["frontend"], true);
        const userB = createUser("B", ["frontend"], true);
        const userC = createUser("C", ["frontend"], false);

        const result = runLottery([userA, userB, userC]);

        expect(result.pairs.length).toBe(2);
        // User C (experienced) should be chosen as insertedUser to avoid penalty
        expect(result.insertedUser!.id).toBe("C");
    });

    it("should prioritize experienced partners for the cloned user", () => {
        // We have 5 users.
        // userA, userB, userC, userD are experienced. userE is beginner.
        // An experienced user will be chosen to be cloned.
        // Their partners should be two of the other experienced users to avoid PENALTY_INSERTED_PARTNER_BEGINNER.
        // If they partner with E, it incurs a penalty.
        const userA = createUser("A", ["frontend"], false);
        const userB = createUser("B", ["frontend"], false);
        const userC = createUser("C", ["frontend"], false);
        const userD = createUser("D", ["frontend"], false);
        const userE = createUser("E", ["frontend"], true);

        const result = runLottery([userA, userB, userC, userD, userE]);

        expect(result.pairs.length).toBe(3);

        const insertedUser = result.insertedUser!;
        const partners = result.insertedIntoPairs!.map(p =>
            p[0].id === insertedUser.id ? p[1].id : p[0].id
        );

        // The inserted user should NOT partner with the beginner (E) because inserted user is experienced
        expect(partners).not.toContain("E");
    });

    it("should avoid pairs that were recently matched to minimize penalty", () => {
        // We have 4 users.
        // User A, B, C, D all want frontend and are experienced.
        const userA = createUser("A", ["frontend"], false);
        const userB = createUser("B", ["frontend"], false);
        const userC = createUser("C", ["frontend"], false);
        const userD = createUser("D", ["frontend"], false);

        // Suppose A and B were paired recently. C and D were paired recently.
        // So they shouldn't be paired together again.
        // The ideal match should be A-C and B-D or A-D and B-C.
        const pastPairs = new Map<string, number>();
        pastPairs.set(getPairKey("A", "B"), 1); // 1 ago
        pastPairs.set(getPairKey("C", "D"), 1); // 1 ago

        const result = runLottery([userA, userB, userC, userD], pastPairs);

        // Let's check the pairs. They should NOT be A-B or C-D.
        const pairStrs = result.pairs.map(p => [p[0].id, p[1].id].sort().join("-"));
        expect(pairStrs).not.toContain("A-B");
        expect(pairStrs).not.toContain("C-D");
        // Total score should be 200 (100 * 2 region matches) since no penalty is incurred for new pairs.
        expect(result.totalScore).toBe(200);
    });
});
