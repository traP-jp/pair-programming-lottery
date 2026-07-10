import type { MatchingResult, UserPrefs } from "@server/types";

const SCORE_REGION_MATCH = 100;
const PENALTY_BEGINNER_PAIR = 100000;
const PENALTY_INSERTED_BEGINNER = 10000;
const PENALTY_INSERTED_PARTNER_BEGINNER = 500;
const PENALTY_PAST_PAIR = [100, 50, 20];

const SIMULATION_ROUNDS = 5000;

function getPairScore(u: UserPrefs, v: UserPrefs, pastPairs: Map<string, number>): number {
    let score = 0;

    const hasCommonRegion = [...u.regions].some(r => v.regions.has(r));
    if (hasCommonRegion) score += SCORE_REGION_MATCH;

    if (u.isBeginner && v.isBeginner) score -= PENALTY_BEGINNER_PAIR;

    const pairKey = [u.id, v.id].sort().join(":");
    const ago = pastPairs.get(pairKey);
    if (ago !== undefined) {
        score -= PENALTY_PAST_PAIR[ago] ?? 0;
    }

    return score;
}

function shuffle<T>(array: T[]): T[] {
    for (let index = array.length - 1; index > 0; index--) {
        const index_ = Math.floor(Math.random() * (index + 1));
        [array[index], array[index_]] = [array[index_]!, array[index]!];
    }
    return array;
}
function tryMatching(users: UserPrefs[], pastPairs: Map<string, number>): MatchingResult {
    let shuffled = shuffle([...users]);

    let insertedUser: UserPrefs | null = null;
    let totalScore = 0;

    if (shuffled.length % 2 === 1) {
        insertedUser = shuffled[0]!;

        shuffled.push(insertedUser);
        shuffled = shuffle(shuffled);

        if (insertedUser.isBeginner) {
            totalScore -= PENALTY_INSERTED_BEGINNER;
        }
    }

    const pairs: [UserPrefs, UserPrefs][] = [];
    let frontendPairs = 0;
    let backendPairs = 0;

    for (let index = 0; index + 1 < shuffled.length; index += 2) {
        const u = shuffled[index]!;
        const v = shuffled[index + 1]!;

        if (u.id === v.id) {
            return {
                pairs: [],
                insertedUser: null,
                insertedIntoPairs: null,
                totalScore: -Infinity,
                regionImbalance: Infinity,
            };
        }

        pairs.push([u, v]);
        totalScore += getPairScore(u, v, pastPairs);

        if (insertedUser) {
            const isUInserted = u.id === insertedUser.id;
            const isVInserted = v.id === insertedUser.id;
            if (isUInserted || isVInserted) {
                const partner = isUInserted ? v : u;
                if (partner.isBeginner) {
                    totalScore -= PENALTY_INSERTED_PARTNER_BEGINNER;
                }
            }
        }

        const commonRegion = [...u.regions].find(r => v.regions.has(r));
        if (commonRegion === "frontend") frontendPairs++;
        if (commonRegion === "backend") backendPairs++;
    }

    let insertedIntoPairs: [UserPrefs, UserPrefs][] | null = null;
    if (insertedUser) {
        insertedIntoPairs = pairs.filter(
            p => p[0].id === insertedUser!.id || p[1].id === insertedUser!.id
        );
    }

    return {
        pairs,
        insertedUser,
        insertedIntoPairs,
        totalScore,
        regionImbalance: Math.abs(frontendPairs - backendPairs),
    };
}

export function runLottery(
    users: UserPrefs[],
    pastPairs: Map<string, number> = new Map()
): MatchingResult {
    let bestResult: MatchingResult | null = null;

    for (let index = 0; index < SIMULATION_ROUNDS; index++) {
        const result = tryMatching(users, pastPairs);
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
