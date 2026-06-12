import { describe, expect, it } from "bun:test";

import { ValidationErrorMessages } from "@server/error/messages";
import { ApplicationError } from "@server/error/structure";

import { adaptor } from "./common/adaptor";
import {
    assert,
    requireBoolean,
    requireDate,
    requireNumber,
    requireString,
    required,
} from "./common/utility";
import { validateRunLotteryBody } from "./lottery";
import { validatePostMessageBody } from "./postMessage";
import { validateGetResultparams, validateSaveResultBody } from "./results";
import { validatePostScheduleBody } from "./schedule";

describe("validation and utilities", () => {
    describe("common/utility", () => {
        it("assert should throw if condition is false", () => {
            const error = new ApplicationError("fail");
            expect(() => assert(true, error)).not.toThrow();
            expect(() => assert(false, error)).toThrow(error);
        });

        it("required should throw PROPERTY_REQUIRED if property missing or empty string", () => {
            const validator = required<string>(
                v => typeof v === "string",
                ValidationErrorMessages.PROPERTY_MUST_BE_STRING
            );
            expect(() => validator({ prop: "" }, "prop")).toThrow(
                ValidationErrorMessages.PROPERTY_REQUIRED("prop")
            );
            expect(() => validator({}, "prop")).toThrow(
                ValidationErrorMessages.PROPERTY_REQUIRED("prop")
            );
            expect(() => validator({ prop: null }, "prop")).toThrow(
                ValidationErrorMessages.PROPERTY_REQUIRED("prop")
            );
        });

        it("requireString should validate strings", () => {
            expect(requireString({ name: "Alice" }, "name")).toBe("Alice");
            expect(() => requireString({ name: 123 }, "name")).toThrow();
        });

        it("requireNumber should validate numbers", () => {
            expect(requireNumber({ val: 42 }, "val")).toBe(42);
            expect(() => requireNumber({ val: "42" }, "val")).toThrow();
        });

        it("requireBoolean should validate booleans", () => {
            expect(requireBoolean({ ok: true }, "ok")).toBe(true);
            expect(() => requireBoolean({ ok: "true" }, "ok")).toThrow();
        });

        it("requireDate should validate dates", () => {
            const dateString = "2026-06-12T00:00:00.000Z";
            expect(requireDate({ date: dateString }, "date")).toBeInstanceOf(Date);
            expect(() => requireDate({ date: "not-a-date" }, "date")).toThrow();
            expect(() => requireDate({ date: 123 }, "date")).toThrow();
        });
    });

    describe("validators logic", () => {
        it("validateRunLotteryBody", () => {
            const valid = { messageId: "msg-1" };
            expect(validateRunLotteryBody(valid)).toEqual(valid);
            expect(() => validateRunLotteryBody({})).toThrow();
        });

        it("validatePostMessageBody", () => {
            const valid = { channelId: "chan-1" };
            expect(validatePostMessageBody(valid)).toEqual(valid);
            expect(() => validatePostMessageBody({})).toThrow();
        });

        it("validateGetResultparams", () => {
            const valid = { id: "res-1" };
            expect(validateGetResultparams(valid)).toEqual(valid);
            expect(() => validateGetResultparams({})).toThrow();
        });

        it("validateSaveResultBody", () => {
            const valid = { messageId: "msg-1", result: { pairs: [] } } as any;
            expect(validateSaveResultBody(valid)).toEqual(valid);
            expect(() =>
                validateSaveResultBody({ messageId: "msg-1", result: "not-an-object" })
            ).toThrow();
            expect(() => validateSaveResultBody({ messageId: "msg-1" })).toThrow();
        });

        it("validatePostScheduleBody", () => {
            const valid = { channelId: "chan-1", postDay: 5, lotteryDay: 10, enabled: true };
            expect(validatePostScheduleBody(valid)).toEqual(valid);

            // Out of range postDay
            expect(() => validatePostScheduleBody({ ...valid, postDay: 1 })).toThrow();
            expect(() => validatePostScheduleBody({ ...valid, postDay: 28 })).toThrow();

            // Out of range lotteryDay
            expect(() => validatePostScheduleBody({ ...valid, lotteryDay: 1 })).toThrow();
            expect(() => validatePostScheduleBody({ ...valid, lotteryDay: 28 })).toThrow();

            // postDay >= lotteryDay
            expect(() =>
                validatePostScheduleBody({ ...valid, postDay: 10, lotteryDay: 10 })
            ).toThrow();
            expect(() =>
                validatePostScheduleBody({ ...valid, postDay: 12, lotteryDay: 10 })
            ).toThrow();
        });

        it("adaptor should rethrow non-ApplicationError", () => {
            const validatorFn = adaptor("json")(() => {
                throw new Error("Generic validation fail");
            });
            expect(() => validatorFn({})).toThrow("Generic validation fail");
        });
    });
});
