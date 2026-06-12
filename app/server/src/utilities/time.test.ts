import { describe, expect, it } from "bun:test";

import { getCurrentYearMonthJst, getJstDate, getJstDay, isThisMonthJst } from "./time";

describe("time utilities", () => {
    describe("getJstDate", () => {
        it("should return a date shifted by 9 hours", () => {
            const utcDate = new Date("2026-06-12T00:00:00Z");
            const jstDate = getJstDate(utcDate);
            // 2026-06-12T00:00:00Z + 9 hours = 2026-06-12T09:00:00Z (timestamp is shifted)
            expect(jstDate.getTime()).toBe(utcDate.getTime() + 9 * 60 * 60 * 1000);
        });
    });

    describe("getCurrentYearMonthJst", () => {
        it("should return formatted year-month in JST", () => {
            const date = new Date("2026-06-12T15:00:00Z"); // 2026-06-13 00:00:00 JST
            expect(getCurrentYearMonthJst(date)).toBe("2026-06");

            const date2 = new Date("2026-06-12T14:59:00Z"); // 2026-06-12 23:59:00 JST
            expect(getCurrentYearMonthJst(date2)).toBe("2026-06");
        });
    });

    describe("getJstDay", () => {
        it("should return day in JST", () => {
            const date = new Date("2026-06-12T15:00:00Z"); // 2026-06-13 JST
            expect(getJstDay(date)).toBe(13);

            const date2 = new Date("2026-06-12T14:59:00Z"); // 2026-06-12 JST
            expect(getJstDay(date2)).toBe(12);
        });
    });

    describe("isThisMonthJst", () => {
        it("should return false if date is null", () => {
            expect(isThisMonthJst(null, "2026-06")).toBe(false);
        });

        it("should return true if JST year-month matches", () => {
            const date = new Date("2026-06-12T00:00:00Z");
            expect(isThisMonthJst(date, "2026-06")).toBe(true);
            expect(isThisMonthJst(date, "2026-07")).toBe(false);
        });
    });
});
