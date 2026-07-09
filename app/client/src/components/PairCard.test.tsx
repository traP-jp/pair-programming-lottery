import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { PairCard } from "./PairCard";
import type { Props } from "./PairCard";

describe("PairCard", () => {
    const defaultProps: Props = {
        pair: {
            region: "frontend",
            members: [
                { name: "Alice", isBeginner: true },
                { name: "Bob", isBeginner: false },
            ],
            hasInsertedUser: false,
        },
        index: 0,
        insertedUser: null,
    };

    it("should render members with names and levels", () => {
        render(<PairCard {...defaultProps} />);

        // Check pair number header (index 0 should show "ペア 1")
        expect(screen.getByText("ペア 1")).toBeInTheDocument();

        // Check region label
        expect(screen.getByText("フロントエンド")).toBeInTheDocument();

        // Check member names
        expect(screen.getByText("@Alice")).toBeInTheDocument();
        expect(screen.getByText("@Bob")).toBeInTheDocument();

        // Check level tags
        expect(screen.getByText("🔰")).toBeInTheDocument();
        expect(screen.queryByText("経験者")).not.toBeInTheDocument();
    });

    it("should render backend region correctly", () => {
        const props = {
            ...defaultProps,
            pair: {
                ...defaultProps.pair,
                region: "backend" as const,
            },
        };
        render(<PairCard {...props} />);
        expect(screen.getByText("バックエンド")).toBeInTheDocument();
    });

    it("should render fallback labels for unknown region", () => {
        const pair = {
            region: "unknown_region" as any,
            members: [
                { name: "Alice", isBeginner: false },
                { name: "Bob", isBeginner: false },
            ] as any,
            hasInsertedUser: false,
        };
        const { container } = render(
            <PairCard
                pair={pair}
                index={0}
                insertedUser={null}
            />
        );
        expect(container.querySelector(".region-tag")?.textContent).toBe("unknown_region");
    });
});
