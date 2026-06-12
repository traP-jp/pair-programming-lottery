export type Invocable = (...args_: unknown[]) => unknown;
export type Callable<args_ extends unknown[]> = (...args_: args_) => unknown;
export type Function_<R> = (...args_: unknown[]) => R;

export const isString = (value: unknown): value is string => {
    return typeof value === "string";
};

export const isBoolean = (value: unknown): value is boolean => {
    return typeof value === "boolean";
};

export const isNumber = (value: unknown): value is number => {
    return typeof value === "number";
};
