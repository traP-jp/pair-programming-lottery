import { describe, expect, it, mock } from "bun:test";

import type { createLotteryPresenter } from "@server/core/presenters/lottery";
import type { createPostMessagePresenter } from "@server/core/presenters/postMessage";
import type { createResultsPresenter } from "@server/core/presenters/results";
import type { createSchedulePresenter } from "@server/core/presenters/schedule";
import type { Context } from "hono";
// Create minimal mock presenters
import { HTTPException } from "hono/http-exception";

import { createAdminRoutes } from "./admin";
import { createApp } from "./index";
import { createPublicRoutes } from "./public";

const mockResultsPresenter = {
    getResults: [
        async (c: Context) => {
            const errorType = c.req.query("error");
            if (errorType === "http") {
                throw new HTTPException(400, { message: "Bad Request Alert" });
            }
            if (errorType === "generic") {
                throw new Error("Something went wrong");
            }
            return c.json([{ id: "res-1", month: "2026-06", channelId: "chan-1" }]);
        },
    ],
    getResult: [
        async (c: Context) => {
            const id = c.req.param("id");
            if (id === "res-1") {
                return c.json({ id: "res-1", month: "2026-06", channelId: "chan-1", result: {} });
            }
            return c.json({ error: "Not Found" }, 404);
        },
    ],
    saveResult: [async (c: Context) => c.json({ id: "saved-1", success: true })],
} as unknown as ReturnType<typeof createResultsPresenter>;

const mockSchedulePresenter = {
    getSchedule: [async (c: Context) => c.json({ enabled: true })],
    putSchedule: [async (c: Context) => c.json({ success: true })],
    triggerPost: [async (c: Context) => c.json({ success: true })],
    triggerLottery: [async (c: Context) => c.json({ success: true })],
} as unknown as ReturnType<typeof createSchedulePresenter>;

const mockLotteryPresenter = {
    runLottery: [async (c: Context) => c.json({ pairs: [] })],
} as unknown as ReturnType<typeof createLotteryPresenter>;

const mockPostMessagePresenter = {
    postMessage: [async (c: Context) => c.json({ messageId: "msg-123" })],
} as unknown as ReturnType<typeof createPostMessagePresenter>;

const publicRoutes = createPublicRoutes(mockResultsPresenter);
const adminRoutes = createAdminRoutes(
    mockResultsPresenter,
    mockSchedulePresenter,
    mockLotteryPresenter,
    mockPostMessagePresenter
);

const app = createApp(publicRoutes, adminRoutes);

describe("API Routes Integration Tests", () => {
    it("should return ok on GET /api/health", async () => {
        const response = await app.request("/api/health");
        expect(response.status).toBe(200);
        const body = await response.json();
        expect(body).toEqual({ ok: true });
    });

    describe("Public Routes", () => {
        it("should allow GET /api/results without authentication", async () => {
            const response = await app.request("/api/results");
            expect(response.status).toBe(200);
            const body = await response.json();
            expect(body).toEqual([{ id: "res-1", month: "2026-06", channelId: "chan-1" }]);
        });

        it("should allow GET /api/results/:id and return 404 for non-existent result", async () => {
            const resOk = await app.request("/api/results/res-1");
            expect(resOk.status).toBe(200);

            const res404 = await app.request("/api/results/invalid-id");
            expect(res404.status).toBe(404);
        });
    });

    describe("Admin Routes", () => {
        it("should deny access to admin routes if X-Forwarded-User header is missing", async () => {
            const response = await app.request("/api/results", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ messageId: "msg-123", result: {} }),
            });
            expect(response.status).toBe(401);
            const body = await response.json();
            expect(body).toEqual({ error: "Unauthorized" });
        });

        it("should deny access to admin routes if user is not in ADMINS list", async () => {
            const response = await app.request("/api/results", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-Forwarded-User": "some_random_user",
                },
                body: JSON.stringify({ messageId: "msg-123", result: {} }),
            });
            expect(response.status).toBe(401);
        });

        it("should allow access to admin routes if user is in ADMINS list", async () => {
            const response = await app.request("/api/results", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-Forwarded-User": "uni_kakurenbo", // from ADMINS in config/env
                },
                body: JSON.stringify({ messageId: "msg-123", result: {} }),
            });
            expect(response.status).toBe(200);
            const body = await response.json();
            expect(body).toEqual({ id: "saved-1", success: true });
        });
    });

    describe("Error Handling", () => {
        it("should return correct status code for HTTPException in onError", async () => {
            const response = await app.request("/api/results?error=http");
            expect(response.status).toBe(400);
            expect(await response.text()).toBe("Bad Request Alert");
        });

        it("should return 500 for generic Error in onError", async () => {
            const spyError = mock(() => {});
            const originalError = console.error;
            console.error = spyError as any;

            try {
                const response = await app.request("/api/results?error=generic");
                expect(response.status).toBe(500);
                const body = await response.json();
                expect(body).toEqual({ message: "Internal Server Error" });
                expect(spyError).toHaveBeenCalled();
            } finally {
                console.error = originalError;
            }
        });
    });
});
