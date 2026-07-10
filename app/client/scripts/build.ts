import { $ } from "bun";

async function main() {
    console.log("Starting client build...");

    console.log("Running TypeScript builds and checks...");
    await Promise.all([
        $`bunx --bun tsc -b`,
        $`bunx --bun tsc -p tsconfig.server.json --noEmit`,
        $`bunx --bun tsc -p tsconfig.sw.json --noEmit`,
    ]);

    console.log("Running Vite builds...");
    await Promise.all([
        $`bunx --bun vite build`,
        $`bunx --bun vite build --ssr src/entryServer.tsx`,
    ]);

    console.log("Running Bun builds for SW and Server...");
    await Promise.all([
        $`bun build src/sw.ts --outfile dist/client/sw.js --target browser`,
        $`bun build src/server.ts --outdir dist/server --target bun`,
    ]);

    console.log("Client build complete.");
}

await main();
