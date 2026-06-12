import { Api } from "traq-bot-ts";



export type StampInfo = {
    id: string;
    name: string;
};

export type UserInfo = {
    id: string;
    name: string;
    bot: boolean;
};

export type MessageInfo = {
    channelId: string;
    stamps: { stampId: string; userId: string }[];
};

/**
 * traqService が必要とするインターフェース。
 * traq-bot-ts の詳細を隠蔽し、必要なデータのみを返す。
 */
export interface ITraqClient {
    /** スタンプ一覧を取得 (永続キャッシュ) */
    getStamps(): Promise<StampInfo[]>;
    /** 全ユーザー一覧を取得 (TTL キャッシュ) */
    getUsers(): Promise<UserInfo[]>;
    /** メッセージ情報を取得 */
    getMessage(messageId: string): Promise<MessageInfo | null>;
    /** メッセージにスタンプを付与 */
    addMessageStamp(
        messageId: string,
        stampId: string,
        count: number,
    ): Promise<void>;
    /** チャンネルにメッセージを投稿 */
    postChannelMessage(
        channelId: string,
        content: string,
    ): Promise<{ id: string }>;
}

function unwrapResponse<T>(res: { data: T } | T): T {
    return res && typeof res === "object" && "data" in res
        ? (res as { data: T }).data
        : res as T;
}

/**
 * traq-bot-ts の Api をラップし、型変換とキャッシングを提供するクライアント実装。
 * ビジネスロジックは持たない。
 */

export class TraqClient<
    SecurityDataType extends unknown = {},
> implements ITraqClient {
    private readonly api: Api<SecurityDataType>;

    /** スタンプは変更頻度が低いため永続キャッシュ */
    private stampsCache: StampInfo[] | null = null;

    /** ユーザー一覧は TTL キャッシュ (10 分) */
    private usersCache: { users: UserInfo[]; expiresAt: number } | null = null;
    private readonly usersCacheTtlMs = 10 * 60 * 1000;

    constructor(token: string) {
        this.api = new Api<SecurityDataType>({
            baseUrl: "https://q.trap.jp/api/v3",
            baseApiParams: {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            },
        });
    }

    async getStamps(): Promise<StampInfo[]> {
        if (!this.stampsCache) {
            const res = await this.api.stamps.getStamps();
            const data = unwrapResponse<{ id: string; name: string }[]>(res);
            this.stampsCache = data.map((s) => ({ id: s.id, name: s.name }));
        }
        return this.stampsCache;
    }

    async getUsers(): Promise<UserInfo[]> {
        const now = Date.now();
        if (!this.usersCache || now > this.usersCache.expiresAt) {
            const res = await this.api.users.getUsers();
            const data = unwrapResponse<{
                id: string;
                name: string;
                displayName: string;
                bot: boolean;
            }[]>(res);
            const users = data.map((u) => ({
                id: u.id,
                name: u.name,
                bot: u.bot,
            }));
            this.usersCache = { users, expiresAt: now + this.usersCacheTtlMs };
        }
        return this.usersCache.users;
    }

    async getMessage(messageId: string): Promise<MessageInfo | null> {
        const res = await this.api.messages.getMessage(messageId);
        const data = unwrapResponse<{
            channelId: string;
            stamps: { stampId: string; userId: string }[];
        } | null>(res);
        if (!data) return null;
        return {
            channelId: data.channelId,
            stamps: data.stamps,
        };
    }

    async addMessageStamp(
        messageId: string,
        stampId: string,
        count: number,
    ): Promise<void> {
        await this.api.messages.addMessageStamp(messageId, stampId, { count });
    }

    async postChannelMessage(
        channelId: string,
        content: string,
    ): Promise<{ id: string }> {
        const res = await this.api.channels.postMessage(channelId, {
            content,
            embed: false,
        });
        const data = unwrapResponse<{ id: string }>(res);
        return { id: data.id };
    }
}


