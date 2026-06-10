import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getResults, type ResultSummary } from "@/api";
import { paths } from "@/router";

export function ResultsPage() {
    const [results, setResults] = useState<ResultSummary[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        getResults()
            .then(setResults)
            .catch((e) => setError(e instanceof Error ? e.message : "取得失敗"))
            .finally(() => setLoading(false));
    }, []);

    return (
        <div className="container">
            <header className="header">
                <h1>抽選結果一覧</h1>
                <p className="subtitle">過去の抽選結果</p>
            </header>

            {loading && <p className="text-muted">読み込み中...</p>}
            {error && <div className="inline-error">{error}</div>}

            {!loading && results.length === 0 && (
                <p className="text-muted">まだ抽選結果がありません。</p>
            )}

            <div className="results-list">
                {results.map((r) => (
                    <Link
                        key={r.id}
                        to={paths.resultDetail(r.id)}
                        className="result-card"
                    >
                        <div className="result-card-month">{r.month}</div>
                        <div className="result-card-date">
                            {new Date(r.createdAt).toLocaleString("ja-JP")}
                        </div>
                        <span className="result-card-arrow">→</span>
                    </Link>
                ))}
            </div>
        </div>
    );
}
