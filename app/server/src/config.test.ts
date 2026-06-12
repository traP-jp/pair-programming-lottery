import { describe, expect, it } from "bun:test";

import { ADMINS, TRAQ_ACCESS_TOKEN } from "./config";

describe("config", () => {
    it("should export config variables", () => {
        expect(TRAQ_ACCESS_TOKEN).toBeDefined();
        expect(ADMINS).toBeDefined();
    });
});
