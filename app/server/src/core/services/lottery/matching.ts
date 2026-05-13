import type { UserPrefs, MatchingResult } from "../../../types";

const SCORE_REGION_MATCH = 100;
const SCORE_ROLE_COMPLEMENT = 10;
const SIMULATION_ROUNDS = 5000;

function getPairScore(u: UserPrefs, v: UserPrefs): number {
    let score = 0;

    const hasCommonRegion = Array.from(u.regions).some((r) => v.regions.has(r));
    if (hasCommonRegion) score += SCORE_REGION_MATCH;

    const hasComplementaryRole =
        (u.roles.has("navigator") && v.roles.has("driver")) ||
        (u.roles.has("driver") && v.roles.has("navigator"));
    if (hasComplementaryRole) score += SCORE_ROLE_COMPLEMENT;

    return score;
}

function shuffle<T>(arr: T[]): T[] {
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j]!, arr[i]!];
    }
    return arr;
}
function tryMatching(users: UserPrefs[]): MatchingResult {
    const shuffled = shuffle([...users]);

    let insertedUser: UserPrefs | null = null;

    if (shuffled.length % 2 === 1) {
        const lastIdx = shuffled.length - 1;
        const lastUser = shuffled[lastIdx]!;

        if (
            lastUser.originalRegionSize !== 2 &&
            lastUser.originalRoleSize !== 2
        ) {
            const flexIdx = shuffled.findIndex(
                (u, i) =>
                    i < lastIdx &&
                    (u.originalRegionSize === 2 || u.originalRoleSize === 2),
            );
            if (flexIdx !== -1) {
                [shuffled[flexIdx], shuffled[lastIdx]] = [
                    shuffled[lastIdx]!,
                    shuffled[flexIdx]!,
                ];
            }
        }

        insertedUser = shuffled.pop()!;
    }

    const pairs: [UserPrefs, UserPrefs][] = [];
    let totalScore = 0;
    let frontendPairs = 0;
    let backendPairs = 0;

    for (let i = 0; i + 1 < shuffled.length; i += 2) {
        const u = shuffled[i]!;
        const v = shuffled[i + 1]!;
        pairs.push([u, v]);
        totalScore += getPairScore(u, v);

        const commonRegion = Array.from(u.regions).find((r) =>
            v.regions.has(r),
        );
        if (commonRegion === "frontend") frontendPairs++;
        if (commonRegion === "backend") backendPairs++;
    }

    let insertedIntoPairs:
        | [[UserPrefs, UserPrefs], [UserPrefs, UserPrefs]]
        | null = null;
    if (insertedUser && pairs.length >= 2) {
        insertedIntoPairs = [pairs[0]!, pairs[1]!];
    }

    return {
        pairs,
        insertedUser,
        insertedIntoPairs,
        totalScore,
        regionImbalance: Math.abs(frontendPairs - backendPairs),
    };
}

export function runLottery(users: UserPrefs[]): MatchingResult {
    let bestResult: MatchingResult | null = null;

    for (let i = 0; i < SIMULATION_ROUNDS; i++) {
        const result = tryMatching(users);
        if (
            !bestResult ||
            result.totalScore > bestResult.totalScore ||
            (result.totalScore === bestResult.totalScore &&
                result.regionImbalance < bestResult.regionImbalance)
        ) {
            bestResult = result;
        }
    }

    return bestResult!;
}

export { SIMULATION_ROUNDS, SCORE_REGION_MATCH, SCORE_ROLE_COMPLEMENT };
