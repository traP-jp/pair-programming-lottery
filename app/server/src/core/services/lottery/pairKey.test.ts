import { describe, expect, it } from "bun:test";

import { getPairKey } from "./pairKey";

describe("getPairKey", () => {
    it("uses the same key regardless of member order", () => {
        expect(getPairKey("user-b", "user-a")).toBe(getPairKey("user-a", "user-b"));
    });
});
