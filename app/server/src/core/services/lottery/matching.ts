import type { MatchingResult, UserPrefs } from "@server/types";

const SCORE_REGION_MATCH = 100;
const PENALTY_BEGINNER_PAIR = 10000;
const SIMULATION_ROUNDS = 5000;

function getPairScore(u: UserPrefs, v: UserPrefs): number {
    let score = 0;

    const hasCommonRegion = [...u.regions].some(r => v.regions.has(r));
    if (hasCommonRegion) score += SCORE_REGION_MATCH;

    // ペアの両方が初心者（beginnerのみ）の場合は大きなペナルティを与える
    const isUBeginner = u.levels.has("beginner") && !u.levels.has("muscle");
    const isVBeginner = v.levels.has("beginner") && !v.levels.has("muscle");
    if (isUBeginner && isVBeginner) score -= PENALTY_BEGINNER_PAIR;

    return score;
}

function shuffle<T>(array: T[]): T[] {
    for (let index = array.length - 1; index > 0; index--) {
        const index_ = Math.floor(Math.random() * (index + 1));
        [array[index], array[index_]] = [array[index_]!, array[index]!];
    }
    return array;
}
function tryMatching(users: UserPrefs[]): MatchingResult {
    const shuffled = shuffle([...users]);

    let insertedUser: UserPrefs | null = null;

    if (shuffled.length % 2 === 1) {
        const lastIndex = shuffled.length - 1;
        const lastUser = shuffled[lastIndex]!;

        if (lastUser.originalRegionSize !== 2 && lastUser.originalLevelSize !== 2) {
            const flexIndex = shuffled.findIndex(
                (u, index) =>
                    index < lastIndex && (u.originalRegionSize === 2 || u.originalLevelSize === 2)
            );
            if (flexIndex !== -1) {
                [shuffled[flexIndex], shuffled[lastIndex]] = [
                    shuffled[lastIndex]!,
                    shuffled[flexIndex]!,
                ];
            }
        }

        insertedUser = shuffled.pop()!;
    }

    const pairs: [UserPrefs, UserPrefs][] = [];
    let totalScore = 0;
    let frontendPairs = 0;
    let backendPairs = 0;

    for (let index = 0; index + 1 < shuffled.length; index += 2) {
        const u = shuffled[index]!;
        const v = shuffled[index + 1]!;
        pairs.push([u, v]);
        totalScore += getPairScore(u, v);

        const commonRegion = [...u.regions].find(r => v.regions.has(r));
        if (commonRegion === "frontend") frontendPairs++;
        if (commonRegion === "backend") backendPairs++;
    }

    let insertedIntoPairs: [UserPrefs, UserPrefs][] | null = null;
    if (insertedUser) {
        if (pairs.length >= 2) {
            insertedIntoPairs = [pairs[0]!, pairs[1]!];
        } else if (pairs.length === 1) {
            insertedIntoPairs = [pairs[0]!];
        }
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

    for (let index = 0; index < SIMULATION_ROUNDS; index++) {
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

export { SIMULATION_ROUNDS, SCORE_REGION_MATCH, PENALTY_BEGINNER_PAIR };
