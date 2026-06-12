import {
    SCORE_REGION_MATCH,
    SCORE_ROLE_COMPLEMENT,
    SIMULATION_ROUNDS,
} from "@server/core/services/lottery/matching";
import type { MatchingResult, UserPrefs } from "@server/types";

export type Region = "frontend" | "backend";
export type Role = "navigator" | "driver";

function getPairRegion(u: UserPrefs, v: UserPrefs): Region | null {
    return [...u.regions].find(r => v.regions.has(r)) ?? null;
}

function hasComplementaryRole(u1: UserPrefs, u2: UserPrefs): boolean {
    return (
        (u1.roles.has("navigator") && u2.roles.has("driver")) ||
        (u1.roles.has("driver") && u2.roles.has("navigator"))
    );
}

function resolveRolesPair(u1: UserPrefs, u2: UserPrefs): [Role | null, Role | null] {
    if (!hasComplementaryRole(u1, u2)) return [null, null];

    const u1Roles = [...u1.roles];
    const u2Roles = [...u2.roles];

    if (u1Roles.length === 1) {
        const u1Role = u1Roles[0]!;
        const u2Role = u1Role === "navigator" ? "driver" : "navigator";
        return [u1Role, u2Role];
    }

    if (u2Roles.length === 1) {
        const u2Role = u2Roles[0]!;
        const u1Role = u2Role === "navigator" ? "driver" : "navigator";
        return [u1Role, u2Role];
    }

    return ["navigator", "driver"];
}

export type FormattedMember = {
    name: string;
    role: Role | null;
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
        roleComplementScore: number;
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
        const roleKey = hasComplementaryRole(u1, u2) ? 0 : 1;
        return [regionKey, roleKey];
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
                    { name: "?", role: null },
                    { name: "?", role: null },
                ],
                hasInsertedUser: false,
            };
        }

        const region = getPairRegion(u1, u2);

        const [role1, role2] = resolveRolesPair(u1, u2);

        let member1: FormattedMember = {
            name: userIdToName.get(u1.id) ?? u1.id,
            role: role1,
        };
        let member2: FormattedMember = {
            name: userIdToName.get(u2.id) ?? u2.id,
            role: role2,
        };

        if (member1.role === "driver") {
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

    const maxScore = result.pairs.length * (SCORE_REGION_MATCH + SCORE_ROLE_COMPLEMENT);
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
            roleComplementScore: SCORE_ROLE_COMPLEMENT,
            simulationRounds: SIMULATION_ROUNDS,
        },
    };
}
