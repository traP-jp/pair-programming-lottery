import { describe, expect, it, mock } from "bun:test";

import { Hono } from "hono";

import { type IScheduleHandlers, createSchedulePresenter } from "./schedule";

describe("schedule presenter", () => {
    it("should process getSchedule, putSchedule, triggerPost, and triggerLottery routes", async () => {
        const mockHandlers: IScheduleHandlers = {
            getScheduleHandler: mock(async () => ({ id: 1, channelId: "chan-1" }) as any),
            postScheduleHandler: mock(async data => ({ id: 1, ...data }) as any),
            triggerPostHandler: mock(async () => "msg-123"),
            triggerLotteryHandler: mock(async () => "res-123"),
        };

        const presenter = createSchedulePresenter(mockHandlers);
        const app = new Hono()
            .get("/schedule", ...presenter.getSchedule)
            .put("/schedule", ...presenter.putSchedule)
            .post("/schedule/trigger-post", ...presenter.triggerPost)
            .post("/schedule/trigger-lottery", ...presenter.triggerLottery);

        // Test getSchedule
        const getScheduleRes = await app.request("/schedule");
        expect(getScheduleRes.status).toBe(200);
        expect(await getScheduleRes.json()).toEqual({ id: 1, channelId: "chan-1" });

        // Test putSchedule
        const putScheduleRes = await app.request("/schedule", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                channelId: "chan-1",
                postDay: 5,
                lotteryDay: 15,
                enabled: true,
            }),
        });
        expect(putScheduleRes.status).toBe(200);
        expect(await putScheduleRes.json()).toEqual({
            id: 1,
            channelId: "chan-1",
            postDay: 5,
            lotteryDay: 15,
            enabled: true,
        });

        // Test triggerPost
        const triggerPostRes = await app.request("/schedule/trigger-post", { method: "POST" });
        expect(triggerPostRes.status).toBe(200);
        expect(await triggerPostRes.json()).toEqual({ messageId: "msg-123" });

        // Test triggerLottery
        const triggerLotteryRes = await app.request("/schedule/trigger-lottery", {
            method: "POST",
        });
        expect(triggerLotteryRes.status).toBe(200);
        expect(await triggerLotteryRes.json()).toEqual({ responseId: "res-123" });
    });
});
