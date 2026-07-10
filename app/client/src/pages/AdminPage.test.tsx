import { MemoryRouter } from "react-router-dom";

import * as api from "@client/api";
import { AdminPageRoute } from "@client/appShell";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { AdminPage } from "./AdminPage";

vi.mock("@client/api", () => ({
    getSchedule: vi.fn(),
    upsertSchedule: vi.fn(),
    triggerPost: vi.fn(),
    triggerLottery: vi.fn(),
}));

describe("AdminPage", () => {
    beforeEach(() => {
        vi.restoreAllMocks();
    });

    const mockSchedule = {
        channelId: "12345678-1234-1234-1234-123456789012",
        postDay: 5,
        lotteryDay: 15,
        enabled: true,
        lastMessageId: "msg-999",
        lastPostedAt: "2026-06-05T00:00:00.000Z",
        lastLotteryAt: "2026-05-15T00:00:00.000Z",
    };

    it("should show loading state initially", () => {
        vi.mocked(api.getSchedule).mockReturnValue(new Promise(() => {}));
        render(
            <MemoryRouter>
                <AdminPage />
            </MemoryRouter>
        );

        expect(screen.getByText("設定を読み込み中...")).toBeInTheDocument();
    });

    it("should render schedule form when data is loaded", async () => {
        vi.mocked(api.getSchedule).mockResolvedValue(mockSchedule as any);

        render(
            <MemoryRouter>
                <AdminPage />
            </MemoryRouter>
        );

        await waitFor(() => {
            expect(screen.getByLabelText("チャンネル ID (UUID)")).toBeInTheDocument();
        });

        const channelInput = screen.getByLabelText("チャンネル ID (UUID)") as HTMLInputElement;
        const postInput = screen.getByLabelText("投稿日 (毎月何日)") as HTMLInputElement;
        const lotteryInput = screen.getByLabelText("抽選日 (毎月何日)") as HTMLInputElement;
        const enabledCheckbox = screen.getByLabelText(
            "スケジュールを有効にする"
        ) as HTMLInputElement;

        expect(channelInput.value).toBe(mockSchedule.channelId);
        expect(Number(postInput.value)).toBe(mockSchedule.postDay);
        expect(Number(lotteryInput.value)).toBe(mockSchedule.lotteryDay);
        expect(enabledCheckbox.checked).toBe(mockSchedule.enabled);

        expect(screen.getByText(/直近の投稿 ID:/)).toBeInTheDocument();
    });

    it("reuses the schedule fetched while confirming admin access", async () => {
        vi.clearAllMocks();
        vi.mocked(api.getSchedule).mockResolvedValue(mockSchedule as any);

        render(
            <MemoryRouter>
                <AdminPageRoute>
                    <AdminPage />
                </AdminPageRoute>
            </MemoryRouter>
        );

        await waitFor(() => {
            expect(screen.getByLabelText("チャンネル ID (UUID)")).toBeInTheDocument();
        });
        expect(api.getSchedule).toHaveBeenCalledTimes(1);
    });

    it("should validate that postDay is before lotteryDay", async () => {
        vi.mocked(api.getSchedule).mockResolvedValue(mockSchedule as any);

        render(
            <MemoryRouter>
                <AdminPage />
            </MemoryRouter>
        );

        await waitFor(() => {
            expect(screen.getByLabelText("投稿日 (毎月何日)")).toBeInTheDocument();
        });

        const postInput = screen.getByLabelText("投稿日 (毎月何日)");
        const saveBtn = screen.getByRole("button", { name: "保存" });

        // Set postDay = 16, which is > lotteryDay (15)
        fireEvent.change(postInput, { target: { value: 16 } });

        expect(screen.getByText("抽選日は投稿日より後にしてください。")).toBeInTheDocument();
        expect(saveBtn).toBeDisabled();
    });

    it("should save changes successfully", async () => {
        vi.mocked(api.getSchedule).mockResolvedValue(mockSchedule as any);
        vi.mocked(api.upsertSchedule).mockResolvedValue({ ...mockSchedule, postDay: 6 } as any);

        render(
            <MemoryRouter>
                <AdminPage />
            </MemoryRouter>
        );

        await waitFor(() => {
            expect(screen.getByLabelText("投稿日 (毎月何日)")).toBeInTheDocument();
        });

        const postInput = screen.getByLabelText("投稿日 (毎月何日)");
        const saveBtn = screen.getByRole("button", { name: "保存" });

        fireEvent.change(postInput, { target: { value: 6 } });
        fireEvent.click(saveBtn);

        expect(screen.getByText("保存中...")).toBeInTheDocument();

        await waitFor(() => {
            expect(screen.getByText("設定を保存しました。")).toBeInTheDocument();
        });
    });

    it("should trigger immediate actions", async () => {
        vi.mocked(api.getSchedule).mockResolvedValue(mockSchedule as any);
        vi.mocked(api.triggerPost).mockResolvedValue({ messageId: "msg-new-trigger" });
        vi.mocked(api.triggerLottery).mockResolvedValue({ responseId: "res-new-trigger" });

        render(
            <MemoryRouter>
                <AdminPage />
            </MemoryRouter>
        );

        await waitFor(() => {
            expect(screen.getByRole("button", { name: "今すぐ投稿" })).toBeInTheDocument();
        });

        const triggerPostBtn = screen.getByRole("button", { name: "今すぐ投稿" });
        const triggerLotteryBtn = screen.getByRole("button", { name: "今すぐ抽選" });

        // Click post
        fireEvent.click(triggerPostBtn);
        await waitFor(() => {
            expect(
                screen.getByText(/メッセージを投稿しました \(msg-new-trigger\)/)
            ).toBeInTheDocument();
        });

        // Click lottery
        fireEvent.click(triggerLotteryBtn);
        await waitFor(() => {
            expect(
                screen.getByText(/抽選が完了しました。結果 ID: res-new-trigger/)
            ).toBeInTheDocument();
        });
    });

    it("should display error when schedule loading fails", async () => {
        vi.mocked(api.getSchedule).mockRejectedValue(new Error("Loading error"));
        render(
            <MemoryRouter>
                <AdminPage />
            </MemoryRouter>
        );
        await waitFor(() => {
            expect(screen.getByText("Loading error")).toBeInTheDocument();
        });
    });

    it("should display error when save fails", async () => {
        vi.mocked(api.getSchedule).mockResolvedValue(mockSchedule as any);
        vi.mocked(api.upsertSchedule).mockRejectedValue(new Error("Save failed"));

        render(
            <MemoryRouter>
                <AdminPage />
            </MemoryRouter>
        );

        await waitFor(() => {
            expect(screen.getByLabelText("投稿日 (毎月何日)")).toBeInTheDocument();
        });

        const saveBtn = screen.getByRole("button", { name: "保存" });
        fireEvent.click(saveBtn);

        await waitFor(() => {
            expect(screen.getByText("Save failed")).toBeInTheDocument();
        });
    });

    it("should display errors when immediate actions fail", async () => {
        vi.mocked(api.getSchedule).mockResolvedValue(mockSchedule as any);
        vi.mocked(api.triggerPost).mockRejectedValue(new Error("Trigger post failed"));
        vi.mocked(api.triggerLottery).mockRejectedValue(new Error("Trigger lottery failed"));

        render(
            <MemoryRouter>
                <AdminPage />
            </MemoryRouter>
        );

        await waitFor(() => {
            expect(screen.getByRole("button", { name: "今すぐ投稿" })).toBeInTheDocument();
        });

        const triggerPostBtn = screen.getByRole("button", { name: "今すぐ投稿" });
        const triggerLotteryBtn = screen.getByRole("button", { name: "今すぐ抽選" });

        // Click post and check error
        fireEvent.click(triggerPostBtn);
        await waitFor(() => {
            expect(screen.getByText("Trigger post failed")).toBeInTheDocument();
        });

        // Click lottery and check error
        fireEvent.click(triggerLotteryBtn);
        await waitFor(() => {
            expect(screen.getByText("Trigger lottery failed")).toBeInTheDocument();
        });
    });

    it("should update input fields on user changes", async () => {
        vi.mocked(api.getSchedule).mockResolvedValue(mockSchedule as any);

        render(
            <MemoryRouter>
                <AdminPage />
            </MemoryRouter>
        );

        await waitFor(() => {
            expect(screen.getByLabelText("チャンネル ID (UUID)")).toBeInTheDocument();
        });

        const channelInput = screen.getByLabelText("チャンネル ID (UUID)") as HTMLInputElement;
        const lotteryInput = screen.getByLabelText("抽選日 (毎月何日)") as HTMLInputElement;
        const enabledCheckbox = screen.getByLabelText(
            "スケジュールを有効にする"
        ) as HTMLInputElement;

        // Change values
        fireEvent.change(channelInput, {
            target: { value: "87654321-4321-4321-4321-210987654321" },
        });
        fireEvent.change(lotteryInput, { target: { value: 20 } });
        fireEvent.click(enabledCheckbox);

        expect(channelInput.value).toBe("87654321-4321-4321-4321-210987654321");
        expect(Number(lotteryInput.value)).toBe(20);
        expect(enabledCheckbox.checked).toBe(false);
    });

    it("should handle null schedule from API", async () => {
        vi.mocked(api.getSchedule).mockResolvedValue(null);
        render(
            <MemoryRouter>
                <AdminPage />
            </MemoryRouter>
        );
        await waitFor(() => {
            expect(screen.getByLabelText("チャンネル ID (UUID)")).toBeInTheDocument();
        });
        const channelInput = screen.getByLabelText("チャンネル ID (UUID)") as HTMLInputElement;
        expect(channelInput.value).toBe("");
    });

    it("should display fallback error when schedule loading fails with non-Error", async () => {
        vi.mocked(api.getSchedule).mockRejectedValue("String error");
        render(
            <MemoryRouter>
                <AdminPage />
            </MemoryRouter>
        );
        await waitFor(() => {
            expect(screen.getByText("取得失敗")).toBeInTheDocument();
        });
    });

    it("should display fallback error when save fails with non-Error", async () => {
        vi.mocked(api.getSchedule).mockResolvedValue(mockSchedule as any);
        vi.mocked(api.upsertSchedule).mockRejectedValue("String error");

        render(
            <MemoryRouter>
                <AdminPage />
            </MemoryRouter>
        );

        await waitFor(() => {
            expect(screen.getByLabelText("投稿日 (毎月何日)")).toBeInTheDocument();
        });

        const saveBtn = screen.getByRole("button", { name: "保存" });
        fireEvent.click(saveBtn);

        await waitFor(() => {
            expect(screen.getByText("保存失敗")).toBeInTheDocument();
        });
    });

    it("should display fallback errors when immediate actions fail with non-Error", async () => {
        vi.mocked(api.getSchedule).mockResolvedValue(mockSchedule as any);
        vi.mocked(api.triggerPost).mockRejectedValue("String error");
        vi.mocked(api.triggerLottery).mockRejectedValue("String error");

        render(
            <MemoryRouter>
                <AdminPage />
            </MemoryRouter>
        );

        await waitFor(() => {
            expect(screen.getByRole("button", { name: "今すぐ投稿" })).toBeInTheDocument();
        });

        const triggerPostBtn = screen.getByRole("button", { name: "今すぐ投稿" });
        const triggerLotteryBtn = screen.getByRole("button", { name: "今すぐ抽選" });

        fireEvent.click(triggerPostBtn);
        await waitFor(() => {
            expect(screen.getByText("投稿失敗")).toBeInTheDocument();
        });

        fireEvent.click(triggerLotteryBtn);
        await waitFor(() => {
            expect(screen.getByText("抽選失敗")).toBeInTheDocument();
        });
    });
});
