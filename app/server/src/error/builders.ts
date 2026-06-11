import { isString } from "@server/utilities/types";
import { ApplicationError } from "@server/error/structure";

export const buildApplicationErrorMessage = (message: string) =>
    new ApplicationError(`Application Error: ${message}`);

export const buildApiErrorMessage = (message: string) =>
    buildApplicationErrorMessage(`API Error: ${message}`);

export const buildValidationErrorMessage = (message: string) =>
    buildApiErrorMessage(`Validation Error: ${message}`);

export const buildProcessErrorMessage = (message: string) =>
    buildApplicationErrorMessage(`Process Error: ${message}`);

type Builder = (message: string) => ApplicationError;

type ErrorSeed = (...args: any[]) => string;
type ErrorSource = string | ErrorSeed;
type ErrorSources = Record<string, ErrorSource>;

export const applyBuilder = <Ss extends ErrorSources>(
    builder: Builder,
    sources: Ss,
) => {
    type ApplyReturn<G extends ErrorSource> = G extends string
        ? ReturnType<typeof builder>
        : G extends (...args: infer P) => string
          ? (...args: P) => ReturnType<typeof builder>
          : never;

    function apply<S extends ErrorSource>(source: S): ApplyReturn<S> {
        if (isString(source)) return builder(source) as ApplyReturn<S>;
        return ((...args: any[]) => builder(source(...args))) as ApplyReturn<S>;
    }

    type Result = {
        [key in keyof Ss]: ReturnType<typeof apply<Ss[key]>>;
    };

    return Object.entries(sources).reduce(
        (object, [name, generator]) =>
            Object.assign(object, { [name]: apply(generator) }),
        {} as Result,
    );
};

export type ApplicationErrorGenerator = (...args: any[]) => ApplicationError;

export const invoke = <G extends ApplicationErrorGenerator | ApplicationError>(
    error: G,
    ...args: G extends ApplicationErrorGenerator ? Parameters<G> : never
) => {
    if (error instanceof ApplicationError) {
        return error;
    }

    return error(...args);
};
