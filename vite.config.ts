import react, { reactCompilerPreset } from "@vitejs/plugin-react";
import babel from "@rolldown/plugin-babel";
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  resolve: {
    tsconfigPaths: true,
  },
  plugins: [
    react(),
    babel({ presets: [reactCompilerPreset()] }),
    VitePWA({
      registerType: "autoUpdate",
      manifest: {
        name: "Cordilink",
        description: "Incident reporting application",
        theme_color: "#ffffff",
        background_color: "#ffffff",
        display: "standalone",
        icons: [
          {
            src: "pwa-192x192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "pwa-512x512.png",
            sizes: "512x512",
            type: "image/png",
          },
          {
            src: "pwa-512x512-maskable.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },

      devOptions: {
        enabled: true, // 👈 This forces the service worker to run on localhost
        type: "development",
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff,woff2}"],
        runtimeCaching: [
          {
            // Matches any request going to your supabase instance
            urlPattern: /^https:\/\/.*\.supabase\.co\/.*$/,
            handler: "NetworkOnly",
            options: {
              backgroundSync: {
                name: "supabase-retry-queue", // Optional: retries requests when back online
              },
            },
          },
        ],
      },
    }),
  ],
});
