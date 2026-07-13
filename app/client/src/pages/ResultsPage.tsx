import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import {
    type ResultSummary,
    cacheResults,
    getCachedResults,
    getResults,
    refreshResults,
} from "@client/api";
import { paths } from "@client/router/routes";
import { formatJstDateTime } from "@client/utils/dateTime";
import { getErrorMessage } from "@client/utils/errors";

export function ResultsPage({
    initialResults,
    onPrefetchDetail,
}: {
    initialResults?: ResultSummary[];
    onPrefetchDetail?: (id: string) => void;
}) {
    const cachedResults = getCachedResults();
    const [results, setResults] = useState<ResultSummary[]>(cachedResults ?? initialResults ?? []);
    const [loading, setLoading] = useState(cachedResults === null && initialResults === undefined);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (initialResults !== undefined && getCachedResults() === null)
            cacheResults(initialResults);

        let cancelled = false;
        let refreshed = false;

        // Nothing to paint yet: read through the service-worker cache first so
        // the list appears immediately even on a slow network. The refresh
        // below revalidates in the background and replaces it when it lands.
        if (getCachedResults() === null && initialResults === undefined) {
            getResults()
                .then(cached => {
                    if (cancelled || refreshed) return;
                    setResults(cached);
                    setLoading(false);
                })
                .catch(() => undefined);
        }

        refreshResults()
            .then(fresh => {
                refreshed = true;
                if (!cancelled) setResults(fresh);
            })
            .catch(error_ => {
                if (!cancelled) setError(getErrorMessage(error_, "取得失敗"));
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });

        return () => {
            cancelled = true;
        };
    }, [initialResults]);

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
                {results.map(r => (
                    <Link
                        key={r.id}
                        to={paths.resultDetail(r.id)}
                        className="result-card"
                        onMouseEnter={() => onPrefetchDetail?.(r.id)}
                        onFocus={() => onPrefetchDetail?.(r.id)}
                        onTouchStart={() => onPrefetchDetail?.(r.id)}
                    >
                        <div className="result-card-month">{r.month}</div>
                        <div className="result-card-date">{formatJstDateTime(r.createdAt)}</div>
                        <span className="result-card-arrow">→</span>
                    </Link>
                ))}
            </div>
        </div>
    );
}
