import { type ComponentType, type LazyExoticComponent, createElement, lazy } from "react";

interface Module<T> {
    default: T;
}

export function preloadedLazy<P extends object>(factory: () => Promise<Module<ComponentType<P>>>) {
    type T = ComponentType<P>;

    let resolved: T | null = null;
    let promise: Promise<Module<T>> | null = null;

    const load = () => {
        if (!promise) {
            promise = factory().then(m => {
                resolved = m.default;
                return m;
            });
        }
        return promise;
    };

    const LazyComponent = lazy(load);

    const Component = (props: P) => {
        if (resolved) {
            return createElement(resolved, props);
        }
        return createElement(LazyComponent, props);
    };

    Component.preload = load;
    return Component as unknown as LazyExoticComponent<T> & {
        preload: () => Promise<Module<T>>;
    };
}
