import * as api from "@client/api";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { resolvePublicPage } from "./publicPages";

vi.mock("@client/api", () => ({
    getResult: vi.fn(),
    getResults: vi.fn(),
}));

describe("resolvePublicPage", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("canonicalizes the home page and loads its list data", async () => {
        const results = [
            {
                id: "result-1",
                month: "2026-07",
                channelId: "channel-1",
                createdAt: "2026-07-11T00:00:00.000Z",
            },
        ];
        vi.mocked(api.getResults).mockResolvedValue(results as never);

        const page = resolvePublicPage("/");

        expect(page?.pathname).toBe("/results");
        expect(page?.cachePolicy.maxAgeMs).toBe(60_000);
        await expect(page?.loadInitialData()).resolves.toEqual({ results });
        expect(page?.hasInitialData({ results })).toBe(true);
    });

    it("loads result-detail data using the id captured from the URL", async () => {
        const result = { id: "result-1" };
        vi.mocked(api.getResult).mockResolvedValue(result as never);

        const page = resolvePublicPage("/results/result-1");

        expect(page?.pathname).toBe("/results/result-1");
        expect(page?.cachePolicy.maxAgeMs).toBe(86_400_000);
        await expect(page?.loadInitialData()).resolves.toEqual({ result });
        expect(api.getResult).toHaveBeenCalledWith("result-1");
        expect(page?.hasInitialData({})).toBe(false);
    });

    it("excludes routes that must be rendered dynamically", () => {
        expect(resolvePublicPage("/manage")).toBeUndefined();
        expect(resolvePublicPage("/results/result-1/extra")).toBeUndefined();
    });
});
