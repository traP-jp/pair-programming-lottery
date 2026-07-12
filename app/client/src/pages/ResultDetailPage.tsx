import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import {
    type LotteryResult,
    type ResultDetail,
    cacheResult,
    getCachedResult,
    getResult,
    refreshResults,
} from "@client/api";
import { LotteryResultView } from "@client/components/LotteryResultView";
import { CheckIcon, ChevronDownIcon, CopyIcon } from "@client/components/icons";
import { paths } from "@client/router/routes";
import { formatJstDateTime } from "@client/utils/dateTime";
import { getErrorMessage } from "@client/utils/errors";

export function ResultDetailPage({
    initialRecord,
    resultId,
}: {
    initialRecord?: ResultDetail | null;
    resultId?: string;
}) {
    const routeParams = useParams<{ id: string }>();
    const id = resultId ?? routeParams.id;
    const cachedRecord = id ? getCachedResult(id) : undefined;
    const [record, setRecord] = useState<ResultDetail | null>(
        initialRecord ?? cachedRecord ?? null
    );
    const [loading, setLoading] = useState(
        initialRecord === undefined && cachedRecord === undefined
    );
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (initialRecord !== undefined) {
            if (initialRecord) cacheResult(initialRecord);
            return;
        }
        if (!id) return;
        getResult(id)
            .then(d => setRecord(d))
            .catch(error_ => setError(getErrorMessage(error_, "取得失敗")))
            .finally(() => setLoading(false));
    }, [id, initialRecord]);

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
            <Link
                to={paths.results}
                className="back-link"
                onMouseEnter={() => void refreshResults()}
                onFocus={() => void refreshResults()}
                onTouchStart={() => void refreshResults()}
            >
                ← 一覧に戻る
            </Link>

            <header className="header">
                <h1>抽選結果</h1>
                <p className="subtitle">
                    {record.month} — {formatJstDateTime(record.createdAt)}
                </p>
            </header>

            <LotteryResultView
                result={result}
                title="ペア一覧"
            />

            <CopyParticipantsSection result={result} />
        </div>
    );
}

function CopyParticipantsSection({ result }: { result: LotteryResult }) {
    const [copied, setCopied] = useState(false);

    const participantNames = new Set<string>();
    for (const pair of result.pairs) {
        for (const m of pair.members) {
            if (m.name) participantNames.add(m.name);
        }
    }
    if (result.insertedUser?.name) {
        participantNames.add(result.insertedUser.name);
    }

    const csvText = [...participantNames].map(name => `@${name}`).join(", ");

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(csvText);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (error) {
            console.error("Failed to copy:", error);
        }
    };

    return (
        <details className="participants-accordion">
            <summary className="participants-summary">
                <span className="summary-title">参加者一覧</span>
                <span className="summary-icon">
                    <ChevronDownIcon />
                </span>
            </summary>
            <div className="participants-content">
                <div className="code-block-container">
                    <code className="participants-code">{csvText}</code>
                    <button
                        className="copy-btn"
                        onClick={handleCopy}
                    >
                        {copied ? (
                            <>
                                <CheckIcon className="copy-btn-icon success" />
                                <span>コピー</span>
                            </>
                        ) : (
                            <>
                                <CopyIcon className="copy-btn-icon" />
                                <span>コピー</span>
                            </>
                        )}
                    </button>
                </div>
            </div>
        </details>
    );
}
