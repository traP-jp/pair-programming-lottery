import { applyBuilder, buildProcessErrorMessage } from "../builders";

export default applyBuilder(buildProcessErrorMessage, {
    ENV_VAR_REQUIRED: (name: string) =>
        `environment variable "${name}" is required.`,
} as const);
