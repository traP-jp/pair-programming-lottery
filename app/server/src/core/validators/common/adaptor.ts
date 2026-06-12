import { ApplicationError } from "@server/error/structure";
import type { ValidationTargets } from "hono";

export const adaptor =
    <Target extends keyof ValidationTargets>(_target: Target) =>
    <V extends (value: ValidationTargets[Target]) => unknown>(validator: V) =>
    (value: ValidationTargets[Target]) => {
        try {
            return validator(value) as ReturnType<V>;
        } catch (error) {
            if (error instanceof ApplicationError) {
                throw error.asHttpException(400);
            }
            throw error;
        }
    };
