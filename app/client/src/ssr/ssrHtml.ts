export function injectSsrHtml(template: string, appHtml: string, initialData: unknown) {
    const serializedData = JSON.stringify(initialData).replaceAll("<", "\\u003c");
    return template
        .replace("<!--ssr-outlet-->", appHtml)
        .replace("<!--ssr-data-script-->", `window.__INITIAL_DATA__ = ${serializedData};`);
}
