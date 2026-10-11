import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

// TrailMate AI is a fully client-side, offline-first app. There is no backend.
// The service worker caches the application shell so the UI loads with no network.
// The local LLM weights are cached separately by WebLLM (browser Cache API).
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      injectRegister: "auto",
      includeAssets: [
        "favicon.svg",
        "icons/apple-touch-icon.png",
        "icons/icon-192.png",
        "icons/icon-512.png",
        "icons/icon-maskable-512.png",
      ],
      manifest: {
        id: "/",
        name: "TrailMate AI",
        short_name: "TrailMate",
        description:
          "Offline-first outdoor mission companion powered by local in-browser AI. No backend, no cloud AI.",
        lang: "en",
        dir: "ltr",
        categories: ["health", "lifestyle", "outdoors", "productivity"],
        theme_color: "#1f5136",
        background_color: "#f6f1e4",
        display: "standalone",
        display_override: ["standalone", "minimal-ui"],
        orientation: "portrait",
        start_url: ".",
        scope: ".",
        prefer_related_applications: false,
        icons: [
          {
            src: "icons/icon-192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "icons/icon-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "icons/icon-maskable-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
      workbox: {
        // The WebLLM runtime chunk is large; allow it into the precache so the
        // app shell (including the AI glue code) is available offline.
        maximumFileSizeToCacheInBytes: 25 * 1024 * 1024,
        globPatterns: ["**/*.{js,css,html,svg,png,ico,woff2}"],
        navigateFallback: "index.html",
        cleanupOutdatedCaches: true,
        clientsClaim: true,
      },
      devOptions: {
        enabled: false,
      },
    }),
  ],
  worker: {
    format: "es",
  },
  build: {
    target: "es2022",
    chunkSizeWarningLimit: 8000,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("@mlc-ai/web-llm")) return "webllm";
          if (id.includes("node_modules/react") || id.includes("node_modules/scheduler"))
            return "react";
          return undefined;
        },
      },
    },
  },
});
