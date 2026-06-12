import cssPlugin from "@eslint/css";
import js from "@eslint/js";
import eslintConfigPrettier from "eslint-config-prettier";
import eslintPluginJsonc from "eslint-plugin-jsonc";
import reactPlugin from "eslint-plugin-react";
import reactHooksPlugin from "eslint-plugin-react-hooks";
import eslintPluginUnicorn from "eslint-plugin-unicorn";
import globals from "globals";
import tseslint from "typescript-eslint";

export default tseslint.config(
    {
        // Global ignores
        ignores: [
            "**/dist/**",
            "**/node_modules/**",
            "**/.tsbuildinfo",
            "**/generated/**",
            "**/prisma/migrations/**",
            "**/vite.config.ts.timestamp-*",
        ],
    },
    js.configs.recommended,
    ...tseslint.configs.recommended,
    {
        files: ["**/*.{ts,tsx}"],
        languageOptions: {
            parser: tseslint.parser,
            parserOptions: {
                ecmaVersion: "latest",
                sourceType: "module",
                project: ["./tsconfig.json", "./client/tsconfig.json", "./server/tsconfig.json"],
                tsconfigRootDir: import.meta.dirname,
            },
            globals: {
                ...globals.browser,
                ...globals.node,
            },
        },
        plugins: {
            js,
            unicorn: eslintPluginUnicorn,
        },
        rules: {
            "unicorn/no-array-reduce": "off",
            "unicorn/filename-case": [
                "error",
                {
                    cases: {
                        pascalCase: true,
                        camelCase: true,
                    },
                    ignore: [String.raw`vite-env\.d\.ts`],
                },
            ],
            "unicorn/no-null": "off",
            "unicorn/prevent-abbreviations": [
                "error",
                {
                    replacements: {
                        env: false,
                        "vite-env": false,
                        args: false,
                        res: false,
                        props: false,
                        Props: false,
                        params: false,
                    },
                },
            ],
            "unicorn/consistent-compound-words": [
                "error",
                {
                    replacements: {
                        userName: false,
                    },
                },
            ],
            "@typescript-eslint/no-unused-vars": [
                "warn",
                {
                    argsIgnorePattern: "^_",
                    varsIgnorePattern: "^_",
                },
            ],
        },
    },
    // React config for client-side files
    {
        files: ["client/**/*.{ts,tsx}"],
        plugins: {
            react: reactPlugin,
            "react-hooks": reactHooksPlugin,
        },
        languageOptions: {
            parserOptions: {
                ecmaFeatures: {
                    jsx: true,
                },
            },
        },
        rules: {
            ...reactPlugin.configs.recommended.rules,
            ...reactHooksPlugin.configs.recommended.rules,
            "react/react-in-jsx-scope": "off",
        },
        settings: {
            react: {
                version: "detect",
            },
        },
    },
    // CSS config
    {
        files: ["**/*.css"],
        language: "css/css",
        ...cssPlugin.configs.recommended,
        rules: {
            "no-irregular-whitespace": "off",
        },
    },
    // JSON config
    {
        files: ["**/*.json", "**/*.jsonc"],
        plugins: {
            jsonc: eslintPluginJsonc,
        },
    },
    ...eslintPluginJsonc.configs["flat/prettier"],
    {
        files: ["**/*.test.{ts,tsx}"],
        rules: {
            "@typescript-eslint/no-explicit-any": "off",
            "unicorn/prevent-abbreviations": "off",
            "@typescript-eslint/no-unused-vars": "off",
        },
    },
    eslintConfigPrettier
);
