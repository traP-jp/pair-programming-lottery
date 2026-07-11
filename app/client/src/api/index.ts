import { calculateArrayHash } from "@client/utils/hash";
import type { Routes } from "@server/routes";
import { type InferResponseType, hc } from "hono/client";

const apiOrigin =
    typeof window === "undefined" ? (process.env.SSR_API_ORIGIN ?? "http://localhost:3000") : "";
const client = hc<Routes>(apiOrigin);

async function readError(response: Response): Promise<Error> {
    try {
        const body = await response.json();
        return new Error(body.error ?? `HTTP ${response.status}`, { cause: body });
    } catch {
        return new Error(`HTTP ${response.status}`, { cause: response });
    }
}

interface JsonResponse<T> extends Response {
    json(): Promise<T>;
}

async function readJson<T>(
    response: JsonResponse<T>,
    { requireAuthentication = false }: { requireAuthentication?: boolean } = {}
): Promise<T> {
    if (requireAuthentication && response.status === 401) throw new Error("unauthorized");
    if (!response.ok) throw await readError(response);
    return response.json();
}

export type LotteryResult = InferResponseType<typeof client.api.lottery.$post, 200>;
export type ScheduleResponse = InferResponseType<typeof client.api.schedule.$get, 200>;
export type ScheduleRecord = Exclude<ScheduleResponse, null>;
export type ResultSummary = InferResponseType<typeof client.api.results.$get, 200>[number];
export type ResultDetail = InferResponseType<(typeof client.api.results)[":id"]["$get"], 200>;
export type SavedResult = InferResponseType<typeof client.api.results.$post, 200>;

const resultCache = new Map<string, ResultDetail>();
const resultRequests = new Map<string, Promise<ResultDetail>>();

let resultsListCache: ResultSummary[] | null = null;
let resultsListHash: string | null = null;
let resultsListRequest: Promise<ResultSummary[]> | null = null;

export function getCachedResults() {
    return resultsListCache;
}

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
    return (await readJson(response)).messageId;
}

export async function runLottery(messageId: string) {
    const response = await client.api.lottery.$post({ json: { messageId } });
    return readJson(response);
}

export async function getResults() {
    if (resultsListRequest) return resultsListRequest;

    resultsListRequest = (async () => {
        const response = await client.api.results.$get();
        const results = await readJson(response);
        const hash = calculateArrayHash(results.map(({ id }) => id));

        if (resultsListHash !== hash) {
            resultsListCache = results;
            resultsListHash = hash;
        }

        return resultsListCache!;
    })().finally(() => {
        resultsListRequest = null;
    });

    return resultsListRequest;
}

export async function getResult(id: string): Promise<ResultDetail> {
    const cached = getCachedResult(id);
    if (cached) return cached;

    const pending = resultRequests.get(id);
    if (pending) return pending;

    const request = (async () => {
        const response = await client.api.results[":id"].$get({ param: { id } });
        const result = await readJson(response);
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
    const response = await client.api.schedule.$get();
    return readJson(response, {
        requireAuthentication: true,
    });
}

export async function upsertSchedule(data: {
    channelId: string;
    postDay: number;
    lotteryDay: number;
    enabled: boolean;
}) {
    const response = await client.api.schedule.$put({ json: data });
    return readJson(response, {
        requireAuthentication: true,
    });
}

export async function triggerPost() {
    const response = await client.api.schedule["trigger-post"].$post();
    return readJson(response, {
        requireAuthentication: true,
    });
}

export async function triggerLottery() {
    const response = await client.api.schedule["trigger-lottery"].$post();
    return readJson(response, { requireAuthentication: true });
}

export async function saveResult(data: { messageId: string; result: LotteryResult }) {
    const response = await client.api.results.$post({ json: data });
    const saved = await readJson(response);
    cacheResult(saved);
    notifyResultSaved(saved);
    return saved;
}
