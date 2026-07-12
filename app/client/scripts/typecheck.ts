import { $ } from "bun";

async function main() {
    console.log("Starting client typecheck...");

    await Promise.all([
        $`bunx --bun tsc --noEmit --skipLibCheck false`,
        $`bunx --bun tsc -p tsconfig.server.json --noEmit --skipLibCheck false`,
        $`bunx --bun tsc -p src/sw/tsconfig.json --noEmit`,
    ]);

    console.log("Client typecheck complete.");
}

await main();
