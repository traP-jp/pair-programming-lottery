import { afterEach, describe, expect, it, mock } from "bun:test";
import { setSystemTime } from "bun:test";

import type { Schedule } from "@server/generated/prisma/client";
import type { UserPrefs } from "@server/types";

import { _tick, createSchedulerService } from "./scheduler";

import type { ILotteryResponseRepository, IScheduleRepository } from "../repository";

describe("scheduler service", () => {
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

    class MockLotteryResponseRepo implements ILotteryResponseRepository {
        responses: any[] = [];
        findMany = mock(async () => this.responses);
        findById = mock(async (id: string) => this.responses.find(r => r.id === id) || null);
        create = mock(async (data: any) => {
            const res = { id: `res-${Date.now()}`, createdAt: new Date(), ...data };
            this.responses.push(res);
            return res;
        });
    }

    class MockSchedulerTraqService {
        users: UserPrefs[] = [];
        userNameMap = new Map<string, string>();
        collectUserPrefs = mock(async () => this.users);
        getuserNameMap = mock(async () => this.userNameMap);
        postLotteryMessage = mock(async () => "new-msg-123");
        postMessage = mock(async () => {});
    }

    afterEach(() => {
        setSystemTime(); // Reset to real system time
    });

    it("should run scheduled lottery successfully when there are enough participants", async () => {
        const scheduleRepo = new MockScheduleRepo();
        const lotteryResponseRepo = new MockLotteryResponseRepo();
        const traq = new MockSchedulerTraqService();
        traq.users = [
            {
                id: "u1",
                regions: new Set(["frontend"]),
                roles: new Set(["navigator"]),
                originalRegionSize: 1,
                originalRoleSize: 1,
            },
            {
                id: "u2",
                regions: new Set(["backend"]),
                roles: new Set(["driver"]),
                originalRegionSize: 1,
                originalRoleSize: 1,
            },
        ];
        traq.userNameMap.set("u1", "user-one");
        traq.userNameMap.set("u2", "user-two");

        const scheduler = createSchedulerService(scheduleRepo, lotteryResponseRepo, traq as any);
        const result = await scheduler.runScheduledLottery("chan-1", "msg-123", "2026-06");

        expect(result).not.toBeNull();
        expect(lotteryResponseRepo.create).toHaveBeenCalled();
        expect(scheduleRepo.update).toHaveBeenCalledWith({
            lastLotteryAt: expect.any(Date),
        });
        expect(traq.postMessage).toHaveBeenCalled();
    });

    it("should warn and return null if not enough participants", async () => {
        const scheduleRepo = new MockScheduleRepo();
        const lotteryResponseRepo = new MockLotteryResponseRepo();
        const traq = new MockSchedulerTraqService();
        traq.users = [
            {
                id: "u1",
                regions: new Set(["frontend"]),
                roles: new Set(["navigator"]),
                originalRegionSize: 1,
                originalRoleSize: 1,
            },
        ];

        const scheduler = createSchedulerService(scheduleRepo, lotteryResponseRepo, traq as any);
        const result = await scheduler.runScheduledLottery("chan-1", "msg-123", "2026-06");

        expect(result).toBeNull();
        expect(lotteryResponseRepo.create).not.toHaveBeenCalled();
    });

    describe("_tick", () => {
        it("should return early if schedule is disabled", async () => {
            const scheduleRepo = new MockScheduleRepo();
            scheduleRepo.schedule!.enabled = false;
            const lotteryResponseRepo = new MockLotteryResponseRepo();
            const traq = new MockSchedulerTraqService();

            await _tick(scheduleRepo, lotteryResponseRepo, traq as any);

            expect(scheduleRepo.update).not.toHaveBeenCalled();
            expect(traq.postLotteryMessage).not.toHaveBeenCalled();
        });

        it("should trigger post lottery message when day matches postDay and not yet posted this month", async () => {
            const scheduleRepo = new MockScheduleRepo();
            const lotteryResponseRepo = new MockLotteryResponseRepo();
            const traq = new MockSchedulerTraqService();

            // Set system time to JST 2026-06-05 (which matches postDay = 5)
            setSystemTime(new Date("2026-06-05T09:00:00+09:00"));

            await _tick(scheduleRepo, lotteryResponseRepo, traq as any);

            expect(traq.postLotteryMessage).toHaveBeenCalledWith("chan-1");
            expect(scheduleRepo.update).toHaveBeenCalledWith({
                lastMessageId: "new-msg-123",
                lastPostedAt: expect.any(Date),
            });
        });

        it("should not trigger post lottery message if already posted this month", async () => {
            const scheduleRepo = new MockScheduleRepo();
            scheduleRepo.schedule!.lastPostedAt = new Date("2026-06-01T09:00:00+09:00");
            const lotteryResponseRepo = new MockLotteryResponseRepo();
            const traq = new MockSchedulerTraqService();

            setSystemTime(new Date("2026-06-05T09:00:00+09:00"));

            await _tick(scheduleRepo, lotteryResponseRepo, traq as any);

            expect(traq.postLotteryMessage).not.toHaveBeenCalled();
            expect(scheduleRepo.update).not.toHaveBeenCalled();
        });

        it("should trigger lottery when day matches lotteryDay, message exists, posted this month, and not yet run lottery this month", async () => {
            const scheduleRepo = new MockScheduleRepo();
            scheduleRepo.schedule!.lastMessageId = "msg-123";
            scheduleRepo.schedule!.lastPostedAt = new Date("2026-06-05T09:00:00+09:00");
            scheduleRepo.schedule!.lastLotteryAt = null;

            const lotteryResponseRepo = new MockLotteryResponseRepo();
            const traq = new MockSchedulerTraqService();
            traq.users = [
                {
                    id: "u1",
                    regions: new Set(["frontend"]),
                    roles: new Set(["navigator"]),
                    originalRegionSize: 1,
                    originalRoleSize: 1,
                },
                {
                    id: "u2",
                    regions: new Set(["backend"]),
                    roles: new Set(["driver"]),
                    originalRegionSize: 1,
                    originalRoleSize: 1,
                },
            ];

            setSystemTime(new Date("2026-06-15T09:00:00+09:00")); // matches lotteryDay = 15

            await _tick(scheduleRepo, lotteryResponseRepo, traq as any);

            expect(traq.collectUserPrefs).toHaveBeenCalledWith("msg-123");
            expect(lotteryResponseRepo.create).toHaveBeenCalled();
            expect(scheduleRepo.update).toHaveBeenCalledWith({
                lastLotteryAt: expect.any(Date),
            });
        });

        it("should not run lottery if already run this month", async () => {
            const scheduleRepo = new MockScheduleRepo();
            scheduleRepo.schedule!.lastMessageId = "msg-123";
            scheduleRepo.schedule!.lastPostedAt = new Date("2026-06-05T09:00:00+09:00");
            scheduleRepo.schedule!.lastLotteryAt = new Date("2026-06-15T00:00:00+09:00");

            const lotteryResponseRepo = new MockLotteryResponseRepo();
            const traq = new MockSchedulerTraqService();

            setSystemTime(new Date("2026-06-15T09:00:00+09:00"));

            await _tick(scheduleRepo, lotteryResponseRepo, traq as any);

            expect(traq.collectUserPrefs).not.toHaveBeenCalled();
        });

        it("should log error if postLotteryMessage fails", async () => {
            const scheduleRepo = new MockScheduleRepo();
            const lotteryResponseRepo = new MockLotteryResponseRepo();
            const traq = new MockSchedulerTraqService();
            traq.postLotteryMessage = mock(async () => {
                throw new Error("API post fail");
            });

            setSystemTime(new Date("2026-06-05T09:00:00+09:00"));

            const originalConsoleError = console.error;
            const consoleErrorMock = mock(() => {});
            console.error = consoleErrorMock;

            try {
                await _tick(scheduleRepo, lotteryResponseRepo, traq as any);
                expect(consoleErrorMock).toHaveBeenCalled();
            } finally {
                console.error = originalConsoleError;
            }
        });

        it("should log error if runLottery fails during tick", async () => {
            const scheduleRepo = new MockScheduleRepo();
            scheduleRepo.schedule!.lastMessageId = "msg-123";
            scheduleRepo.schedule!.lastPostedAt = new Date("2026-06-05T09:00:00+09:00");
            scheduleRepo.schedule!.lastLotteryAt = null;

            const lotteryResponseRepo = new MockLotteryResponseRepo();
            const traq = new MockSchedulerTraqService();
            traq.collectUserPrefs = mock(async () => {
                throw new Error("Collect fail");
            });

            setSystemTime(new Date("2026-06-15T09:00:00+09:00"));

            const originalConsoleError = console.error;
            const consoleErrorMock = mock(() => {});
            console.error = consoleErrorMock;

            try {
                await _tick(scheduleRepo, lotteryResponseRepo, traq as any);
                expect(consoleErrorMock).toHaveBeenCalled();
            } finally {
                console.error = originalConsoleError;
            }
        });
    });

    describe("startScheduler initialization", () => {
        it("should start the ticker structure without throwing errors", async () => {
            const scheduleRepo = new MockScheduleRepo();
            const lotteryResponseRepo = new MockLotteryResponseRepo();
            const traq = new MockSchedulerTraqService();
            const scheduler = createSchedulerService(
                scheduleRepo,
                lotteryResponseRepo,
                traq as any
            );

            // We mock global setTimeout so it doesn't run infinitely in background
            const originalSetTimeout = globalThis.setTimeout;
            const mockSetTimeout = mock(() => {
                return {} as any;
            });
            globalThis.setTimeout = mockSetTimeout as any;

            try {
                scheduler.startScheduler();
                // Wait for the async tick/finally block to run
                await new Promise(resolve => originalSetTimeout(resolve, 0));
                expect(mockSetTimeout).toHaveBeenCalled();
            } finally {
                globalThis.setTimeout = originalSetTimeout;
            }
        });

        it("should log error if _tick throws during ticker", async () => {
            const scheduleRepo = new MockScheduleRepo();
            scheduleRepo.get = mock(async () => {
                throw new Error("Tick database error");
            });
            const lotteryResponseRepo = new MockLotteryResponseRepo();
            const traq = new MockSchedulerTraqService();
            const scheduler = createSchedulerService(
                scheduleRepo,
                lotteryResponseRepo,
                traq as any
            );

            const originalSetTimeout = globalThis.setTimeout;
            const mockSetTimeout = mock(() => {
                return {} as any;
            });
            globalThis.setTimeout = mockSetTimeout as any;

            const originalConsoleError = console.error;
            const consoleErrorMock = mock(() => {});
            console.error = consoleErrorMock;

            try {
                scheduler.startScheduler();
                await new Promise(resolve => originalSetTimeout(resolve, 0));
                expect(consoleErrorMock).toHaveBeenCalled();
                expect(mockSetTimeout).toHaveBeenCalled();
            } finally {
                globalThis.setTimeout = originalSetTimeout;
                console.error = originalConsoleError;
            }
        });
    });
});
