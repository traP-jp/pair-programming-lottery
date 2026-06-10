import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
    plugins: [react()],
    resolve: {
        tsconfigPaths: true,
    },
    server: {
        port: 5173,
        proxy: {
            "/api": {
                target: process.env.VITE_API_TARGET ?? "http://localhost:3000",
                changeOrigin: true,
                headers: {
                    "X-Forwarded-User": "uni_kakurenbo",
                },
            },
        },
        watch: {
            usePolling: true,
        },
    },
});
