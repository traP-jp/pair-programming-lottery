import { ProcessErrorMessages } from "@server/error/messages";

export interface GetEnvOptions<Fallback> {
    readonly fallback?: Fallback;
}

export const getEnv = <Fallback = string>(
    name: string,
    { fallback = "" as Fallback }: GetEnvOptions<Fallback> = {}
) => {
    const value = process.env[name] ?? fallback;

    if (!value) {
        throw ProcessErrorMessages.ENV_VAR_REQUIRED(name);
    }

    return value;
};
