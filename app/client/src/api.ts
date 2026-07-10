import type { Routes } from "@server/routes";
import { type InferResponseType, hc } from "hono/client";

const apiOrigin =
    typeof window === "undefined" ? (process.env.SSR_API_ORIGIN ?? "http://localhost:3000") : "";
const client = hc<Routes>(apiOrigin);

async function readError(response: Response): Promise<Error> {
    try {
        const body = await response.json();
        return new Error(body.error ?? `HTTP ${response.status}`);
    } catch {
        return new Error(`HTTP ${response.status}`);
    }
}

export type LotteryResult = InferResponseType<typeof client.api.lottery.$post, 200>;
export type ScheduleRecord = Exclude<InferResponseType<typeof client.api.schedule.$get, 200>, null>;
export type ResultSummary = InferResponseType<typeof client.api.results.$get, 200>[number];
export type ResultDetail = InferResponseType<(typeof client.api.results)[":id"]["$get"], 200>;
export type SavedResult = InferResponseType<typeof client.api.results.$post, 200>;

const resultCache = new Map<string, ResultDetail>();
const resultRequests = new Map<string, Promise<ResultDetail>>();

export function cacheResult(result: ResultDetail) {
    resultCache.set(result.id, result);
}

export function getCachedResult(id: string) {
    return resultCache.get(id);
}

function notifyResultSaved(result: ResultDetail) {
    if (typeof navigator === "undefined") return;
    navigator.serviceWorker?.controller?.postMessage({ type: "result-saved", result });
}

export async function postMessage(channelId: string) {
    const response = await client.api["post-message"].$post({ json: { channelId } });
    if (!response.ok) {
        throw await readError(response);
    }
    return (await response.json()).messageId;
}

export async function runLottery(messageId: string) {
    const res = await client.api.lottery.$post({ json: { messageId } });
    if (!res.ok) {
        throw await readError(res);
    }
    return res.json();
}

export async function getResults() {
    const res = await client.api.results.$get();
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
}

export async function getResult(id: string): Promise<ResultDetail> {
    const cached = getCachedResult(id);
    if (cached) return cached;

    const pending = resultRequests.get(id);
    if (pending) return pending;

    const request = (async () => {
        const res = await client.api.results[":id"].$get({ param: { id } });
        if (!res.ok) {
            throw await readError(res);
        }
        const result = (await res.json()) as ResultDetail;
        cacheResult(result);
        return result;
    })().finally(() => resultRequests.delete(id));
    resultRequests.set(id, request);
    return request;
}

export async function prefetchResult(id: string) {
    await getResult(id);
}

export async function getSchedule() {
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
}) {
    const res = await client.api.schedule.$put({ json: data });
    if (res.status === 401) throw new Error("unauthorized");
    if (!res.ok) {
        throw await readError(res);
    }
    return res.json();
}

export async function triggerPost() {
    const res = await client.api.schedule["trigger-post"].$post();
    if (res.status === 401) throw new Error("unauthorized");
    if (!res.ok) {
        throw await readError(res);
    }
    return res.json();
}

export async function triggerLottery() {
    const res = await client.api.schedule["trigger-lottery"].$post();
    if (res.status === 401) throw new Error("unauthorized");
    if (!res.ok) {
        throw await readError(res);
    }
    return res.json();
}

export async function saveResult(data: { messageId: string; result: LotteryResult }) {
    const res = await client.api.results.$post({ json: data });
    if (!res.ok) {
        throw await readError(res);
    }
    const saved = (await res.json()) as SavedResult;
    cacheResult(saved);
    notifyResultSaved(saved);
    return saved;
}
