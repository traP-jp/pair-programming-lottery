import { describe, expect, it } from "bun:test";

import { isBoolean, isNumber, isString } from "./types";

describe("types utility", () => {
    it("isString should correctly check strings", () => {
        expect(isString("hello")).toBe(true);
        expect(isString("")).toBe(true);
        expect(isString(123)).toBe(false);
        expect(isString(true)).toBe(false);
        expect(isString(null)).toBe(false);
    });

    it("isBoolean should correctly check booleans", () => {
        expect(isBoolean(true)).toBe(true);
        expect(isBoolean(false)).toBe(true);
        expect(isBoolean("true")).toBe(false);
        expect(isBoolean(0)).toBe(false);
        expect(isBoolean(null)).toBe(false);
    });

    it("isNumber should correctly check numbers", () => {
        expect(isNumber(123)).toBe(true);
        expect(isNumber(0)).toBe(true);
        expect(isNumber(-1.5)).toBe(true);
        expect(isNumber("123")).toBe(false);
        expect(isNumber(NaN)).toBe(true); // typeof NaN === 'number'
        expect(isNumber(null)).toBe(false);
    });
});
