import { mergeConfig } from "vite";
import { defineConfig } from "vitest/config";

import viteConfig from "./vite.config";

const resolvedViteConfig =
    typeof viteConfig === "function"
        ? viteConfig({ command: "serve", mode: "test", isPreview: false, isSsrBuild: false })
        : viteConfig;

export default mergeConfig(
    resolvedViteConfig,
    defineConfig({
        test: {
            globals: true,
            environment: "jsdom",
            setupFiles: "./src/setupTest.ts",
            coverage: {
                provider: "v8",
                reporter: ["text", "html"],
                include: ["src/**/*.{ts,tsx}"],
                exclude: ["src/main.tsx", "src/vite-env.d.ts"],
            },
        },
    })
);
