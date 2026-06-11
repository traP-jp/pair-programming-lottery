import { Api } from "traq-bot-ts";
import type { UserPrefs, Region, Role } from "@server/types";

const TARGET_STAMP_NAMES = [
    "one",
    "two",
    "regional_indicator_a",
    "regional_indicator_b",
] as const;

export type TargetStampName = (typeof TARGET_STAMP_NAMES)[number];

export function createApiClient(token: string) {
    return new Api({
        baseUrl: "https://q.trap.jp/api/v3",
        baseApiParams: {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        },
    });
}

function unwrapResponse<T>(res: { data: T } | T): T {
    return (res && typeof res === "object" && "data" in res)
        ? (res.data as T)
        : (res as T);
}

export interface ITraqClient {
    stamps: {
        getStamps(): Promise<any>;
    };
    messages: {
        getMessage(messageId: string): Promise<any>;
        addMessageStamp(
            messageId: string,
            stampId: string,
            data: { count: number },
        ): Promise<any>;
    };
    users: {
        getUsers(): Promise<any>;
    };
    channels: {
        postMessage(
            channelId: string,
            data: { content: string; embed: boolean },
        ): Promise<any>;
    };
}

export type StampMaps = {
    stampIdToName: Map<string, TargetStampName>;
    stampNameToId: Map<string, string>;
};

export async function buildStampMap(
    api: ITraqClient,
): Promise<StampMaps> {
    const stampsRes = await api.stamps.getStamps();
    const stampsData = unwrapResponse(stampsRes) as {
        id: string;
        name: string;
    }[];

    const stampIdToName = new Map<string, TargetStampName>();
    const stampNameToId = new Map<string, string>();

    for (const stamp of stampsData) {
        if (TARGET_STAMP_NAMES.includes(stamp.name as TargetStampName)) {
            stampIdToName.set(stamp.id, stamp.name as TargetStampName);
            stampNameToId.set(stamp.name, stamp.id);
        }
    }

    if (stampNameToId.size !== TARGET_STAMP_NAMES.length) {
        console.warn("警告: 対象のスタンプのいくつかが見つかりませんでした", [
            ...stampNameToId.keys(),
        ]);
    }

    return { stampIdToName, stampNameToId };
}

export async function collectUserPrefs(
    api: ITraqClient,
    messageId: string,
    stampIdToName: Map<string, TargetStampName>,
    botUserIds: Set<string>,
): Promise<UserPrefs[]> {
    const messageRes = await api.messages.getMessage(messageId);
    const messageInfo = unwrapResponse(messageRes) as { stamps: { stampId: string; userId: string }[] } | null;

    if (!messageInfo?.stamps) {
        throw new Error(
            "指定されたメッセージが見つからないか、スタンプが存在しません。",
        );
    }

    const usersMap = new Map<string, UserPrefs>();

    for (const messageStamp of messageInfo.stamps) {
        const stampName = stampIdToName.get(messageStamp.stampId);
        if (!stampName) continue;

        const userId = messageStamp.userId;

        if (botUserIds.has(userId)) continue;

        if (!usersMap.has(userId)) {
            usersMap.set(userId, {
                id: userId,
                regions: new Set<Region>(),
                roles: new Set<Role>(),
                originalRegionSize: 0,
                originalRoleSize: 0,
            });
        }
        const prefs = usersMap.get(userId)!;

        if (stampName === "one") prefs.regions.add("frontend");
        if (stampName === "two") prefs.regions.add("backend");
        if (stampName === "regional_indicator_a") prefs.roles.add("navigator");
        if (stampName === "regional_indicator_b") prefs.roles.add("driver");
    }

    for (const prefs of usersMap.values()) {
        prefs.originalRegionSize = prefs.regions.size;
        prefs.originalRoleSize = prefs.roles.size;
    }

    for (const prefs of usersMap.values()) {
        if (prefs.regions.size !== 1) {
            prefs.regions = new Set<Region>(["frontend", "backend"]);
        }
        if (prefs.roles.size !== 1) {
            prefs.roles = new Set<Role>(["navigator", "driver"]);
        }
    }

    return Array.from(usersMap.values());
}

export async function buildUserNameMap(
    api: ITraqClient,
): Promise<Map<string, string>> {
    const usersRes = await api.users.getUsers();
    const systemUsers = unwrapResponse(usersRes) as {
        id: string;
        name: string;
        displayName: string;
        bot: boolean;
    }[];

    const userIdToName = new Map<string, string>();
    for (const u of systemUsers) {
        if (!u.bot) userIdToName.set(u.id, u.name);
    }
    return userIdToName;
}

export async function buildBotUserIds(
    api: ITraqClient,
): Promise<Set<string>> {
    const usersRes = await api.users.getUsers();
    const systemUsers = unwrapResponse(usersRes) as {
        id: string;
        bot: boolean;
    }[];

    return new Set(systemUsers.filter((u) => u.bot).map((u) => u.id));
}

const LOTTERY_MESSAGE = `## ペアプロ抽選

### 領域
- :one: フロントエンド
- :two: バックエンド

### 役割
- :regional_indicator_a: ナビゲーター (指示を出す側)
- :regional_indicator_b: ドライバー (コードを書く側)
`;

export async function postLotteryMessage(
    api: ITraqClient,
    channelId: string,
    stampNameToId: Map<string, string>,
): Promise<string> {
    const res = await api.channels.postMessage(channelId, {
        content: LOTTERY_MESSAGE,
        embed: false,
    });
    const data = unwrapResponse(res) as { id: string };
    const messageId = data.id;

    await Promise.all(
        TARGET_STAMP_NAMES.map((stampName) => {
            const stampId = stampNameToId.get(stampName);
            if (!stampId) return Promise.resolve();
            return api.messages.addMessageStamp(messageId, stampId, {
                count: 1,
            });
        }),
    );

    return messageId;
}
