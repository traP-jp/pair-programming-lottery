import {
    PENALTY_BEGINNER_PAIR,
    SCORE_REGION_MATCH,
    SIMULATION_ROUNDS,
} from "@server/core/services/lottery/matching";
import type { MatchingResult, UserPrefs } from "@server/types";

export type Region = "frontend" | "backend";
export type Level = "beginner" | "muscle";

function getPairRegion(u: UserPrefs, v: UserPrefs): Region | null {
    return [...u.regions].find(r => v.regions.has(r)) ?? null;
}

function isBeginnerPair(u1: UserPrefs, u2: UserPrefs): boolean {
    return (
        u1.levels.has("beginner") &&
        !u1.levels.has("muscle") &&
        u2.levels.has("beginner") &&
        !u2.levels.has("muscle")
    );
}

function resolveLevelsPair(u1: UserPrefs, u2: UserPrefs): [Level | null, Level | null] {
    const u1Levels = [...u1.levels];
    const u2Levels = [...u2.levels];

    if (u1Levels.length === 1 && u2Levels.length === 2) {
        const u1Level = u1Levels[0]!;
        const u2Level = u1Level === "beginner" ? "muscle" : "beginner";
        return [u1Level, u2Level];
    }

    if (u2Levels.length === 1 && u1Levels.length === 2) {
        const u2Level = u2Levels[0]!;
        const u1Level = u2Level === "beginner" ? "muscle" : "beginner";
        return [u1Level, u2Level];
    }

    if (u1Levels.length === 2 && u2Levels.length === 2) {
        return ["beginner", "muscle"];
    }

    return [u1Levels[0] ?? null, u2Levels[0] ?? null];
}

export type FormattedMember = {
    name: string;
    level: Level | null;
};

export type FormattedPair = {
    region: Region | null;
    members: [FormattedMember, FormattedMember];
    hasInsertedUser: boolean;
};

export type LotteryResult = {
    pairs: FormattedPair[];
    insertedUser: { name: string; pairIndices: number[] } | null;
    score: { normalized: number; total: number; max: number };
    participantCount: number;
    config: {
        regionMatchScore: number;
        penaltyBeginnerPair: number;
        simulationRounds: number;
    };
};

const getPairKey = (pair: [UserPrefs, UserPrefs]) => {
    if (!pair[0] || !pair[1]) return "";
    return [pair[0].id, pair[1].id].toSorted().join("-");
};

export function formatResult(
    result: MatchingResult,
    userIdToName: Map<string, string>
): LotteryResult {
    const REGION_ORDER: Record<string, number> = { frontend: 0, backend: 1 };

    const getPairSortKey = (pair: [UserPrefs, UserPrefs]): [number, number] => {
        const [u1, u2] = pair;
        if (!u1 || !u2) return [2, 1];
        const commonRegion = [...u1.regions].find(r => u2.regions.has(r));
        const regionKey = commonRegion === undefined ? 2 : (REGION_ORDER[commonRegion] ?? 2);
        const levelKey = isBeginnerPair(u1, u2) ? 1 : 0;
        return [regionKey, levelKey];
    };

    const sortedPairs = [...result.pairs].toSorted((a, b) => {
        const [aRegion, aRole] = getPairSortKey(a);
        const [bRegion, bRole] = getPairSortKey(b);
        return aRegion === bRegion ? aRole - bRole : aRegion - bRegion;
    });

    const insertedPairKeys = new Set(
        (result.insertedIntoPairs ?? []).map(pair => getPairKey(pair))
    );

    const formattedPairs: FormattedPair[] = sortedPairs.map(pair => {
        const [u1, u2] = pair;
        if (!u1 || !u2) {
            return {
                region: null,
                members: [
                    { name: "?", level: null },
                    { name: "?", level: null },
                ],
                hasInsertedUser: false,
            };
        }

        const region = getPairRegion(u1, u2);

        const [level1, level2] = resolveLevelsPair(u1, u2);

        let member1: FormattedMember = {
            name: userIdToName.get(u1.id) ?? u1.id,
            level: level1,
        };
        let member2: FormattedMember = {
            name: userIdToName.get(u2.id) ?? u2.id,
            level: level2,
        };

        if (member1.level === "beginner") {
            [member1, member2] = [member2, member1];
        }

        return {
            region,
            members: [member1, member2],
            hasInsertedUser: insertedPairKeys.has(getPairKey(pair)),
        };
    });

    let insertedUser: LotteryResult["insertedUser"] = null;
    if (result.insertedUser) {
        const name = userIdToName.get(result.insertedUser.id) ?? result.insertedUser.id;
        const indices: number[] = [];
        for (const [index, p] of formattedPairs.entries()) {
            if (p.hasInsertedUser) indices.push(index);
        }
        insertedUser = { name, pairIndices: indices };
    }

    const maxScore = result.pairs.length * SCORE_REGION_MATCH;
    const normalized = maxScore > 0 ? result.totalScore / maxScore : 0;

    const totalParticipants = result.pairs.length * 2 + (result.insertedUser ? 1 : 0);

    return {
        pairs: formattedPairs,
        insertedUser,
        score: {
            normalized: Math.round(normalized * 1000) / 1000,
            total: result.totalScore,
            max: maxScore,
        },
        participantCount: totalParticipants,
        config: {
            regionMatchScore: SCORE_REGION_MATCH,
            penaltyBeginnerPair: PENALTY_BEGINNER_PAIR,
            simulationRounds: SIMULATION_ROUNDS,
        },
    };
}
