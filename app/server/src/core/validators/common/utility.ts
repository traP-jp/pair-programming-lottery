import { isDate } from "node:util/types";

import { type ApplicationErrorGenerator, invoke } from "@server/error/builders";
import { ValidationErrorMessages } from "@server/error/messages";
import type { ApplicationError } from "@server/error/structure";
import { isBoolean, isNumber, isString } from "@server/utilities/types";

export const assert = (expression: boolean, error: ApplicationError) => {
    if (!expression) throw error;
};

export const required = <T>(
    validate: (value: unknown) => boolean,
    generator: ApplicationErrorGenerator
) => {
    return (value: Record<string, unknown>, property: string): T => {
        const v = value[property] as T;

        if ([undefined, null, ""].includes(v as unknown as string | null | undefined))
            throw ValidationErrorMessages.PROPERTY_REQUIRED(property);
        assert(validate(v), invoke(generator, property));

        return v;
    };
};

export const requireString = required<string>(
    isString,
    ValidationErrorMessages.PROPERTY_MUST_BE_STRING
);

export const requireNumber = required<number>(
    isNumber,
    ValidationErrorMessages.PROPERTY_MUST_BE_NUMBER
);

export const requireBoolean = required<boolean>(
    isBoolean,
    ValidationErrorMessages.PROPERTY_MUST_BE_BOOLEAN
);

export const requireDate = (value: Record<string, unknown>, property: string) => {
    const date = (() => {
        try {
            return new Date(requireString(value, property));
        } catch {
            throw ValidationErrorMessages.PROPERTY_MUST_BE_DATE(property);
        }
    })();

    assert(
        isDate(date) && !isNaN(date.getTime()),
        ValidationErrorMessages.PROPERTY_MUST_BE_DATE(property)
    );

    return date;
};
