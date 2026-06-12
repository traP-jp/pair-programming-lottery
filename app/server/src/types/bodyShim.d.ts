/* eslint-disable @typescript-eslint/no-explicit-any */
interface Body {
    readonly body: any;
    readonly bodyUsed: boolean;
    arrayBuffer(): Promise<any>;
    blob(): Promise<any>;
    formData(): Promise<any>;
    json(): Promise<any>;
    text(): Promise<string>;
}
