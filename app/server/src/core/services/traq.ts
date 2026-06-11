import {
    buildBotUserIds,
    buildStampMap,
    buildUserNameMap,
    createApiClient,
} from "@server/external/traq";

export type TraqClient = ReturnType<typeof createApiClient>;

export function createTraqService(client: TraqClient) {
    let stampMapPromise: ReturnType<typeof buildStampMap> | null = null;
    async function getStampMap() {
        if (!stampMapPromise) stampMapPromise = buildStampMap(client);
        return stampMapPromise;
    }

    let botUserIdsCache: { ids: Set<string>; expiresAt: number } | null = null;
    async function getBotUserIds() {
        const now = Date.now();
        if (!botUserIdsCache || now > botUserIdsCache.expiresAt) {
            const ids = await buildBotUserIds(client);
            botUserIdsCache = { ids, expiresAt: now + 10 * 60 * 1000 };
        }
        return botUserIdsCache.ids;
    }

    let userNameMapCache: { map: Map<string, string>; expiresAt: number } | null =
        null;
    async function getUserNameMap() {
        const now = Date.now();
        if (!userNameMapCache || now > userNameMapCache.expiresAt) {
            const map = await buildUserNameMap(client);
            userNameMapCache = { map, expiresAt: now + 10 * 60 * 1000 };
        }
        return userNameMapCache.map;
    }

    return {
        client,
        getStampMap,
        getBotUserIds,
        getUserNameMap,
    };
}

export type TraqService = ReturnType<typeof createTraqService>;
