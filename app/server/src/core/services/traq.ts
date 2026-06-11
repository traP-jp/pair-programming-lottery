import {
    buildBotUserIds,
    buildStampMap,
    buildUserNameMap,
    createApiClient,
} from "@server/external/traq";
import { getEnv } from "@server/utilities/env";

export const traq = createApiClient(getEnv("TRAQ_ACCESS_TOKEN"));

let stampMapPromise: ReturnType<typeof buildStampMap> | null = null;
export async function getStampMap() {
    if (!stampMapPromise) stampMapPromise = buildStampMap(traq);
    return stampMapPromise;
}

let botUserIdsCache: { ids: Set<string>; expiresAt: number } | null = null;
export async function getBotUserIds() {
    const now = Date.now();
    if (!botUserIdsCache || now > botUserIdsCache.expiresAt) {
        const ids = await buildBotUserIds(traq);
        botUserIdsCache = { ids, expiresAt: now + 10 * 60 * 1000 };
    }
    return botUserIdsCache.ids;
}

let userNameMapCache: { map: Map<string, string>; expiresAt: number } | null =
    null;
export async function getUserNameMap() {
    const now = Date.now();
    if (!userNameMapCache || now > userNameMapCache.expiresAt) {
        const map = await buildUserNameMap(traq);
        userNameMapCache = { map, expiresAt: now + 10 * 60 * 1000 };
    }
    return userNameMapCache.map;
}
