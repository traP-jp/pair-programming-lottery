import { act } from "react";

import * as api from "@client/api";
import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { AdminRoute, AuthProvider, useAuth } from "./useAuth";

vi.mock("@client/api", () => ({
    getSchedule: vi.fn(),
}));

function ConsumerComponent() {
    const { isAdmin, loading, error } = useAuth();
    return (
        <div>
            <span data-testid="admin">{isAdmin ? "yes" : "no"}</span>
            <span data-testid="loading">{loading ? "yes" : "no"}</span>
            <span data-testid="error">{error ?? "none"}</span>
        </div>
    );
}

describe("useAuth & AuthProvider", () => {
    beforeEach(() => {
        vi.restoreAllMocks();
    });

    it("should throw error if useAuth is used outside AuthProvider", () => {
        // Prevent console.error clutter from React warning about thrown errors
        const spyConsole = vi.spyOn(console, "error").mockImplementation(() => {});
        expect(() => render(<ConsumerComponent />)).toThrow(
            "useAuth must be used within an AuthProvider"
        );
        spyConsole.mockRestore();
    });

    it("should set isAdmin to true if getSchedule succeeds", async () => {
        vi.mocked(api.getSchedule).mockResolvedValue({ id: 1 } as any);

        render(
            <AuthProvider>
                <ConsumerComponent />
            </AuthProvider>
        );

        expect(screen.getByTestId("loading")).toHaveTextContent("yes");

        await waitFor(() => {
            expect(screen.getByTestId("loading")).toHaveTextContent("no");
        });
        expect(screen.getByTestId("admin")).toHaveTextContent("yes");
        expect(screen.getByTestId("error")).toHaveTextContent("none");
    });

    it("should set isAdmin to false if getSchedule returns unauthorized", async () => {
        vi.mocked(api.getSchedule).mockRejectedValue(new Error("unauthorized"));

        render(
            <AuthProvider>
                <ConsumerComponent />
            </AuthProvider>
        );

        await waitFor(() => {
            expect(screen.getByTestId("loading")).toHaveTextContent("no");
        });
        expect(screen.getByTestId("admin")).toHaveTextContent("no");
        expect(screen.getByTestId("error")).toHaveTextContent("none");
    });

    it("should set error if getSchedule fails with other errors", async () => {
        vi.mocked(api.getSchedule).mockRejectedValue(new Error("Connection Failed"));

        render(
            <AuthProvider>
                <ConsumerComponent />
            </AuthProvider>
        );

        await waitFor(() => {
            expect(screen.getByTestId("loading")).toHaveTextContent("no");
        });
        expect(screen.getByTestId("admin")).toHaveTextContent("no");
        expect(screen.getByTestId("error")).toHaveTextContent("Connection Failed");
    });

    it("should set default error message if error is not an Error instance", async () => {
        vi.mocked(api.getSchedule).mockRejectedValue("Some string error");

        render(
            <AuthProvider>
                <ConsumerComponent />
            </AuthProvider>
        );

        await waitFor(() => {
            expect(screen.getByTestId("loading")).toHaveTextContent("no");
        });
        expect(screen.getByTestId("error")).toHaveTextContent("認証の確認に失敗しました");
    });
});

describe("AdminRoute", () => {
    beforeEach(() => {
        vi.restoreAllMocks();
    });

    it("should render loading state when loading is true", () => {
        vi.mocked(api.getSchedule).mockReturnValue(new Promise(() => {})); // Never resolves

        render(
            <AuthProvider>
                <AdminRoute>
                    <div>Secret Admin Content</div>
                </AdminRoute>
            </AuthProvider>
        );

        expect(screen.getByText("読み込み中...")).toBeInTheDocument();
        expect(screen.queryByText("Secret Admin Content")).not.toBeInTheDocument();
    });

    it("should render error when authentication fails with non-unauthorized error", async () => {
        vi.mocked(api.getSchedule).mockRejectedValue(new Error("Database error"));

        render(
            <AuthProvider>
                <AdminRoute>
                    <div>Secret Admin Content</div>
                </AdminRoute>
            </AuthProvider>
        );

        await waitFor(() => {
            expect(screen.getByText("認証エラー: Database error")).toBeInTheDocument();
        });
    });

    it("should render access denied if not admin", async () => {
        vi.mocked(api.getSchedule).mockRejectedValue(new Error("unauthorized"));

        render(
            <AuthProvider>
                <AdminRoute>
                    <div>Secret Admin Content</div>
                </AdminRoute>
            </AuthProvider>
        );

        await waitFor(() => {
            expect(screen.getByText("管理者権限がありません")).toBeInTheDocument();
        });
    });

    it("should render children if user is admin", async () => {
        vi.mocked(api.getSchedule).mockResolvedValue({ id: 1 } as any);

        render(
            <AuthProvider>
                <AdminRoute>
                    <div>Secret Admin Content</div>
                </AdminRoute>
            </AuthProvider>
        );

        await waitFor(() => {
            expect(screen.getByText("Secret Admin Content")).toBeInTheDocument();
        });
    });
});
