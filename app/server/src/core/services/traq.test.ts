import { describe, expect, it, mock } from "bun:test";

import { createTraqService } from "./traq";

import type { ITraqClient, MessageInfo, StampInfo, UserInfo } from "../../external/traq";

// Mock data
const mockStamps: StampInfo[] = [
    { id: "s1", name: "one" },
    { id: "s2", name: "two" },
    { id: "s3", name: "regional_indicator_a" },
    { id: "s4", name: "regional_indicator_b" },
    { id: "s5", name: "random_stamp" },
];

const mockUsers: UserInfo[] = [
    { id: "u1", name: "user1", bot: false },
    { id: "u2", name: "user2", bot: false },
    { id: "u3", name: "bot1", bot: true },
];

const mockMessage: MessageInfo = {
    channelId: "channel-123",
    stamps: [
        { stampId: "s1", userId: "u1" }, // user1 likes frontend
        { stampId: "s3", userId: "u1" }, // user1 likes navigator
        { stampId: "s2", userId: "u2" }, // user2 likes backend
        { stampId: "s4", userId: "u2" }, // user2 likes driver
        { stampId: "s1", userId: "u3" }, // bot likes frontend (should be ignored)
    ],
};

class MockTraqClient implements ITraqClient {
    getStamps = mock(async () => mockStamps);
    getUsers = mock(async () => mockUsers);
    getMessage = mock(async (id: string) => (id === "msg-123" ? mockMessage : null));
    addMessageStamp = mock(async () => {});
    postChannelMessage = mock(async () => ({ id: "msg-created" }));
}

describe("traqService", () => {
    it("should build stamp map correctly", async () => {
        const client = new MockTraqClient();
        const service = createTraqService(client);

        const { stampIdToName, stampNameToId } = await service.getStampMap();

        expect(client.getStamps).toHaveBeenCalled();
        expect(stampIdToName.get("s1")).toBe("one");
        expect(stampIdToName.get("s2")).toBe("two");
        expect(stampIdToName.get("s3")).toBe("regional_indicator_a");
        expect(stampIdToName.get("s4")).toBe("regional_indicator_b");
        expect(stampIdToName.get("s5")).toBeUndefined(); // ignored non-target stamp

        expect(stampNameToId.get("one")).toBe("s1");
    });

    it("should warn if some target stamps are missing", async () => {
        const client = new MockTraqClient();
        client.getStamps = mock(async () => [{ id: "s1", name: "one" }]); // Only one stamp
        const service = createTraqService(client);

        const spyWarn = mock(() => {});
        const originalWarn = console.warn;
        console.warn = spyWarn as any;

        try {
            await service.getStampMap();
            expect(spyWarn).toHaveBeenCalled();
        } finally {
            console.warn = originalWarn;
        }
    });

    it("should filter bot users correctly", async () => {
        const client = new MockTraqClient();
        const service = createTraqService(client);

        const botIds = await service.getBotUserIds();

        expect(botIds.has("u3")).toBe(true); // bot1
        expect(botIds.has("u1")).toBe(false); // user1
    });

    it("should collect user preferences from message stamps correctly", async () => {
        const client = new MockTraqClient();
        const service = createTraqService(client);

        const prefs = await service.collectUserPrefs("msg-123");

        expect(client.getMessage).toHaveBeenCalledWith("msg-123");
        expect(prefs.length).toBe(2); // user1 and user2 (bot u3 ignored)

        const p1 = prefs.find(p => p.id === "u1")!;
        expect([...p1.regions]).toEqual(["frontend"]);
        expect([...p1.roles]).toEqual(["navigator"]);

        const p2 = prefs.find(p => p.id === "u2")!;
        expect([...p2.regions]).toEqual(["backend"]);
        expect([...p2.roles]).toEqual(["driver"]);
    });

    it("should throw error if message is not found or has no stamps in collectUserPrefs", async () => {
        const client = new MockTraqClient();
        client.getMessage = mock(async () => null);
        const service = createTraqService(client);

        expect(service.collectUserPrefs("invalid-msg")).rejects.toThrow();
    });

    it("should fallback to both options if user selects multiple or zero regions/roles", async () => {
        const client = new MockTraqClient();
        // user1 selects both frontend and backend, and selects zero roles.
        const message: MessageInfo = {
            channelId: "channel-123",
            stamps: [
                { stampId: "s1", userId: "u1" }, // frontend
                { stampId: "s2", userId: "u1" }, // backend
            ],
        };
        client.getMessage = mock(async () => message);

        const service = createTraqService(client);
        const prefs = await service.collectUserPrefs("msg-123");

        expect(prefs.length).toBe(1);
        const p1 = prefs[0]!;
        // Multi-select region falls back to both
        expect([...p1.regions]).toEqual(["frontend", "backend"]);
        // Zero-select role falls back to both
        expect([...p1.roles]).toEqual(["navigator", "driver"]);
    });

    it("should post lottery message and add initial stamps", async () => {
        const client = new MockTraqClient();
        const service = createTraqService(client);

        const messageId = await service.postLotteryMessage("channel-abc");

        expect(messageId).toBe("msg-created");
        expect(client.postChannelMessage).toHaveBeenCalledWith("channel-abc", expect.any(String));
        // Should have added the 4 target stamps
        expect(client.addMessageStamp).toHaveBeenCalledTimes(4);
    });

    it("getuserNameMap should map only non-bot users", async () => {
        const client = new MockTraqClient();
        const service = createTraqService(client);

        const map = await service.getuserNameMap();
        expect(map.size).toBe(2);
        expect(map.get("u1")).toBe("user1");
        expect(map.get("u2")).toBe("user2");
        expect(map.get("u3")).toBeUndefined();
    });

    it("getChannelId should return channel ID of message, and throw if message not found", async () => {
        const client = new MockTraqClient();
        const service = createTraqService(client);

        const channelId = await service.getChannelId("msg-123");
        expect(channelId).toBe("channel-123");

        expect(service.getChannelId("invalid-msg")).rejects.toThrow();
    });

    it("postMessage should call postChannelMessage", async () => {
        const client = new MockTraqClient();
        const service = createTraqService(client);

        await service.postMessage("chan-1", "hello");
        expect(client.postChannelMessage).toHaveBeenCalledWith("chan-1", "hello");
    });
});
