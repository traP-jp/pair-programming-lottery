import { describe, expect, it } from "vitest";

import { getErrorMessage } from "./errors";

describe("getErrorMessage", () => {
    it("returns the message from Error instances", () => {
        expect(getErrorMessage(new Error("request failed"), "fallback")).toBe("request failed");
    });

    it("uses the fallback for non-Error values", () => {
        expect(getErrorMessage("request failed", "fallback")).toBe("fallback");
    });
});
