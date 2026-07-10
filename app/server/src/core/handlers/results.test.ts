import { afterEach, describe, expect, it, mock } from "bun:test";
import { setSystemTime } from "bun:test";

import { type IResultsTraqService, createResultsHandlers } from "./results";

import type { ILotteryResponseRepository } from "../repository/lotteryResponse";

describe("results handlers", () => {
    class MockLotteryResponseRepo implements ILotteryResponseRepository {
        records: any[] = [];
        findMany = mock(async (): Promise<any> => this.records);
        findRecentResultsWithDetail = mock(async (): Promise<any> => this.records);
        findById = mock(
            async (id: string): Promise<any> => this.records.find(r => r.id === id) || null
        );
        create = mock(async (data: any): Promise<any> => {
            const record = { id: `res-${Date.now()}`, createdAt: new Date(), ...data };
            this.records.push(record);
            return record;
        });
    }

    class MockResultsTraqService implements IResultsTraqService {
        getChannelId = mock(async (messageId: string) => `chan-${messageId}`);
    }

    afterEach(() => {
        setSystemTime();
    });

    it("getResultsHandler should retrieve records from repo", async () => {
        const repo = new MockLotteryResponseRepo();
        repo.records = [{ id: "res-1" }, { id: "res-2" }];
        const traq = new MockResultsTraqService();

        const handlers = createResultsHandlers(repo, traq);
        const results = await handlers.getResultsHandler();

        expect(results).toEqual(repo.records);
        expect(repo.findMany).toHaveBeenCalledWith({
            orderBy: { createdAt: "desc" },
            take: 20,
        });
    });

    it("getResultHandler should retrieve single record by ID", async () => {
        const repo = new MockLotteryResponseRepo();
        repo.records = [{ id: "res-1" }];
        const traq = new MockResultsTraqService();

        const handlers = createResultsHandlers(repo, traq);

        const resOk = await handlers.getResultHandler("res-1");
        expect(resOk).toEqual({ id: "res-1" } as any);

        const resNull = await handlers.getResultHandler("non-existent");
        expect(resNull).toBeNull();
    });

    it("saveResultHandler should get channel ID, create result record with current JST month", async () => {
        setSystemTime(new Date("2026-06-12T00:00:00Z"));
        const repo = new MockLotteryResponseRepo();
        const traq = new MockResultsTraqService();

        const handlers = createResultsHandlers(repo, traq);
        const result = { pairs: [] } as any;

        const saved = await handlers.saveResultHandler("msg-123", result as any);

        expect(saved.channelId).toBe("chan-msg-123");
        expect(saved.month).toBe("2026-06");
        expect(saved.result).toBe(result);
        expect(repo.create).toHaveBeenCalled();
        expect(traq.getChannelId).toHaveBeenCalledWith("msg-123");
    });
});
