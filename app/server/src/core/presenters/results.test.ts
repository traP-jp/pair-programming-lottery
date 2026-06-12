import { describe, expect, it, mock } from "bun:test";

import { Hono } from "hono";

import { type IResultsHandlers, createResultsPresenter } from "./results";

describe("results presenter", () => {
    it("should process getResults, getResult, and saveResult routes", async () => {
        const mockHandlers: IResultsHandlers = {
            getResultsHandler: mock(async () => [{ id: "res-1" } as any]),
            getResultHandler: mock(async id => (id === "res-1" ? ({ id: "res-1" } as any) : null)),
            saveResultHandler: mock(
                async (messageId, result) => ({ id: "saved-res-1", messageId }) as any
            ),
        };

        const presenter = createResultsPresenter(mockHandlers);
        const app = new Hono()
            .get("/results", ...presenter.getResults)
            .get("/results/:id", ...presenter.getResult)
            .post("/results", ...presenter.saveResult);

        // Test getResults
        const getResultsRes = await app.request("/results");
        expect(getResultsRes.status).toBe(200);
        expect(await getResultsRes.json()).toEqual([{ id: "res-1" }]);

        // Test getResult success
        const getResultRes = await app.request("/results/res-1");
        expect(getResultRes.status).toBe(200);
        expect(await getResultRes.json()).toEqual({ id: "res-1" });

        // Test getResult 404
        const getResult404Res = await app.request("/results/res-2");
        expect(getResult404Res.status).toBe(404);

        // Test saveResult
        const saveRes = await app.request("/results", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ messageId: "msg-123", result: { pairs: [] } }),
        });
        expect(saveRes.status).toBe(200);
        expect(await saveRes.json()).toEqual({ id: "saved-res-1", messageId: "msg-123" });
    });
});
