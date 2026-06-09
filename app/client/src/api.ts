import { hc, type InferResponseType } from "hono/client";
import type { Routes } from "../../server/src/routes";

const client = hc<Routes>("/");

export type LotteryResponse = InferResponseType<
    typeof client.api.lottery.$post,
    200
>;
export type ScheduleRecord = Exclude<
    InferResponseType<typeof client.api.schedule.$get, 200>,
    null
>;
export type ResultSummary = InferResponseType<
    typeof client.api.results.$get,
    200
>[number];
export type ResultDetail = InferResponseType<
    (typeof client.api.results)[":id"]["$get"],
    200
>;
export type SavedResult = InferResponseType<
    typeof client.api.results.$post,
    200
>;

export async function postMessage(channelId: string): Promise<string> {
    const res = await client.api["post-message"].$post({ json: { channelId } });
    if (!res.ok) {
        const d = (await res.json()) as { error?: string };
        throw new Error(d.error ?? `HTTP ${res.status}`);
    }
    return (await res.json()).messageId;
}

export async function runLottery(messageId: string): Promise<LotteryResponse> {
    const res = await client.api.lottery.$post({ json: { messageId } });
    if (!res.ok) {
        const d = (await res.json()) as { error?: string };
        throw new Error(d.error ?? `HTTP ${res.status}`);
    }
    return (await res.json()) as LotteryResponse;
}

export async function getResults(): Promise<ResultSummary[]> {
    const res = await client.api.results.$get();
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
}

export async function getResult(id: string): Promise<ResultDetail> {
    const res = await client.api.results[":id"].$get({ param: { id } });
    if (!res.ok) {
        const d = (await res.json()) as { error?: string };
        throw new Error(d.error ?? `HTTP ${res.status}`);
    }
    return res.json() as Promise<ResultDetail>;
}

export async function getSchedule(): Promise<ScheduleRecord | null> {
    const res = await client.api.schedule.$get();
    if (res.status === 401) throw new Error("unauthorized");
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
}

export async function upsertSchedule(data: {
    channelId: string;
    postDay: number;
    lotteryDay: number;
    enabled: boolean;
}): Promise<ScheduleRecord> {
    const res = await client.api.schedule.$put({ json: data });
    if (res.status === 401) throw new Error("unauthorized");
    if (!res.ok) {
        const d = (await res.json()) as { error?: string };
        throw new Error(d.error ?? `HTTP ${res.status}`);
    }
    return res.json() as Promise<ScheduleRecord>;
}

export async function triggerPost(): Promise<{ messageId: string }> {
    const res = await client.api.schedule["trigger-post"].$post();
    if (res.status === 401) throw new Error("unauthorized");
    if (!res.ok) {
        const d = (await res.json()) as { error?: string };
        throw new Error(d.error ?? `HTTP ${res.status}`);
    }
    return res.json() as Promise<{ messageId: string }>;
}

export async function triggerLottery(): Promise<{ responseId: string }> {
    const res = await client.api.schedule["trigger-lottery"].$post();
    if (res.status === 401) throw new Error("unauthorized");
    if (!res.ok) {
        const d = (await res.json()) as { error?: string };
        throw new Error(d.error ?? `HTTP ${res.status}`);
    }
    return res.json() as Promise<{ responseId: string }>;
}

export async function saveResult(data: {
    messageId: string;
    result: LotteryResponse;
}): Promise<SavedResult> {
    const res = await client.api.results.$post({ json: data });
    if (!res.ok) {
        const d = (await res.json()) as { error?: string };
        throw new Error(d.error ?? `HTTP ${res.status}`);
    }
    return res.json() as Promise<SavedResult>;
}
