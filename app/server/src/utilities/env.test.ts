import { describe, expect, it } from "bun:test";

import { getEnv } from "./env";

describe("getEnv", () => {
    it("should return value from process.env if present", () => {
        process.env.TEST_ENV_VAR = "hello";
        const value = getEnv("TEST_ENV_VAR");
        expect(value).toBe("hello");
        delete process.env.TEST_ENV_VAR;
    });

    it("should return fallback if not present in process.env", () => {
        const value = getEnv("NON_EXISTENT_VAR", { fallback: "default" });
        expect(value).toBe("default");
    });

    it("should throw ProcessError if not present and fallback is empty", () => {
        expect(() => getEnv("NON_EXISTENT_VAR")).toThrow();
    });
});
