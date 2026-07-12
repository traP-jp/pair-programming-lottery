import type { Routes } from "@server/routes";
import { type InferResponseType, hc } from "hono/client";

const apiOrigin =
    typeof window === "undefined" ? (process.env.SSR_API_ORIGIN ?? "http://localhost:3000") : "";
const client = hc<Routes>(apiOrigin);

async function readError(response: Response): Promise<Error> {
    try {
        const body = await response.json();
        console.error("API Error:", body);
        return new Error(body.error ?? `HTTP ${response.status}`);
    } catch {
        console.error("API Error:", response);
        return new Error(`HTTP ${response.status}`);
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

export type LotteryResult = InferResponseType<typeof client.api.admin.lottery.$post, 200>;
export type ScheduleResponse = InferResponseType<typeof client.api.admin.schedule.$get, 200>;
export type ScheduleRecord = Exclude<ScheduleResponse, null>;
export type ResultSummary = InferResponseType<typeof client.api.public.results.$get, 200>[number];
export type ResultDetail = InferResponseType<
    (typeof client.api.public.results)[":id"]["$get"],
    200
>;
export type SavedResult = InferResponseType<typeof client.api.admin.results.$post, 200>;

const resultCache = new Map<string, ResultDetail>();
const resultRequests = new Map<string, Promise<ResultDetail>>();

let resultsListCache: ResultSummary[] | null = null;
let resultsListRequest: Promise<ResultSummary[]> | null = null;

export function getCachedResults() {
    return resultsListCache;
}

export function cacheResults(results: ResultSummary[]) {
    resultsListCache = results;
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
    const response = await client.api.admin["post-message"].$post({ json: { channelId } });
    return (await readJson(response)).messageId;
}

export async function runLottery(messageId: string) {
    const response = await client.api.admin.lottery.$post({ json: { messageId } });
    return readJson(response);
}

export async function getResults({ bypassCache = false }: { bypassCache?: boolean } = {}) {
    if (resultsListRequest) return resultsListRequest;

    resultsListRequest = (async () => {
        const response = bypassCache
            ? await client.api.public.results.$get(
                  {},
                  {
                      init: {
                          cache: "no-store",
                          headers: { "Cache-Control": "no-cache" },
                      },
                  }
              )
            : await client.api.public.results.$get();
        const results = await readJson(response);
        cacheResults(results);
        return results;
    })().finally(() => {
        resultsListRequest = null;
    });

    return resultsListRequest;
}

export function refreshResults() {
    return getResults({ bypassCache: true });
}

export async function getResult(id: string): Promise<ResultDetail> {
    const cached = getCachedResult(id);
    if (cached) return cached;

    const pending = resultRequests.get(id);
    if (pending) return pending;

    const request = (async () => {
        const response = await client.api.public.results[":id"].$get({ param: { id } });
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
    const response = await client.api.admin.schedule.$get();
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
    const response = await client.api.admin.schedule.$put({ json: data });
    return readJson(response, {
        requireAuthentication: true,
    });
}

export async function triggerPost() {
    const response = await client.api.admin.schedule["trigger-post"].$post();
    return readJson(response, {
        requireAuthentication: true,
    });
}

export async function triggerLottery() {
    const response = await client.api.admin.schedule["trigger-lottery"].$post();
    return readJson(response, { requireAuthentication: true });
}

export async function saveResult(data: { messageId: string; result: LotteryResult }) {
    const response = await client.api.admin.results.$post({ json: data });
    const saved = await readJson(response);
    cacheResult(saved);
    notifyResultSaved(saved);
    return saved;
}
