import { type ITraqClient } from "@server/external/traq";
import type { Region, Role, UserPrefs } from "@server/types";

const TARGET_STAMP_NAMES = ["one", "two", "regional_indicator_a", "regional_indicator_b"] as const;

export type TargetStampName = (typeof TARGET_STAMP_NAMES)[number];

export type StampMaps = {
    stampIdToName: Map<string, TargetStampName>;
    stampNameToId: Map<string, string>;
};

/**
 * ITraqClient から各ハンドラ・サービスが必要なビジネスロジックを提供するサービス。
 * キャッシュは traqClient 側で行う。
 */
export function createTraqService(client: ITraqClient) {
    async function getStampMap(): Promise<StampMaps> {
        const stamps = await client.getStamps();

        const stampIdToName = new Map<string, TargetStampName>();
        const stampNameToId = new Map<string, string>();

        for (const stamp of stamps) {
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

    async function getBotUserIds(): Promise<Set<string>> {
        const users = await client.getUsers();
        return new Set(users.filter(u => u.bot).map(u => u.id));
    }

    async function getuserNameMap(): Promise<Map<string, string>> {
        const users = await client.getUsers();
        const map = new Map<string, string>();
        for (const u of users) {
            if (!u.bot) map.set(u.id, u.name);
        }
        return map;
    }

    /**
     * 指定メッセージのスタンプ情報を元に参加者の希望（UserPrefs）を収集する。
     */
    async function collectUserPrefs(messageId: string): Promise<UserPrefs[]> {
        const [{ stampIdToName }, botUserIds] = await Promise.all([getStampMap(), getBotUserIds()]);

        const message = await client.getMessage(messageId);
        if (!message?.stamps) {
            throw new Error("指定されたメッセージが見つからないか、スタンプが存在しません。");
        }

        const usersMap = new Map<string, UserPrefs>();

        for (const messageStamp of message.stamps) {
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

        return [...usersMap.values()];
    }

    const LOTTERY_MESSAGE = `## ペアプロ抽選

### 領域
- :one: フロントエンド
- :two: バックエンド

### 役割
- :regional_indicator_a: ナビゲーター (指示を出す側)
- :regional_indicator_b: ドライバー (コードを書く側)
`;

    /**
     * 指定チャンネルに抽選メッセージを投稿し、スタンプを付与した後、メッセージIDを返す。
     */
    async function postLotteryMessage(channelId: string): Promise<string> {
        const { stampNameToId } = await getStampMap();

        const { id: messageId } = await client.postChannelMessage(channelId, LOTTERY_MESSAGE);

        await Promise.all(
            TARGET_STAMP_NAMES.map(stampName => {
                const stampId = stampNameToId.get(stampName);
                if (!stampId) return Promise.resolve();
                return client.addMessageStamp(messageId, stampId, 1);
            })
        );

        return messageId;
    }

    /**
     * 指定メッセージが属するチャンネルIDを取得する。
     */
    async function getChannelId(messageId: string): Promise<string> {
        const message = await client.getMessage(messageId);
        if (!message) {
            throw new Error(`message not found: ${messageId}`);
        }
        return message.channelId;
    }

    /**
     * 指定チャンネルにテキストメッセージを投稿する。
     */
    async function postMessage(channelId: string, content: string): Promise<void> {
        await client.postChannelMessage(channelId, content);
    }

    return {
        getStampMap,
        getBotUserIds,
        getuserNameMap,
        collectUserPrefs,
        postLotteryMessage,
        getChannelId,
        postMessage,
    };
}
