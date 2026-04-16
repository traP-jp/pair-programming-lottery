import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { getResult, type LotteryResponse } from "../api";
import { PairCard } from "../components/PairCard";

type RawResult = {
    id: string;
    createdAt: string;
    channelId: string;
    month: string;
    result: LotteryResponse;
};

export function ResultDetailPage() {
    const { id } = useParams<{ id: string }>();
    const [record, setRecord] = useState<RawResult | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!id) return;
        getResult(id)
            .then((d) => setRecord(d as unknown as RawResult))
            .catch((e) => setError(e instanceof Error ? e.message : "取得失敗"))
            .finally(() => setLoading(false));
    }, [id]);

    if (loading)
        return (
            <div className="container">
                <p className="text-muted">読み込み中...</p>
            </div>
        );
    if (error)
        return (
            <div className="container">
                <div className="inline-error">{error}</div>
            </div>
        );
    if (!record) return null;

    const { result } = record;

    return (
        <div className="container">
            <Link to="/results" className="back-link">
                ← 一覧に戻る
            </Link>

            <header className="header">
                <h1>抽選結果</h1>
                <p className="subtitle">
                    {record.month} —{" "}
                    {new Date(record.createdAt).toLocaleString("ja-JP")}
                </p>
            </header>

            <section className="result-section">
                <div className="result-header">
                    <h2>ペア一覧</h2>
                    <div className="stats">
                        <span className="stat-badge">
                            {result.participantCount}人
                        </span>
                        <span className="stat-badge">
                            スコア {result.score.normalized.toFixed(3)}
                        </span>
                    </div>
                </div>

                <div className="pairs-container">
                    {result.pairs.map((pair, i) => (
                        <PairCard
                            key={i}
                            pair={pair}
                            index={i}
                            insertedUser={result.insertedUser}
                        />
                    ))}
                </div>

                {result.insertedUser && (
                    <div className="inserted-note">
                        ※ @{result.insertedUser.name}{" "}
                        は人数調整のため上記2ペアに参加します
                    </div>
                )}

                <details className="config-details">
                    <summary>スコア詳細</summary>
                    <div className="score-details">
                        <p>
                            スコア: {result.score.total} / {result.score.max} (
                            {result.score.normalized.toFixed(3)})
                        </p>
                        <p>
                            領域一致: 1ペアあたり +
                            {result.config.regionMatchScore}点
                        </p>
                        <p>
                            役割補完: 1ペアあたり +
                            {result.config.roleComplementScore}点
                        </p>
                        <p>
                            シミュレーション回数:{" "}
                            {result.config.simulationRounds}回
                        </p>
                    </div>
                </details>
            </section>
        </div>
    );
}
