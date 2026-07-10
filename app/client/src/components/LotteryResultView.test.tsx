import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { LotteryResultView } from "./LotteryResultView";
import type { Props } from "./LotteryResultView";

describe("LotteryResultView", () => {
    const defaultProps: Props = {
        result: {
            pairs: [
                {
                    region: "frontend",
                    members: [
                        { id: "u1", name: "Alice", isBeginner: true },
                        { id: "u2", name: "Bob", isBeginner: false },
                    ],
                    hasInsertedUser: false,
                },
                {
                    region: "backend",
                    members: [
                        { id: "u3", name: "Charlie", isBeginner: true },
                        { id: "u4", name: "Dave", isBeginner: false },
                    ],
                    hasInsertedUser: false,
                },
            ],
            insertedUser: null,
            participantCount: 4,
            score: {
                normalized: 0.954,
                total: 210,
                max: 220,
            },
            config: {
                regionMatchScore: 100,
                penaltyBeginnerPair: 10000,
                simulationRounds: 5000,
            },
        },
        title: "Test Title",
    };

    it("should render title, participant count, and normalized score", () => {
        render(<LotteryResultView {...defaultProps} />);

        expect(screen.getByText("Test Title")).toBeInTheDocument();
        expect(screen.getByText("4人")).toBeInTheDocument();
        expect(screen.getByText("スコア 0.954")).toBeInTheDocument();
    });

    it("should render correct number of pairs", () => {
        render(<LotteryResultView {...defaultProps} />);

        // We have 2 pairs
        expect(screen.getByText("ペア 1")).toBeInTheDocument();
        expect(screen.getByText("ペア 2")).toBeInTheDocument();
        expect(screen.getByText("@Alice")).toBeInTheDocument();
        expect(screen.getByText("@Charlie")).toBeInTheDocument();
    });

    it("should render inserted user note if insertedUser is present", () => {
        const props: Props = {
            ...defaultProps,
            result: {
                ...defaultProps.result,
                insertedUser: {
                    name: "Eve",
                    pairIndices: [0, 1],
                },
                participantCount: 5,
            },
        };
        render(<LotteryResultView {...props} />);

        expect(screen.getByText("5人")).toBeInTheDocument();
    });

    it("should render children elements", () => {
        render(
            <LotteryResultView {...defaultProps}>
                <div data-testid="child-element">Child Content</div>
            </LotteryResultView>
        );

        expect(screen.getByTestId("child-element")).toBeInTheDocument();
        expect(screen.getByText("Child Content")).toBeInTheDocument();
    });
});
