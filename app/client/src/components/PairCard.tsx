import type { LotteryResponse } from "../api";

type FormattedMember = LotteryResponse["pairs"][number]["members"][number];
type FormattedPair = LotteryResponse["pairs"][number];

function getRegionLabel(region: string | null): string {
    if (region === "frontend") return "フロントエンド";
    if (region === "backend") return "バックエンド";
    return "";
}

function getRoleLabel(role: string | null): string {
    if (!role) return "";
    if (role === "navigator") return "ナビゲーター";
    if (role === "driver") return "ドライバー";
    return "";
}

function Member({ member }: { member: FormattedMember }) {
    return (
        <span className="member">
            <span className="member-name">@{member.name}</span>
            {member.role && (
                <span className={`role-tag ${member.role}`}>
                    {getRoleLabel(member.role)}
                </span>
            )}
        </span>
    );
}

export type Props = {
    pair: FormattedPair;
    index: number;
    insertedUser: LotteryResponse["insertedUser"];
};

export function PairCard({ pair, index, insertedUser }: Props) {
    return (
        <div className="pair-card">
            <div className="pair-card-header">
                <span className="pair-number">ペア {index + 1}</span>
                {pair.region && (
                    <span className={`region-tag ${pair.region}`}>
                        {getRegionLabel(pair.region)}
                    </span>
                )}
            </div>
            <div className="pair-members">
                <Member member={pair.members[0]} />
                <span className="pair-separator">&amp;</span>
                <Member member={pair.members[1]} />
                {pair.hasInsertedUser && insertedUser && (
                    <>
                        <span className="pair-separator">&amp;</span>
                        <span className="member">
                            <span className="member-name">
                                @{insertedUser.name}
                            </span>
                            <span className="role-tag inserted">参加</span>
                        </span>
                    </>
                )}
            </div>
        </div>
    );
}
