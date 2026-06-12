import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { CheckIcon, ChevronDownIcon, CopyIcon } from "./icons";

describe("Icons", () => {
    it("should render ChevronDownIcon successfully", () => {
        const { container } = render(<ChevronDownIcon className="test-class" />);
        const svg = container.querySelector("svg");
        expect(svg).toBeInTheDocument();
        expect(svg).toHaveClass("test-class");
    });

    it("should render CopyIcon successfully", () => {
        const { container } = render(<CopyIcon />);
        const svg = container.querySelector("svg");
        expect(svg).toBeInTheDocument();
    });

    it("should render CheckIcon successfully", () => {
        const { container } = render(<CheckIcon />);
        const svg = container.querySelector("svg");
        expect(svg).toBeInTheDocument();
    });
});
