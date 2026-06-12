import { MemoryRouter } from "react-router-dom";

import * as api from "@client/api";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ManagePage } from "./ManagePage";

vi.mock("@client/api", () => ({
    postMessage: vi.fn(),
    runLottery: vi.fn(),
    saveResult: vi.fn(),
}));

describe("ManagePage", () => {
    beforeEach(() => {
        vi.restoreAllMocks();
        vi.clearAllMocks();
    });

    it("should render steps and inputs correctly", () => {
        render(
            <MemoryRouter>
                <ManagePage />
            </MemoryRouter>
        );

        expect(screen.getByRole("heading", { name: "手動操作" })).toBeInTheDocument();
        expect(screen.getByLabelText("チャンネル ID (UUID)")).toBeInTheDocument();
        expect(screen.getByLabelText("メッセージ ID (UUID)")).toBeInTheDocument();
    });

    it("should process post message step successfully", async () => {
        vi.mocked(api.postMessage).mockResolvedValue("msg-created-111");

        render(
            <MemoryRouter>
                <ManagePage />
            </MemoryRouter>
        );

        const channelInput = screen.getByLabelText("チャンネル ID (UUID)");
        const postBtn = screen.getByRole("button", { name: "投稿する" });

        fireEvent.change(channelInput, {
            target: { value: "12345678-1234-1234-1234-123456789012" },
        });
        fireEvent.click(postBtn);

        expect(postBtn).toBeDisabled();
        expect(screen.getByText("投稿中...")).toBeInTheDocument();

        await waitFor(() => {
            expect(screen.getByText(/メッセージを投稿しました/)).toBeInTheDocument();
        });

        expect(screen.getByText("メッセージ ID: msg-created-111")).toBeInTheDocument();
        // Step 2 message input should be populated with the created ID
        const messageInput = screen.getByLabelText("メッセージ ID (UUID)") as HTMLInputElement;
        expect(messageInput.value).toBe("msg-created-111");
    });

    it("should display error on post message failure", async () => {
        vi.mocked(api.postMessage).mockRejectedValue(new Error("Channel not found"));

        render(
            <MemoryRouter>
                <ManagePage />
            </MemoryRouter>
        );

        const channelInput = screen.getByLabelText("チャンネル ID (UUID)");
        const postBtn = screen.getByRole("button", { name: "投稿する" });

        fireEvent.change(channelInput, {
            target: { value: "12345678-1234-1234-1234-123456789012" },
        });
        fireEvent.click(postBtn);

        await waitFor(() => {
            expect(screen.getByText("Channel not found")).toBeInTheDocument();
        });
    });

    it("should process lottery execution and result save successfully", async () => {
        const mockResult = {
            pairs: [
                {
                    region: "frontend",
                    members: [
                        { name: "Alice", role: "navigator" },
                        { name: "Bob", role: "driver" },
                    ],
                    hasInsertedUser: false,
                },
            ],
            insertedUser: null,
            participantCount: 2,
            score: { normalized: 0.85 },
        };

        vi.mocked(api.runLottery).mockResolvedValue(mockResult as any);
        vi.mocked(api.saveResult).mockResolvedValue({ id: "saved-id-999" } as any);

        render(
            <MemoryRouter>
                <ManagePage />
            </MemoryRouter>
        );

        const messageInput = screen.getByLabelText("メッセージ ID (UUID)");
        const runBtn = screen.getByRole("button", { name: "抽選する" });

        fireEvent.change(messageInput, {
            target: { value: "87654321-4321-4321-4321-210987654321" },
        });
        fireEvent.click(runBtn);

        expect(screen.getByText("抽選中...")).toBeInTheDocument();

        await waitFor(() => {
            expect(screen.getByText("抽選結果")).toBeInTheDocument();
        });

        expect(screen.getByText("@Alice")).toBeInTheDocument();

        // Save result
        const saveBtn = screen.getByRole("button", { name: "結果一覧に保存" });
        fireEvent.click(saveBtn);

        expect(screen.getByText("保存中...")).toBeInTheDocument();

        await waitFor(() => {
            expect(screen.getByText("保存した結果を見る")).toBeInTheDocument();
        });
    });

    it("should display errors on runLottery and saveResult failures", async () => {
        const mockResult = { pairs: [], participantCount: 0, score: { normalized: 0 } };
        vi.mocked(api.runLottery).mockRejectedValue(new Error("Run failed"));
        vi.mocked(api.saveResult).mockRejectedValue(new Error("Save failed"));

        render(
            <MemoryRouter>
                <ManagePage />
            </MemoryRouter>
        );

        const messageInput = screen.getByLabelText("メッセージ ID (UUID)");
        const runBtn = screen.getByRole("button", { name: "抽選する" });

        fireEvent.change(messageInput, {
            target: { value: "87654321-4321-4321-4321-210987654321" },
        });
        fireEvent.click(runBtn);

        await waitFor(() => {
            expect(screen.getByText("Run failed")).toBeInTheDocument();
        });

        // Set result mock to succeed to test save failure
        vi.mocked(api.runLottery).mockResolvedValue(mockResult as any);
        fireEvent.click(runBtn);

        await waitFor(() => {
            expect(screen.getByText("結果一覧に保存")).toBeInTheDocument();
        });

        const saveBtn = screen.getByRole("button", { name: "結果一覧に保存" });
        fireEvent.click(saveBtn);

        await waitFor(() => {
            expect(screen.getByText("Save failed")).toBeInTheDocument();
        });
    });

    it("should display fallback error when actions fail with non-Error", async () => {
        const mockResult = { pairs: [], participantCount: 0, score: { normalized: 0 } };
        vi.mocked(api.postMessage).mockRejectedValue("String error");
        vi.mocked(api.runLottery).mockRejectedValue("String error");
        vi.mocked(api.saveResult).mockRejectedValue("String error");

        render(
            <MemoryRouter>
                <ManagePage />
            </MemoryRouter>
        );

        // Test postMessage fallback error
        const channelInput = screen.getByLabelText("チャンネル ID (UUID)");
        const postBtn = screen.getByRole("button", { name: "投稿する" });
        fireEvent.change(channelInput, {
            target: { value: "12345678-1234-1234-1234-123456789012" },
        });
        fireEvent.click(postBtn);
        await waitFor(() => {
            expect(screen.getByText("不明なエラー")).toBeInTheDocument();
        });

        // Test runLottery fallback error
        const messageInput = screen.getByLabelText("メッセージ ID (UUID)");
        const runBtn = screen.getByRole("button", { name: "抽選する" });
        fireEvent.change(messageInput, {
            target: { value: "87654321-4321-4321-4321-210987654321" },
        });
        fireEvent.click(runBtn);
        await waitFor(() => {
            expect(screen.getByText("不明なエラー")).toBeInTheDocument();
        });

        // Test saveResult fallback error
        vi.mocked(api.runLottery).mockResolvedValue(mockResult as any);
        fireEvent.click(runBtn);
        await waitFor(() => {
            expect(screen.getByText("結果一覧に保存")).toBeInTheDocument();
        });
        const saveBtn = screen.getByRole("button", { name: "結果一覧に保存" });
        fireEvent.click(saveBtn);
        await waitFor(() => {
            expect(screen.getByText("不明なエラー")).toBeInTheDocument();
        });
    });

    it("should return early on empty ID submissions", async () => {
        const mockResult = {
            pairs: [
                {
                    region: "frontend",
                    members: [
                        { name: "Alice", role: "navigator" },
                        { name: "Bob", role: "driver" },
                    ],
                    hasInsertedUser: false,
                },
            ],
            insertedUser: null,
            participantCount: 2,
            score: { normalized: 0.85 },
        };
        vi.mocked(api.runLottery).mockResolvedValue(mockResult as any);

        render(
            <MemoryRouter>
                <ManagePage />
            </MemoryRouter>
        );

        // Submit post message form with empty channel ID (or whitespace)
        const channelInput = screen.getByLabelText("チャンネル ID (UUID)") as HTMLInputElement;
        const postForm = channelInput.closest("form");
        fireEvent.change(channelInput, { target: { value: "   " } });
        fireEvent.submit(postForm!);
        expect(api.postMessage).not.toHaveBeenCalled();

        // Submit run lottery form with empty message ID (or whitespace)
        const messageInput = screen.getByLabelText("メッセージ ID (UUID)") as HTMLInputElement;
        const runForm = messageInput.closest("form");
        fireEvent.change(messageInput, { target: { value: "   " } });
        fireEvent.submit(runForm!);
        expect(api.runLottery).not.toHaveBeenCalled();

        // Trigger run lottery with valid ID first to render the result view
        fireEvent.change(messageInput, {
            target: { value: "87654321-4321-4321-4321-210987654321" },
        });
        fireEvent.submit(runForm!);
        await waitFor(() => {
            expect(screen.getByText("結果一覧に保存")).toBeInTheDocument();
        });

        // Set messageId to empty
        fireEvent.change(messageInput, { target: { value: "" } });

        // Force call handleSave via React click handler to test early return when ID is empty
        const saveBtn = screen.getByRole("button", { name: "結果一覧に保存" });
        const reactProps = (saveBtn as any)[
            Object.keys(saveBtn).find(key => key.startsWith("__reactProps$")) || ""
        ];
        if (reactProps && reactProps.onClick) {
            reactProps.onClick();
        }
        expect(api.saveResult).not.toHaveBeenCalled();
    });
});
