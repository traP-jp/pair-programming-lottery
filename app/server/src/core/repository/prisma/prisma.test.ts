import { beforeEach, describe, expect, it, mock } from "bun:test";

import { PrismaLotteryResponseRepository } from "./lotteryResponse";
import { PrismaScheduleRepository } from "./schedule";

const mockFindMany = mock(async () => []);
const mockFindUniqueResponse = mock(async (): Promise<any> => null);
const mockCreateResponse = mock(async (data: any) => ({
    id: "new-res-id",
    createdAt: new Date(),
    ...data.data,
}));

const mockFindUniqueSchedule = mock(async (): Promise<any> => null);
const mockUpsertSchedule = mock(async () => ({}));
const mockUpdateSchedule = mock(async () => ({}));

mock.module("@server/external/database", () => {
    return {
        prisma: {
            lotteryResponse: {
                findMany: mockFindMany,
                findUnique: mockFindUniqueResponse,
                create: mockCreateResponse,
            },
            schedule: {
                findUnique: mockFindUniqueSchedule,
                upsert: mockUpsertSchedule,
                update: mockUpdateSchedule,
            },
        },
    };
});

describe("Prisma Repositories", () => {
    beforeEach(() => {
        mockFindMany.mockClear();
        mockFindUniqueResponse.mockClear();
        mockCreateResponse.mockClear();
        mockFindUniqueSchedule.mockClear();
        mockUpsertSchedule.mockClear();
        mockUpdateSchedule.mockClear();
    });

    describe("PrismaLotteryResponseRepository", () => {
        it("findMany should query prisma with options", async () => {
            const repo = new PrismaLotteryResponseRepository();
            await repo.findMany({ take: 5, orderBy: { createdAt: "desc" } });

            expect(mockFindMany).toHaveBeenCalledWith({
                orderBy: { createdAt: "desc" },
                take: 5,
                select: { id: true, createdAt: true, channelId: true, month: true },
            });
        });

        it("findMany should query prisma without options (using defaults)", async () => {
            const repo = new PrismaLotteryResponseRepository();
            await repo.findMany();

            expect(mockFindMany).toHaveBeenCalledWith({
                orderBy: undefined,
                take: undefined,
                select: { id: true, createdAt: true, channelId: true, month: true },
            });
        });

        it("findById should return null if not found", async () => {
            const repo = new PrismaLotteryResponseRepository();
            const res = await repo.findById("non-existent");
            expect(res).toBeNull();
            expect(mockFindUniqueResponse).toHaveBeenCalledWith({ where: { id: "non-existent" } });
        });

        it("findById should return formatted result if found", async () => {
            mockFindUniqueResponse.mockImplementationOnce(async () => ({
                id: "res-1",
                createdAt: new Date(),
                channelId: "chan-1",
                month: "2026-06",
                result: { pairs: [] },
            }));
            const repo = new PrismaLotteryResponseRepository();
            const res = await repo.findById("res-1");
            expect(res).not.toBeNull();
            expect(res!.result).toEqual({ pairs: [] } as any);
        });

        it("create should save response to database", async () => {
            const repo = new PrismaLotteryResponseRepository();
            const res = await repo.create({
                channelId: "chan-1",
                month: "2026-06",
                result: { pairs: [] },
            });

            expect(res.id).toBe("new-res-id");
            expect(mockCreateResponse).toHaveBeenCalled();
        });
    });

    describe("PrismaScheduleRepository", () => {
        it("get should find unique schedule", async () => {
            const repo = new PrismaScheduleRepository();
            await repo.get();
            expect(mockFindUniqueSchedule).toHaveBeenCalledWith({ where: { id: 1 } });
        });

        it("upsert should upsert schedule", async () => {
            const repo = new PrismaScheduleRepository();
            const data = { channelId: "chan-1", postDay: 5, lotteryDay: 15, enabled: true };
            await repo.upsert(data);
            expect(mockUpsertSchedule).toHaveBeenCalledWith({
                where: { id: 1 },
                create: { id: 1, ...data },
                update: data,
            });
        });

        it("update should update schedule", async () => {
            const repo = new PrismaScheduleRepository();
            const data = { lastMessageId: "msg-1" };
            await repo.update(data);
            expect(mockUpdateSchedule).toHaveBeenCalledWith({
                where: { id: 1 },
                data,
            });
        });
    });
});
