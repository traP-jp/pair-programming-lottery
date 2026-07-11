import { beforeEach, describe, expect, it, vi } from "vitest";

import {
    getResult,
    getResults,
    getSchedule,
    postMessage,
    runLottery,
    saveResult,
    triggerLottery,
    triggerPost,
    upsertSchedule,
} from "./index";

describe("API Wrapper client", () => {
    beforeEach(() => {
        vi.restoreAllMocks();
    });

    describe("postMessage", () => {
        it("should return messageId on success", async () => {
            const spyFetch = vi.spyOn(globalThis, "fetch").mockResolvedValue({
                ok: true,
                status: 200,
                json: async () => ({ messageId: "msg-123" }),
            } as Response);

            const res = await postMessage("chan-1");
            expect(res).toBe("msg-123");
            expect(spyFetch).toHaveBeenCalled();
        });

        it("should throw error with message on failure", async () => {
            vi.spyOn(globalThis, "fetch").mockResolvedValue({
                ok: false,
                status: 400,
                json: async () => ({ error: "Invalid Channel ID" }),
            } as Response);

            await expect(postMessage("chan-1")).rejects.toThrow("Invalid Channel ID");
        });

        it("should throw error with status code on failure without error in JSON", async () => {
            vi.spyOn(globalThis, "fetch").mockResolvedValue({
                ok: false,
                status: 400,
                json: async () => ({}),
            } as Response);

            await expect(postMessage("chan-1")).rejects.toThrow("HTTP 400");
        });
    });

    describe("runLottery", () => {
        it("should return LotteryResult on success", async () => {
            const mockResult = { pairs: [], participantCount: 0 };
            vi.spyOn(globalThis, "fetch").mockResolvedValue({
                ok: true,
                status: 200,
                json: async () => mockResult,
            } as Response);

            const res = await runLottery("msg-123");
            expect(res).toEqual(mockResult as any);
        });

        it("should throw error on failure", async () => {
            vi.spyOn(globalThis, "fetch").mockResolvedValue({
                ok: false,
                status: 400,
                json: async () => ({ error: "Not enough users" }),
            } as Response);

            await expect(runLottery("msg-123")).rejects.toThrow("Not enough users");
        });

        it("should throw error with status code on failure without error in JSON", async () => {
            vi.spyOn(globalThis, "fetch").mockResolvedValue({
                ok: false,
                status: 400,
                json: async () => ({}),
            } as Response);

            await expect(runLottery("msg-123")).rejects.toThrow("HTTP 400");
        });
    });

    describe("getResults", () => {
        it("should return list of results on success", async () => {
            const mockList = [{ id: "res-1", month: "2026-06", channelId: "chan-1" }];
            vi.spyOn(globalThis, "fetch").mockResolvedValue({
                ok: true,
                status: 200,
                json: async () => mockList,
            } as Response);

            const res = await getResults();
            expect(res).toEqual(mockList as any);
        });

        it("should throw error on failure", async () => {
            vi.spyOn(globalThis, "fetch").mockResolvedValue({
                ok: false,
                status: 500,
            } as Response);

            await expect(getResults()).rejects.toThrow("HTTP 500");
        });
    });

    describe("getResult", () => {
        it("should return detail record on success", async () => {
            const mockDetail = {
                id: "res-1",
                month: "2026-06",
                channelId: "chan-1",
                result: { pairs: [] },
            };
            vi.spyOn(globalThis, "fetch").mockResolvedValue({
                ok: true,
                status: 200,
                json: async () => mockDetail,
            } as Response);

            const res = await getResult("res-1");
            expect(res).toEqual(mockDetail as any);
        });

        it("should throw error on failure", async () => {
            vi.spyOn(globalThis, "fetch").mockResolvedValue({
                ok: false,
                status: 404,
                json: async () => ({ error: "Not Found" }),
            } as Response);

            await expect(getResult("res-2")).rejects.toThrow("Not Found");
        });

        it("should throw error with status code on failure without error in JSON", async () => {
            vi.spyOn(globalThis, "fetch").mockResolvedValue({
                ok: false,
                status: 404,
                json: async () => ({}),
            } as Response);

            await expect(getResult("res-2")).rejects.toThrow("HTTP 404");
        });
    });

    describe("getSchedule", () => {
        it("should return schedule record on success", async () => {
            const mockSchedule = { enabled: true };
            vi.spyOn(globalThis, "fetch").mockResolvedValue({
                ok: true,
                status: 200,
                json: async () => mockSchedule,
            } as Response);

            const res = await getSchedule();
            expect(res).toEqual(mockSchedule as any);
        });

        it("should throw unauthorized error on 401 status", async () => {
            vi.spyOn(globalThis, "fetch").mockResolvedValue({
                ok: false,
                status: 401,
            } as Response);

            await expect(getSchedule()).rejects.toThrow("unauthorized");
        });

        it("should throw error on other failures", async () => {
            vi.spyOn(globalThis, "fetch").mockResolvedValue({
                ok: false,
                status: 500,
            } as Response);

            await expect(getSchedule()).rejects.toThrow("HTTP 500");
        });
    });

    describe("upsertSchedule", () => {
        const payload = { channelId: "chan-1", postDay: 5, lotteryDay: 15, enabled: true };

        it("should return schedule on success", async () => {
            const mockSchedule = { id: 1, ...payload };
            vi.spyOn(globalThis, "fetch").mockResolvedValue({
                ok: true,
                status: 200,
                json: async () => mockSchedule,
            } as Response);

            const res = await upsertSchedule(payload);
            expect(res).toEqual(mockSchedule as any);
        });

        it("should throw unauthorized on 401 status", async () => {
            vi.spyOn(globalThis, "fetch").mockResolvedValue({
                ok: false,
                status: 401,
            } as Response);

            await expect(upsertSchedule(payload)).rejects.toThrow("unauthorized");
        });

        it("should throw error with message on bad request", async () => {
            vi.spyOn(globalThis, "fetch").mockResolvedValue({
                ok: false,
                status: 400,
                json: async () => ({ error: "Post day must be before lottery day" }),
            } as Response);

            await expect(upsertSchedule(payload)).rejects.toThrow(
                "Post day must be before lottery day"
            );
        });

        it("should throw error with status code on bad request without error in JSON", async () => {
            vi.spyOn(globalThis, "fetch").mockResolvedValue({
                ok: false,
                status: 400,
                json: async () => ({}),
            } as Response);

            await expect(upsertSchedule(payload)).rejects.toThrow("HTTP 400");
        });
    });

    describe("triggerPost", () => {
        it("should return messageId on success", async () => {
            vi.spyOn(globalThis, "fetch").mockResolvedValue({
                ok: true,
                status: 200,
                json: async () => ({ messageId: "msg-123" }),
            } as Response);

            const res = await triggerPost();
            expect(res).toEqual({ messageId: "msg-123" });
        });

        it("should throw unauthorized on 401 status", async () => {
            vi.spyOn(globalThis, "fetch").mockResolvedValue({
                ok: false,
                status: 401,
            } as Response);

            await expect(triggerPost()).rejects.toThrow("unauthorized");
        });

        it("should throw error with message on bad request", async () => {
            vi.spyOn(globalThis, "fetch").mockResolvedValue({
                ok: false,
                status: 400,
                json: async () => ({ error: "Schedule not found" }),
            } as Response);

            await expect(triggerPost()).rejects.toThrow("Schedule not found");
        });

        it("should throw error with status code on bad request without error in JSON", async () => {
            vi.spyOn(globalThis, "fetch").mockResolvedValue({
                ok: false,
                status: 400,
                json: async () => ({}),
            } as Response);

            await expect(triggerPost()).rejects.toThrow("HTTP 400");
        });
    });

    describe("triggerLottery", () => {
        it("should return responseId on success", async () => {
            vi.spyOn(globalThis, "fetch").mockResolvedValue({
                ok: true,
                status: 200,
                json: async () => ({ responseId: "res-123" }),
            } as Response);

            const res = await triggerLottery();
            expect(res).toEqual({ responseId: "res-123" });
        });

        it("should throw unauthorized on 401 status", async () => {
            vi.spyOn(globalThis, "fetch").mockResolvedValue({
                ok: false,
                status: 401,
            } as Response);

            await expect(triggerLottery()).rejects.toThrow("unauthorized");
        });

        it("should throw error with message on bad request", async () => {
            vi.spyOn(globalThis, "fetch").mockResolvedValue({
                ok: false,
                status: 400,
                json: async () => ({ error: "No message posted yet" }),
            } as Response);

            await expect(triggerLottery()).rejects.toThrow("No message posted yet");
        });

        it("should throw error with status code on bad request without error in JSON", async () => {
            vi.spyOn(globalThis, "fetch").mockResolvedValue({
                ok: false,
                status: 400,
                json: async () => ({}),
            } as Response);

            await expect(triggerLottery()).rejects.toThrow("HTTP 400");
        });
    });

    describe("saveResult", () => {
        it("should return SavedResult on success", async () => {
            const mockSaved = { id: "save-id" };
            vi.spyOn(globalThis, "fetch").mockResolvedValue({
                ok: true,
                status: 200,
                json: async () => mockSaved,
            } as Response);

            const res = await saveResult({
                messageId: "msg-123",
                result: { pairs: [], participantCount: 0 } as any,
            });
            expect(res).toEqual(mockSaved as any);
        });

        it("should throw error with message on failure", async () => {
            vi.spyOn(globalThis, "fetch").mockResolvedValue({
                ok: false,
                status: 400,
                json: async () => ({ error: "Message not found" }),
            } as Response);

            await expect(
                saveResult({ messageId: "msg-123", result: { pairs: [] } as any })
            ).rejects.toThrow("Message not found");
        });

        it("should throw error with status code on failure without error in JSON", async () => {
            vi.spyOn(globalThis, "fetch").mockResolvedValue({
                ok: false,
                status: 400,
                json: async () => ({}),
            } as Response);

            await expect(
                saveResult({ messageId: "msg-123", result: { pairs: [] } as any })
            ).rejects.toThrow("HTTP 400");
        });
    });
});
