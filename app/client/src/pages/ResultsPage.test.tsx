import { MemoryRouter } from "react-router-dom";

import * as api from "@client/api";
import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ResultsPage } from "./ResultsPage";

vi.mock("@client/api", () => ({
    cacheResults: vi.fn(),
    getCachedResults: vi.fn(() => null),
    getResults: vi.fn(),
    refreshResults: vi.fn(),
}));

describe("ResultsPage", () => {
    beforeEach(() => {
        vi.restoreAllMocks();
        vi.mocked(api.getResults).mockRejectedValue(new Error("No cache"));
    });

    it("should display loading state initially", () => {
        vi.mocked(api.refreshResults).mockReturnValue(new Promise(() => {})); // Never resolves
        render(
            <MemoryRouter>
                <ResultsPage />
            </MemoryRouter>
        );

        expect(screen.getByText("読み込み中...")).toBeInTheDocument();
    });

    it("should display cached results while revalidation is pending", async () => {
        const cachedList = [
            {
                id: "res-1",
                month: "2026-05",
                channelId: "chan-1",
                createdAt: "2026-05-12T07:00:00.000Z",
            },
        ];
        vi.mocked(api.getResults).mockResolvedValue(cachedList as any);
        vi.mocked(api.refreshResults).mockReturnValue(new Promise(() => {})); // Never resolves

        render(
            <MemoryRouter>
                <ResultsPage />
            </MemoryRouter>
        );

        await waitFor(() => {
            expect(screen.getByText("2026-05")).toBeInTheDocument();
        });
        expect(screen.queryByText("読み込み中...")).not.toBeInTheDocument();
    });

    it("should display error message on API failure", async () => {
        vi.mocked(api.refreshResults).mockRejectedValue(new Error("Fetch failed"));
        render(
            <MemoryRouter>
                <ResultsPage />
            </MemoryRouter>
        );

        await waitFor(() => {
            expect(screen.getByText("Fetch failed")).toBeInTheDocument();
        });
        expect(screen.queryByText("読み込み中...")).not.toBeInTheDocument();
    });

    it("should display empty message when results list is empty", async () => {
        vi.mocked(api.refreshResults).mockResolvedValue([]);
        render(
            <MemoryRouter>
                <ResultsPage />
            </MemoryRouter>
        );

        await waitFor(() => {
            expect(screen.getByText("まだ抽選結果がありません。")).toBeInTheDocument();
        });
    });

    it("should display list of results on success", async () => {
        const mockList = [
            {
                id: "res-1",
                month: "2026-06",
                channelId: "chan-1",
                createdAt: "2026-06-12T07:00:00.000Z",
            },
        ];
        vi.mocked(api.refreshResults).mockResolvedValue(mockList as any);

        render(
            <MemoryRouter>
                <ResultsPage />
            </MemoryRouter>
        );

        await waitFor(() => {
            expect(screen.getByText("2026-06")).toBeInTheDocument();
        });
        expect(screen.getByText("2026/6/12 16:00:00")).toBeInTheDocument();
    });

    it("should display fallback error message on API failure with non-Error", async () => {
        vi.mocked(api.refreshResults).mockRejectedValue("String error");
        render(
            <MemoryRouter>
                <ResultsPage />
            </MemoryRouter>
        );

        await waitFor(() => {
            expect(screen.getByText("取得失敗")).toBeInTheDocument();
        });
    });
});
