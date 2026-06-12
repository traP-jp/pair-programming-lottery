import { useState } from "react";
import { Link } from "react-router-dom";
import {
    postMessage,
    runLottery,
    saveResult,
    type LotteryResult,
} from "@client/api";
import { LotteryResultView } from "@client/components/LotteryResultView";
import { paths } from "@client/router";

export function ManagePage() {
    const [channelId, setChannelId] = useState("");
    const [posting, setPosting] = useState(false);
    const [postError, setPostError] = useState<string | null>(null);
    const [postedMessageId, setPostedMessageId] = useState<string | null>(null);

    const [messageId, setMessageId] = useState("");
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [saveError, setSaveError] = useState<string | null>(null);
    const [savedResultId, setSavedResultId] = useState<string | null>(null);
    const [result, setResult] = useState<LotteryResult | null>(null);

    const handlePost = async (e: React.FormEvent) => {
        e.preventDefault();
        const id = channelId.trim();
        if (!id) return;

        setPosting(true);
        setPostError(null);
        setPostedMessageId(null);
        try {
            const msgId = await postMessage(id);
            setPostedMessageId(msgId);
            setMessageId(msgId);
        } catch (err) {
            setPostError(err instanceof Error ? err.message : "不明なエラー");
        } finally {
            setPosting(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const id = messageId.trim();
        if (!id) return;

        setLoading(true);
        setError(null);
        setSaveError(null);
        setSavedResultId(null);
        setResult(null);
        try {
            const data = await runLottery(id);
            setResult(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : "不明なエラー");
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        const id = messageId.trim();
        if (!id || !result) return;

        setSaving(true);
        setSaveError(null);
        try {
            const saved = await saveResult({ messageId: id, result });
            setSavedResultId(saved.id);
        } catch (err) {
            setSaveError(err instanceof Error ? err.message : "不明なエラー");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="container">
            <header className="header">
                <h1>手動操作</h1>
            </header>

            <section className="input-section">
                <h2 className="step-title">
                    <span className="step-badge">1</span>質問メッセージを投稿
                </h2>
                <form onSubmit={handlePost}>
                    <label htmlFor="channel-id">チャンネル ID (UUID)</label>
                    <div className="input-row">
                        <input
                            type="text"
                            id="channel-id"
                            placeholder="例: 9afe32b4-f79d-4f4a-8f95-1c7c9c2a7f33"
                            value={channelId}
                            onChange={(e) => setChannelId(e.target.value)}
                            required
                            pattern="[0-9a-f\-]{36}"
                        />
                        <button type="submit" disabled={posting}>
                            {posting ? (
                                <>
                                    <span className="spinner" />
                                    投稿中...
                                </>
                            ) : (
                                "投稿する"
                            )}
                        </button>
                    </div>
                </form>
                {postError && <div className="inline-error">{postError}</div>}
                {postedMessageId && (
                    <div className="inline-success">
                        ✅
                        メッセージを投稿しました。スタンプが集まったら抽選してください。
                        <br />
                        <span className="message-id-display">
                            メッセージ ID: {postedMessageId}
                        </span>
                    </div>
                )}
            </section>

            <section className="input-section">
                <h2 className="step-title">
                    <span className="step-badge">2</span>抽選を実行
                </h2>
                <form onSubmit={handleSubmit}>
                    <label htmlFor="message-id">メッセージ ID (UUID)</label>
                    <div className="input-row">
                        <input
                            type="text"
                            id="message-id"
                            placeholder="例: 019d2f72-199d-75d9-9e01-ef0edd3d5dc0"
                            value={messageId}
                            onChange={(e) => setMessageId(e.target.value)}
                            required
                            pattern="[0-9a-f\-]{36}"
                        />
                        <button type="submit" disabled={loading}>
                            {loading ? (
                                <>
                                    <span className="spinner" />
                                    抽選中...
                                </>
                            ) : (
                                "抽選する"
                            )}
                        </button>
                    </div>
                </form>
            </section>

            {error && (
                <section className="error-section">
                    <p>{error}</p>
                </section>
            )}

            {saveError && (
                <section className="error-section">
                    <p>{saveError}</p>
                </section>
            )}

            {result && (
                <LotteryResultView result={result}>
                    <div className="trigger-row" style={{ marginTop: "1rem" }}>
                        <button
                            className="btn-secondary"
                            type="button"
                            onClick={handleSave}
                            disabled={saving || !messageId.trim()}
                        >
                            {saving ? (
                                <>
                                    <span className="spinner" />
                                    保存中...
                                </>
                            ) : (
                                "結果一覧に保存"
                            )}
                        </button>
                        {savedResultId && (
                            <Link
                                to={paths.resultDetail(savedResultId)}
                                className="btn-secondary"
                            >
                                保存した結果を見る
                            </Link>
                        )}
                    </div>
                </LotteryResultView>
            )}
        </div>
    );
}
