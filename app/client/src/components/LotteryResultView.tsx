import type { LotteryResult } from "@client/api";
import { PairCard } from "@client/components/PairCard";

export type Props = {
    result: LotteryResult;
    title?: string;
    children?: React.ReactNode;
};

export function LotteryResultView({ result, title = "抽選結果", children }: Props) {
    return (
        <section className="result-section">
            <div className="result-header">
                <h2>{title}</h2>
                <div className="stats">
                    <span className="stat-badge">{result.participantCount}人</span>
                    <span className="stat-badge">スコア {result.score.normalized.toFixed(3)}</span>
                </div>
            </div>

            <div className="pairs-container">
                {result.pairs.map((pair, index) => (
                    <PairCard
                        key={index}
                        pair={pair}
                        index={index}
                    />
                ))}
            </div>

            {children}
        </section>
    );
}
