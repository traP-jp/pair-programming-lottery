import { MemoryRouter, Route, Routes } from "react-router-dom";

import * as api from "@client/api";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ResultDetailPage } from "./ResultDetailPage";

vi.mock("@client/api", () => ({
    cacheResult: vi.fn(),
    getCachedResult: vi.fn(),
    getResult: vi.fn(),
}));

const mockWriteText = vi.fn().mockResolvedValue(undefined);
Object.defineProperty(navigator, "clipboard", {
    value: {
        writeText: mockWriteText,
    },
    writable: true,
});

describe("ResultDetailPage", () => {
    beforeEach(() => {
        vi.restoreAllMocks();
        vi.clearAllMocks();
        vi.mocked(api.getCachedResult).mockReturnValue(undefined);
        mockWriteText.mockClear();
        vi.useRealTimers();
    });

    const mockRecord = {
        id: "res-123",
        month: "2026-06",
        channelId: "chan-1",
        createdAt: "2026-06-12T07:00:00.000Z",
        result: {
            pairs: [
                {
                    region: "frontend",
                    members: [
                        { name: "Alice", isBeginner: true },
                        { name: "Bob", isBeginner: false },
                    ],
                    hasInsertedUser: true,
                },
            ],
            insertedUser: {
                name: "Eve",
                pairIndices: [0],
            },
            participantCount: 2,
            score: { normalized: 0.85 },
        },
    };

    const renderComponent = (id: string = "res-123") => {
        return render(
            <MemoryRouter initialEntries={[`/results/${id}`]}>
                <Routes>
                    <Route
                        path="/results/:id"
                        element={<ResultDetailPage />}
                    />
                </Routes>
            </MemoryRouter>
        );
    };

    it("should show loading state", () => {
        vi.mocked(api.getResult).mockReturnValue(new Promise(() => {}));
        renderComponent();
        expect(screen.getByText("読み込み中...")).toBeInTheDocument();
    });

    it("should show error on fetch failure", async () => {
        vi.mocked(api.getResult).mockRejectedValue(new Error("Failed to load"));
        renderComponent();

        await waitFor(() => {
            expect(screen.getByText("Failed to load")).toBeInTheDocument();
        });
    });

    it("should render details on success", async () => {
        vi.mocked(api.getResult).mockResolvedValue(mockRecord as any);
        renderComponent();

        await waitFor(() => {
            expect(screen.getByText("2026-06 — 2026/6/12 16:00:00")).toBeInTheDocument();
        });

        expect(screen.getByText("@Alice")).toBeInTheDocument();
        expect(screen.getByText("@Bob")).toBeInTheDocument();
        expect(screen.getAllByText(/@Eve/).length).toBeGreaterThan(0);
    });

    it("should copy participants CSV text to clipboard on button click", async () => {
        vi.mocked(api.getResult).mockResolvedValue(mockRecord as any);
        renderComponent();

        await waitFor(() => {
            expect(screen.getByText("参加者一覧")).toBeInTheDocument();
        });

        // Click accordion summary to expand if needed (in jsdom details can be clicked)
        const summary = screen.getByText("参加者一覧");
        fireEvent.click(summary);

        const copyBtn = screen.getByRole("button", { name: /コピー/ });
        expect(copyBtn).toBeInTheDocument();

        // Click copy
        fireEvent.click(copyBtn);
        expect(mockWriteText).toHaveBeenCalledWith("@Alice, @Bob, @Eve");

        // The button should change state
        await waitFor(() => {
            expect(copyBtn.querySelector(".success")).toBeInTheDocument();
        });
    });

    it("should handle copy failure gracefully", async () => {
        vi.mocked(api.getResult).mockResolvedValue(mockRecord as any);
        mockWriteText.mockRejectedValueOnce(new Error("Clipboard block"));

        renderComponent();

        await waitFor(() => {
            expect(screen.getByText("参加者一覧")).toBeInTheDocument();
        });

        const summary = screen.getByText("参加者一覧");
        fireEvent.click(summary);

        const copyBtn = screen.getByRole("button", { name: /コピー/ });
        expect(copyBtn).toBeInTheDocument();

        const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
        fireEvent.click(copyBtn);

        await waitFor(() => {
            expect(consoleErrorSpy).toHaveBeenCalledWith("Failed to copy:", expect.any(Error));
        });
        consoleErrorSpy.mockRestore();
    });

    it("should reset copied state after 2 seconds", async () => {
        vi.mocked(api.getResult).mockResolvedValue(mockRecord as any);
        renderComponent();

        await waitFor(() => {
            expect(screen.getByText("参加者一覧")).toBeInTheDocument();
        });

        const summary = screen.getByText("参加者一覧");
        fireEvent.click(summary);

        const copyBtn = screen.getByRole("button", { name: /コピー/ });

        // Enable fake timers only after rendering and getting copy button
        vi.useFakeTimers();

        // Wrap the click and microtask flushes in act
        await act(async () => {
            fireEvent.click(copyBtn);
            // Flush promise microtasks to allow clipboard write to resolve and schedule setTimeout
            await Promise.resolve();
            await Promise.resolve();
        });

        // Verify the copy state is active
        expect(copyBtn.querySelector(".success")).toBeInTheDocument();

        // Advance timers by 2 seconds inside act
        await act(async () => {
            vi.advanceTimersByTime(2000);
        });

        // Verify the copy state has reset
        expect(copyBtn.querySelector(".success")).not.toBeInTheDocument();

        vi.useRealTimers();
    });

    it("should display fallback error when fetch fails with non-Error", async () => {
        vi.mocked(api.getResult).mockRejectedValue("String error");
        renderComponent();

        await waitFor(() => {
            expect(screen.getByText("取得失敗")).toBeInTheDocument();
        });
    });

    it("should handle missing member and insertedUser names in copy list", async () => {
        const mockPartialRecord = {
            ...mockRecord,
            result: {
                ...mockRecord.result,
                pairs: [
                    {
                        region: "frontend",
                        members: [
                            { name: "", isBeginner: true },
                            { name: null as any, isBeginner: false },
                        ],
                        hasInsertedUser: true,
                    },
                ],
                insertedUser: {
                    name: "",
                    pairIndices: [0],
                },
            },
        };
        vi.mocked(api.getResult).mockResolvedValue(mockPartialRecord as any);
        renderComponent();
        await waitFor(() => {
            expect(screen.getByText("参加者一覧")).toBeInTheDocument();
        });
        const summary = screen.getByText("参加者一覧");
        fireEvent.click(summary);
        // It should render empty code block without crash
        const codeText = screen.getByText("", { selector: ".participants-code" });
        expect(codeText.textContent).toBe("");
    });

    it("should return early when id route parameter is missing", () => {
        render(
            <MemoryRouter initialEntries={["/results"]}>
                <Routes>
                    <Route
                        path="/results"
                        element={<ResultDetailPage />}
                    />
                </Routes>
            </MemoryRouter>
        );
        expect(api.getResult).not.toHaveBeenCalled();
    });

    it("should return null (render nothing) when record is null and not loading", async () => {
        vi.mocked(api.getResult).mockResolvedValue(null as any);
        renderComponent();
        await waitFor(() => {
            // It should finish loading but not show error or contents
            expect(screen.queryByText("読み込み中...")).not.toBeInTheDocument();
            expect(screen.queryByText("抽選結果")).not.toBeInTheDocument();
            expect(screen.queryByText("取得失敗")).not.toBeInTheDocument();
        });
    });
});
