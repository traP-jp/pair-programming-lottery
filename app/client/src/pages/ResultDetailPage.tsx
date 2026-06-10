import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { getResult, type LotteryResponse } from "@/api";
import { LotteryResultView } from "@/components/LotteryResultView";

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

            <LotteryResultView result={result} title="ペア一覧" />
        </div>
    );
}
