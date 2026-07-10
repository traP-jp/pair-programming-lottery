import { beforeEach, describe, expect, it, mock } from "bun:test";

import { TraqClient } from "./traq";

const mockGetStamps = mock(async () => ({ data: [{ id: "s1", name: "one" }] }));
const mockgetUsers = mock(async () => ({
    data: [{ id: "u1", name: "user1", displayName: "User One", bot: false }],
}));
const mockGetMessage = mock(async (id: string) => {
    if (id === "valid-id")
        return { data: { channelId: "chan-1", stamps: [{ stampId: "s1", userId: "u1" }] } };
    return { data: null };
});
const mockAddMessageStamp = mock(async () => {});
const mockPostMessage = mock(async () => ({ data: { id: "new-msg-id" } }));

mock.module("traq-bot-ts", () => {
    return {
        Api: class {
            stamps = { getStamps: mockGetStamps };
            users = { getUsers: mockgetUsers };
            messages = {
                getMessage: mockGetMessage,
                addMessageStamp: mockAddMessageStamp,
            };
            channels = { postMessage: mockPostMessage };
        },
    };
});

describe("TraqClient", () => {
    beforeEach(() => {
        mockGetStamps.mockClear();
        mockgetUsers.mockClear();
        mockGetMessage.mockClear();
        mockAddMessageStamp.mockClear();
        mockPostMessage.mockClear();
    });

    it("getStamps should fetch from API and cache the result", async () => {
        const client = new TraqClient("test-token");

        // First call should invoke the API
        const stamps1 = await client.getStamps();
        expect(stamps1).toEqual([{ id: "s1", name: "one" }]);
        expect(mockGetStamps).toHaveBeenCalledTimes(1);

        // Second call should return cached value
        const stamps2 = await client.getStamps();
        expect(stamps2).toEqual([{ id: "s1", name: "one" }]);
        expect(mockGetStamps).toHaveBeenCalledTimes(1);
    });

    it("deduplicates concurrent stamp and user requests", async () => {
        const client = new TraqClient("test-token");

        await Promise.all([
            client.getStamps(),
            client.getStamps(),
            client.getUsers(),
            client.getUsers(),
        ]);

        expect(mockGetStamps).toHaveBeenCalledTimes(1);
        expect(mockgetUsers).toHaveBeenCalledTimes(1);
    });

    it("getUsers should cache the result and respect TTL", async () => {
        const client = new TraqClient("test-token");

        const users1 = await client.getUsers();
        expect(users1).toEqual([{ id: "u1", name: "user1", bot: false }]);
        expect(mockgetUsers).toHaveBeenCalledTimes(1);

        // Within TTL (10 minutes)
        const users2 = await client.getUsers();
        expect(users2).toEqual([{ id: "u1", name: "user1", bot: false }]);
        expect(mockgetUsers).toHaveBeenCalledTimes(1);
    });

    it("getMessage should retrieve and unwrap message info or return null", async () => {
        const client = new TraqClient("test-token");

        const message = await client.getMessage("valid-id");
        expect(message).toEqual({
            channelId: "chan-1",
            stamps: [{ stampId: "s1", userId: "u1" }],
        });

        const messageNull = await client.getMessage("invalid-id");
        expect(messageNull).toBeNull();
    });

    it("addMessageStamp should invoke the messages API", async () => {
        const client = new TraqClient("test-token");
        await client.addMessageStamp("msg-123", "stamp-456", 2);
        expect(mockAddMessageStamp).toHaveBeenCalledWith("msg-123", "stamp-456", { count: 2 });
    });

    it("postChannelMessage should post to channels API and return new message ID", async () => {
        const client = new TraqClient("test-token");
        const res = await client.postChannelMessage("chan-abc", "hello");
        expect(res).toEqual({ id: "new-msg-id" });
        expect(mockPostMessage).toHaveBeenCalledWith("chan-abc", {
            content: "hello",
            embed: false,
        });
    });
});
