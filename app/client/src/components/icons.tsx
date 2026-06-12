import type { SVGProps } from "react";

export function ChevronDownIcon(props: SVGProps<SVGSVGElement>) {
    return (
        <svg
            viewBox="0 0 24 24"
            width="16"
            height="16"
            stroke="currentColor"
            strokeWidth="2.5"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            {...props}
        >
            <polyline points="6 9 12 15 18 9"></polyline>
        </svg>
    );
}

export function CopyIcon(props: SVGProps<SVGSVGElement>) {
    return (
        <svg
            viewBox="0 0 24 24"
            width="14"
            height="14"
            stroke="currentColor"
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            {...props}
        >
            <rect
                x="9"
                y="9"
                width="13"
                height="13"
                rx="2"
                ry="2"
            ></rect>
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
        </svg>
    );
}

export function CheckIcon(props: SVGProps<SVGSVGElement>) {
    return (
        <svg
            viewBox="0 0 24 24"
            width="14"
            height="14"
            stroke="currentColor"
            strokeWidth="2.5"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            {...props}
        >
            <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
    );
}
