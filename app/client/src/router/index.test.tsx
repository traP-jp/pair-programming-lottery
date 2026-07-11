import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { Root } from "./index";

import * as api from "../api";

vi.mock("../api", () => ({
    getCachedResults: vi.fn(() => null),
    getResults: vi.fn(),
    getSchedule: vi.fn(),
}));

describe("router component", () => {
    it("should render navigation layout and default to results page", async () => {
        vi.mocked(api.getResults).mockResolvedValue([]);
        vi.mocked(api.getSchedule).mockResolvedValue({
            channelId: "123",
            postDay: 5,
            lotteryDay: 15,
            enabled: true,
        } as any);

        render(<Root />);

        // Nav brand and links should be rendered
        expect(screen.getByText("ペアプロ抽選")).toBeInTheDocument();
        expect(screen.getByText("結果")).toBeInTheDocument();
        expect(screen.getByText("操作")).toBeInTheDocument();
        expect(screen.getByText("管理")).toBeInTheDocument();

        // Default route should navigate to /results and display empty results message
        await waitFor(() => {
            expect(screen.getByText("まだ抽選結果がありません。")).toBeInTheDocument();
        });
    });
});
