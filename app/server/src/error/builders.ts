import { ApplicationError } from "@server/error/structure";
import { isString } from "@server/utilities/types";

export const buildApplicationErrorMessage = (message: string) =>
    new ApplicationError(`Application Error: ${message}`);

export const buildApiErrorMessage = (message: string) =>
    buildApplicationErrorMessage(`API Error: ${message}`);

export const buildValidationErrorMessage = (message: string) =>
    buildApiErrorMessage(`Validation Error: ${message}`);

export const buildProcessErrorMessage = (message: string) =>
    buildApplicationErrorMessage(`Process Error: ${message}`);

type Builder = (message: string) => ApplicationError;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ErrorSeed = (...args_: any[]) => string;
type ErrorSource = string | ErrorSeed;
type ErrorSources = Record<string, ErrorSource>;

export const applyBuilder = <Ss extends ErrorSources>(builder: Builder, sources: Ss) => {
    type ApplyReturn<G extends ErrorSource> = G extends string
        ? ReturnType<typeof builder>
        : G extends (...args_: infer P) => string
          ? (...args_: P) => ReturnType<typeof builder>
          : never;

    function apply<S extends ErrorSource>(source: S): ApplyReturn<S> {
        if (isString(source)) return builder(source) as ApplyReturn<S>;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return ((...args_: any[]) => builder(source(...args_))) as ApplyReturn<S>;
    }

    type Result = {
        [key in keyof Ss]: ReturnType<typeof apply<Ss[key]>>;
    };

    return Object.entries(sources).reduce(
        (object, [name, generator]) => Object.assign(object, { [name]: apply(generator) }),
        {} as Result
    );
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ApplicationErrorGenerator = (...args_: any[]) => ApplicationError;

export const invoke = <G extends ApplicationErrorGenerator | ApplicationError>(
    error: G,
    ...args_: G extends ApplicationErrorGenerator ? Parameters<G> : never
) => {
    if (error instanceof ApplicationError) {
        return error;
    }

    return error(...args_);
};
