import { describe, expect, it, mock } from "bun:test";

import type { Schedule } from "@server/generated/prisma/client";

import {
    type IScheduleSchedulerService,
    type IScheduleTraqService,
    createScheduleHandlers,
} from "./schedule";

import type { IScheduleRepository } from "../repository/schedule";

describe("schedule handlers", () => {
    const defaultSchedule: Schedule = {
        id: 1,
        channelId: "chan-1",
        postDay: 5,
        lotteryDay: 15,
        enabled: true,
        lastMessageId: null,
        lastPostedAt: null,
        lastLotteryAt: null,
        updatedAt: new Date(),
    };

    class MockScheduleRepo implements IScheduleRepository {
        schedule: Schedule | null = { ...defaultSchedule };
        get = mock(async () => this.schedule);
        upsert = mock(async (data: any) => {
            this.schedule = { ...this.schedule, ...data } as Schedule;
            return this.schedule;
        });
        update = mock(async (data: any) => {
            this.schedule = { ...this.schedule, ...data } as Schedule;
            return this.schedule;
        });
    }

    class MockScheduleTraqService implements IScheduleTraqService {
        postLotteryMessage = mock(async () => "new-msg-123");
    }

    class MockScheduleSchedulerService implements IScheduleSchedulerService {
        savedRecord: { id: string } | null = { id: "saved-id-456" };
        runScheduledLottery = mock(async () => this.savedRecord);
    }

    it("getScheduleHandler should return schedule", async () => {
        const repo = new MockScheduleRepo();
        const traq = new MockScheduleTraqService();
        const scheduler = new MockScheduleSchedulerService();

        const handlers = createScheduleHandlers(repo, traq, scheduler);
        const schedule = await handlers.getScheduleHandler();

        expect(schedule).toEqual(defaultSchedule);
        expect(repo.get).toHaveBeenCalled();
    });

    it("postScheduleHandler should upsert schedule", async () => {
        const repo = new MockScheduleRepo();
        const traq = new MockScheduleTraqService();
        const scheduler = new MockScheduleSchedulerService();

        const handlers = createScheduleHandlers(repo, traq, scheduler);
        const data = { channelId: "chan-2", postDay: 6, lotteryDay: 16, enabled: false };
        const result = await handlers.postScheduleHandler(data);

        expect(result.channelId).toBe("chan-2");
        expect(repo.upsert).toHaveBeenCalledWith(data);
    });

    describe("triggerPostHandler", () => {
        it("should throw error if schedule not found", async () => {
            const repo = new MockScheduleRepo();
            repo.schedule = null;
            const traq = new MockScheduleTraqService();
            const scheduler = new MockScheduleSchedulerService();

            const handlers = createScheduleHandlers(repo, traq, scheduler);
            expect(handlers.triggerPostHandler()).rejects.toThrow();
        });

        it("should post lottery message and update schedule", async () => {
            const repo = new MockScheduleRepo();
            const traq = new MockScheduleTraqService();
            const scheduler = new MockScheduleSchedulerService();

            const handlers = createScheduleHandlers(repo, traq, scheduler);
            const msgId = await handlers.triggerPostHandler();

            expect(msgId).toBe("new-msg-123");
            expect(traq.postLotteryMessage).toHaveBeenCalledWith("chan-1");
            expect(repo.update).toHaveBeenCalledWith({
                lastMessageId: "new-msg-123",
                lastPostedAt: expect.any(Date),
            });
        });
    });

    describe("triggerLotteryHandler", () => {
        it("should throw error if schedule not found", async () => {
            const repo = new MockScheduleRepo();
            repo.schedule = null;
            const traq = new MockScheduleTraqService();
            const scheduler = new MockScheduleSchedulerService();

            const handlers = createScheduleHandlers(repo, traq, scheduler);
            expect(handlers.triggerLotteryHandler()).rejects.toThrow();
        });

        it("should throw error if lastMessageId is missing", async () => {
            const repo = new MockScheduleRepo();
            repo.schedule!.lastMessageId = null;
            const traq = new MockScheduleTraqService();
            const scheduler = new MockScheduleSchedulerService();

            const handlers = createScheduleHandlers(repo, traq, scheduler);
            expect(handlers.triggerLotteryHandler()).rejects.toThrow();
        });

        it("should run lottery and return saved ID on success", async () => {
            const repo = new MockScheduleRepo();
            repo.schedule!.lastMessageId = "msg-123";
            const traq = new MockScheduleTraqService();
            const scheduler = new MockScheduleSchedulerService();

            const handlers = createScheduleHandlers(repo, traq, scheduler);
            const resultId = await handlers.triggerLotteryHandler();

            expect(resultId).toBe("saved-id-456");
            expect(scheduler.runScheduledLottery).toHaveBeenCalledWith(
                "chan-1",
                "msg-123",
                expect.any(String)
            );
        });

        it("should throw error if runScheduledLottery returns null (not enough participants)", async () => {
            const repo = new MockScheduleRepo();
            repo.schedule!.lastMessageId = "msg-123";
            const traq = new MockScheduleTraqService();
            const scheduler = new MockScheduleSchedulerService();
            scheduler.savedRecord = null;

            const handlers = createScheduleHandlers(repo, traq, scheduler);
            expect(handlers.triggerLotteryHandler()).rejects.toThrow();
        });
    });
});
