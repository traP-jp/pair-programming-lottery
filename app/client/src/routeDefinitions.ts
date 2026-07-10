import type { ResultDetail, ResultSummary } from "@client/api";

export const paths = {
    home: "/",
    results: "/results",
    resultDetail: (id: string) => `/results/${id}`,
    resultDetailPattern: "/results/:id",
    manage: "/manage",
    admin: "/admin",
} as const;

export interface InitialData {
    result?: ResultDetail | null;
    results?: ResultSummary[];
}
