import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
import Sitemap from "vite-plugin-sitemap";

export default defineConfig({
  plugins: [
    Sitemap({
      hostname: "https://nmhss.onrender.com",
      dynamicRoutes: [
        "/",
        "/about-us",
        "/gallery",
        "/students",
        "/students-upload",
        "/about-teachers",
        "/sports-champions",
        "/academic-results",
        "/arts-science",
      ],
      outDir: "dist/public",
    }),

    react(),
    runtimeErrorOverlay(),

    ...(process.env.NODE_ENV !== "production" && process.env.REPL_ID !== undefined
      ? [await import("@replit/vite-plugin-cartographer").then(m => m.cartographer())]
      : []),
  ],

  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets"),
    },
  },

  root: path.resolve(import.meta.dirname, "client"),

  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
    chunkSizeWarningLimit: 1600, // Suppress warning for vendor
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules")) {
            if (id.includes("lucide-react")) return "icons";
            if (id.includes("@tanstack")) return "query";
            if (id.includes("aos")) return "aos";
            if (id.includes("react-helmet-async")) return "helmet";
            return "vendor";
          }
        },
      },
    },
  },

  server: {
    fs: {
      strict: true,
      deny: ["**/.*"],
    },
  },
});
