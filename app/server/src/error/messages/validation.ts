import { applyBuilder, buildValidationErrorMessage } from "@server/error/builders";

export default applyBuilder(buildValidationErrorMessage, {
    PROPERTY_REQUIRED: (name: string) => `property "${name}" is required.`,
    PROPERTY_MUST_BE_STRING: (name: string) =>
        `property "${name}" must be a string.`,
    PROPERTY_MUST_BE_NUMBER: (name: string) =>
        `property "${name}" must be a number.`,
    PROPERTY_MUST_BE_BOOLEAN: (name: string) =>
        `property "${name}" must be a boolean.`,
    PROPERTY_MUST_BE_ARRAY: (name: string) =>
        `property "${name}" must be an array.`,
    PROPERTY_MUST_BE_OBJECT: (name: string) =>
        `property "${name}" must be an object.`,
    PROPERTY_MUST_BE_DATE: (name: string) =>
        `property "${name}" must be an date string.`,
});
