export type Region = "frontend" | "backend";
export type Role = "navigator" | "driver";

export type UserPrefs = {
    id: string;
    regions: Set<Region>;
    roles: Set<Role>;
    /** 正規化前の領域スタンプの押下数（0=未押し, 1=片方, 2=両方） */
    originalRegionSize: number;
    /** 正規化前の役割スタンプの押下数（0=未押し, 1=片方, 2=両方） */
    originalRoleSize: number;
};

export type MatchingResult = {
    pairs: [UserPrefs, UserPrefs][];
    /** 奇数人のとき2つのペアに挿入される人。nullなら挿入なし */
    insertedUser: UserPrefs | null;
    /** insertedUser が挿入されるペア（pairs の要素と同一参照） */
    insertedIntoPairs: [UserPrefs, UserPrefs][] | null;
    totalScore: number;
    /** フロントエンドペア数とバックエンドペア数の絶対差 */
    regionImbalance: number;
};
