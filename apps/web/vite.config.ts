import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const apiOrigin = process.env.STOCKWISE_API_ORIGIN ?? "http://localhost:3001";
const webPort = Number(process.env.STOCKWISE_WEB_PORT ?? 5173);

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: webPort,
    strictPort: process.env.STOCKWISE_WEB_PORT !== undefined,
    proxy: {
      "/api": {
        target: apiOrigin,
        changeOrigin: true,
      },
      "/health": {
        target: apiOrigin,
        changeOrigin: true,
      },
    },
  },
});
