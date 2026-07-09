import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { PairCard } from "./PairCard";
import type { Props } from "./PairCard";

describe("PairCard", () => {
    const defaultProps: Props = {
        pair: {
            region: "frontend",
            members: [
                { name: "Alice", level: "beginner" },
                { name: "Bob", level: "muscle" },
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

    it("should render insertedUser if pair has inserted user", () => {
        const props: Props = {
            pair: {
                region: "frontend",
                members: [
                    { name: "Alice", level: "beginner" },
                    { name: "Bob", level: "muscle" },
                ],
                hasInsertedUser: true,
            },
            index: 0,
            insertedUser: {
                name: "Eve",
                pairIndices: [0],
            },
        };
        render(<PairCard {...props} />);

        expect(screen.getByText("@Alice")).toBeInTheDocument();
        expect(screen.getByText("@Bob")).toBeInTheDocument();
        // Eve should be present as the third member
        expect(screen.getByText("@Eve")).toBeInTheDocument();
        expect(screen.getByText("参加")).toBeInTheDocument();
    });

    it("should render fallback labels for unknown region and level", () => {
        const props: Props = {
            ...defaultProps,
            pair: {
                region: "unknown_region" as any,
                members: [
                    { name: "Alice", level: "unknown_level" as any },
                    { name: "Bob", level: null },
                ],
                hasInsertedUser: false,
            },
        };
        render(<PairCard {...props} />);

        expect(screen.queryByText("フロントエンド")).not.toBeInTheDocument();
        expect(screen.queryByText("バックエンド")).not.toBeInTheDocument();
        expect(screen.getByText("@Alice")).toBeInTheDocument();
        expect(screen.getByText("@Bob")).toBeInTheDocument();
        expect(screen.queryByText("🔰")).not.toBeInTheDocument();
        expect(screen.queryByText("経験者")).not.toBeInTheDocument();
    });
});
