import { describe, expect, it } from "bun:test";

import {
    buildApiErrorMessage,
    buildApplicationErrorMessage,
    buildProcessErrorMessage,
    buildValidationErrorMessage,
    invoke,
} from "./builders";
import { ApiErrorMessages, ProcessErrorMessages, ValidationErrorMessages } from "./messages";
import { ApplicationError } from "./structure";

describe("error builders and structure", () => {
    it("should build application error correctly", () => {
        const error = buildApplicationErrorMessage("test error");
        expect(error).toBeInstanceOf(ApplicationError);
        expect(error.message).toBe("Application Error: test error");
    });

    it("should build API error correctly", () => {
        const error = buildApiErrorMessage("test api error");
        expect(error.message).toBe("Application Error: API Error: test api error");
    });

    it("should build validation error correctly", () => {
        const error = buildValidationErrorMessage("test val error");
        expect(error.message).toBe(
            "Application Error: API Error: Validation Error: test val error"
        );
    });

    it("should build process error correctly", () => {
        const error = buildProcessErrorMessage("test proc error");
        expect(error.message).toBe("Application Error: Process Error: test proc error");
    });

    it("asHttpException should return HTTPException with correct status and message", () => {
        const error = new ApplicationError("some error");
        const httpEx = error.asHttpException(400);
        expect(httpEx.status).toBe(400);
        expect(httpEx.cause).toBe("some error");
    });

    it("invoke should return same error if passed an ApplicationError", () => {
        const error = new ApplicationError("test");
        const res = invoke(error as any);
        expect(res).toBe(error);
    });

    it("invoke should invoke generator if passed an ApplicationErrorGenerator", () => {
        const generator = (name: string) => new ApplicationError(name);
        const res = invoke(generator, "invoked-name");
        expect(res.message).toBe("invoked-name");
    });

    describe("messages", () => {
        it("should have correct message values for ApiErrorMessages", () => {
            expect(ApiErrorMessages.LOTTERY_RESULT_NOT_FOUND("123").message).toContain(
                'lottery result for "123" not found.'
            );
            expect(ApiErrorMessages.TARGET_USERS_MUST_BE_MULTIPLE("msg", 1).message).toContain(
                'targeted users for "msg" must be multiple: given 1.'
            );
            expect(ApiErrorMessages.POST_DAY_OUT_OF_RANGE(30).message).toContain(
                "post day must be 1-28: 30"
            );
            expect(ApiErrorMessages.RUNNING_DAY_OUT_OF_RANGE(30).message).toContain(
                "lottery day must be 1-28: 30"
            );
            expect(ApiErrorMessages.POST_DAY_MUST_BE_BEFORE_RUNNING(10, 5).message).toContain(
                "postDay (10) must be less than lotteryDay (5)"
            );
            expect(ApiErrorMessages.SCHEDULE_NOT_FOUND.message).toContain("schedule not found.");
        });

        it("should have correct message values for ProcessErrorMessages", () => {
            expect(ProcessErrorMessages.ENV_VAR_REQUIRED("MY_VAR").message).toContain(
                'environment variable "MY_VAR" is required.'
            );
        });

        it("should have correct message values for ValidationErrorMessages", () => {
            expect(ValidationErrorMessages.PROPERTY_REQUIRED("prop").message).toContain(
                'property "prop" is required.'
            );
            expect(ValidationErrorMessages.PROPERTY_MUST_BE_STRING("prop").message).toContain(
                'property "prop" must be a string.'
            );
            expect(ValidationErrorMessages.PROPERTY_MUST_BE_NUMBER("prop").message).toContain(
                'property "prop" must be a number.'
            );
            expect(ValidationErrorMessages.PROPERTY_MUST_BE_BOOLEAN("prop").message).toContain(
                'property "prop" must be a boolean.'
            );
            expect(ValidationErrorMessages.PROPERTY_MUST_BE_ARRAY("prop").message).toContain(
                'property "prop" must be an array.'
            );
            expect(ValidationErrorMessages.PROPERTY_MUST_BE_OBJECT("prop").message).toContain(
                'property "prop" must be an object.'
            );
            expect(ValidationErrorMessages.PROPERTY_MUST_BE_DATE("prop").message).toContain(
                'property "prop" must be an date string.'
            );
        });
    });
});
