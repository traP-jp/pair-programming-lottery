import { useEffect, useState, useCallback } from "react";
import {
    getSchedule,
    upsertSchedule,
    triggerPost,
    triggerLottery,
    type ScheduleRecord,
} from "@client/api";

export function AdminPage() {
    const [schedule, setSchedule] = useState<ScheduleRecord | null>(null);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const [channelId, setChannelId] = useState("");
    const [postDay, setPostDay] = useState(1);
    const [lotteryDay, setLotteryDay] = useState(15);
    const [enabled, setEnabled] = useState(true);

    const fetchSchedule = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const s = await getSchedule();
            setSchedule(s);
            if (s) {
                setChannelId(s.channelId);
                setPostDay(s.postDay);
                setLotteryDay(s.lotteryDay);
                setEnabled(s.enabled);
            }
        } catch (e) {
            setError(e instanceof Error ? e.message : "取得失敗");
        } finally {
            setLoading(false);
        }
    }, []);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setError(null);
        setSuccess(null);
        try {
            const s = await upsertSchedule({
                channelId,
                postDay,
                lotteryDay,
                enabled,
            });
            setSchedule(s);
            setSuccess("設定を保存しました。");
        } catch (e) {
            setError(e instanceof Error ? e.message : "保存失敗");
        } finally {
            setSaving(false);
        }
    };

    const handleTriggerPost = async () => {
        setError(null);
        setSuccess(null);
        try {
            const { messageId } = await triggerPost();
            setSuccess(`✅ メッセージを投稿しました (${messageId})`);
            fetchSchedule();
        } catch (e) {
            setError(e instanceof Error ? e.message : "投稿失敗");
        }
    };

    const handleTriggerLottery = async () => {
        setError(null);
        setSuccess(null);
        try {
            const { responseId } = await triggerLottery();
            setSuccess(`✅ 抽選が完了しました。結果 ID: ${responseId}`);
        } catch (e) {
            setError(e instanceof Error ? e.message : "抽選失敗");
        }
    };

    useEffect(() => {
        fetchSchedule();
    }, [fetchSchedule]);

    if (loading && !schedule) {
        return (
            <div
                className="container"
                style={{ textAlign: "center", padding: "2rem" }}
            >
                <span className="spinner" />
                <p className="text-muted">設定を読み込み中...</p>
            </div>
        );
    }

    return (
        <div className="container">
            <header className="header">
                <h1>スケジュール設定</h1>
                <p className="subtitle">定期抽選の設定</p>
            </header>

            {error && <div className="inline-error">{error}</div>}
            {success && <div className="inline-success">{success}</div>}

            <section className="input-section">
                <h2 className="step-title">スケジュール</h2>
                <form onSubmit={handleSave} className="admin-form">
                    <div className="form-group">
                        <label htmlFor="admin-channel-id">
                            チャンネル ID (UUID)
                        </label>
                        <input
                            id="admin-channel-id"
                            type="text"
                            value={channelId}
                            onChange={(e) => setChannelId(e.target.value)}
                            placeholder="例: 9afe32b4-f79d-4f4a-8f95-1c7c9c2a7f33"
                            required
                            pattern="[0-9a-f\-]{36}"
                        />
                    </div>
                    <div className="form-row">
                        <div className="form-group">
                            <label htmlFor="post-day">投稿日 (毎月何日)</label>
                            <input
                                id="post-day"
                                type="number"
                                min={1}
                                max={27}
                                value={postDay}
                                onChange={(e) =>
                                    setPostDay(Number(e.target.value))
                                }
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label htmlFor="lottery-day">
                                抽選日 (毎月何日)
                            </label>
                            <input
                                id="lottery-day"
                                type="number"
                                min={2}
                                max={28}
                                value={lotteryDay}
                                onChange={(e) =>
                                    setLotteryDay(Number(e.target.value))
                                }
                                required
                            />
                        </div>
                    </div>
                    {postDay >= lotteryDay && (
                        <div className="inline-error">
                            抽選日は投稿日より後にしてください。
                        </div>
                    )}
                    <div className="form-group">
                        <label className="checkbox-label">
                            <input
                                type="checkbox"
                                checked={enabled}
                                onChange={(e) => setEnabled(e.target.checked)}
                            />
                            スケジュールを有効にする
                        </label>
                    </div>
                    <button
                        type="submit"
                        disabled={saving || postDay >= lotteryDay}
                    >
                        {saving ? (
                            <>
                                <span className="spinner" />
                                保存中...
                            </>
                        ) : (
                            "保存"
                        )}
                    </button>
                </form>
            </section>

            {schedule && (
                <section className="input-section">
                    <h2 className="step-title">即時実行</h2>
                    <p
                        className="text-muted"
                        style={{ marginBottom: "0.75rem", fontSize: "0.85rem" }}
                    >
                        スケジュールを待たずに今すぐ実行します。
                    </p>
                    <div className="trigger-row">
                        <button
                            className="btn-secondary"
                            onClick={handleTriggerPost}
                        >
                            今すぐ投稿
                        </button>
                        <button
                            className="btn-secondary"
                            onClick={handleTriggerLottery}
                            disabled={!schedule.lastMessageId}
                        >
                            今すぐ抽選
                        </button>
                    </div>
                    {schedule.lastMessageId && (
                        <p
                            className="text-muted"
                            style={{ marginTop: "0.5rem", fontSize: "0.8rem" }}
                        >
                            直近の投稿 ID: <code>{schedule.lastMessageId}</code>
                            {schedule.lastPostedAt &&
                                ` (${new Date(schedule.lastPostedAt).toLocaleString("ja-JP")})`}
                        </p>
                    )}
                    {schedule.lastLotteryAt && (
                        <p
                            className="text-muted"
                            style={{ fontSize: "0.8rem" }}
                        >
                            直近の抽選:{" "}
                            {new Date(schedule.lastLotteryAt).toLocaleString(
                                "ja-JP",
                            )}
                        </p>
                    )}
                </section>
            )}
        </div>
    );
}
