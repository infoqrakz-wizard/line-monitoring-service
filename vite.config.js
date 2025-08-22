import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath, URL } from "node:url";
import svgr from "vite-plugin-svgr";
export default defineConfig({
    plugins: [react(), svgr()],
    resolve: {
        alias: {
            "@": fileURLToPath(new URL("./src", import.meta.url)),
        },
    },
    server: {
        port: 5173,
        proxy: {
            // Auth endpoints
            "/api/auth": {
                target: "http://localhost:4000",
                changeOrigin: true,
            },
            // REST
            "/api/servers": {
                target: "http://localhost:4000",
                changeOrigin: true,
            },
            // WS
            "/ws": {
                target: "ws://localhost:4000",
                ws: true,
                changeOrigin: true,
            },
        },
    },
});
