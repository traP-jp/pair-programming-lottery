import type { ValidationTargets } from "hono";
import { ApplicationError } from "../../../error/structure";

export const adaptor =
    <Target extends keyof ValidationTargets>(target: Target) =>
    <V extends (value: ValidationTargets[Target]) => any>(validator: V) =>
    (value: ValidationTargets[Target]): ReturnType<V> =>
        (() => {
            try {
                return validator(value);
            } catch (error) {
                if (error instanceof ApplicationError) {
                    throw error.asHttpException(400);
                }
            }
        })();
