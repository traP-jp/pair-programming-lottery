import { isDate } from "node:util/types";
import { invoke, type ApplicationErrorGenerator } from "@server/error/builders";
import { ValidationErrorMessages } from "@server/error/messages";
import {
    isBoolean,
    isNumber,
    isString,
    type Fn,
} from "@server/utilities/types";
import type { ApplicationError } from "@server/error/structure";

export const assert = (expression: boolean, error: ApplicationError) => {
    if (!expression) throw error;
};

export const required = <T>(
    validate: (value: unknown) => boolean,
    generator: ApplicationErrorGenerator,
) => {
    return (value: Record<string, unknown>, property: string): T => {
        const v = value[property] as any;

        if (v === undefined || v === null || v === "")
            throw ValidationErrorMessages.PROPERTY_REQUIRED(property);
        assert(validate(v), invoke(generator, property));

        return v;
    };
};

export const requireString = required<string>(
    isString,
    ValidationErrorMessages.PROPERTY_MUST_BE_STRING,
);

export const requireNumber = required<number>(
    isNumber,
    ValidationErrorMessages.PROPERTY_MUST_BE_NUMBER,
);

export const requireBoolean = required<boolean>(
    isBoolean,
    ValidationErrorMessages.PROPERTY_MUST_BE_BOOLEAN,
);

export const requireDate = (value: any, property: string) => {
    const date = (() => {
        try {
            return new Date(requireString(value, property));
        } catch (error) {
            throw ValidationErrorMessages.PROPERTY_MUST_BE_DATE(property);
        }
    })();

    assert(
        isDate(date),
        ValidationErrorMessages.PROPERTY_MUST_BE_DATE(property),
    );

    return date;
};
