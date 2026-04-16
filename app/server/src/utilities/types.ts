export type Invocable = (...args: any[]) => any;
export type Callable<Args extends unknown[]> = (...args: Args) => any;
export type Fn<R> = (...args: any[]) => R;

export const isString = (value: unknown): value is string => {
    return typeof value === "string";
};

export const isBoolean = (value: unknown): value is boolean => {
    return typeof value === "boolean";
};

export const isNumber = (value: unknown): value is number => {
    return typeof value === "number";
};
