// Vite Performance Configuration for Production Builds
// Optimized for 2025 web performance standards

import { sveltekit } from "@sveltejs/kit/vite";
import { defineConfig } from "vite";
import { visualizer } from "rollup-plugin-visualizer";

export default defineConfig({
  plugins: [
    sveltekit(),
    // Bundle analyzer for performance optimization
    visualizer({
      filename: "./dist/bundle-analysis.html",
      open: true,
      gzipSize: true,
      brotliSize: true,
    }),
  ],

  build: {
    // Modern build optimizations
    target: "esnext",
    minify: "esbuild",
    cssMinify: "esbuild",

    // Chunking strategy for optimal loading
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunk for stable caching
          vendor: ["svelte", "@sveltejs/kit"],

          // UI library chunk
          ui: ["lucide-svelte", "clsx", "tailwind-merge"],

          // Database and API chunk
          data: ["@prisma/client", "zod"],

          // Authentication chunk
          auth: ["@auth/sveltekit", "@auth/prisma-adapter"],

          // Utilities chunk
          utils: ["date-fns", "nanoid"],

          // Charts and visualization (lazy loaded)
          charts: ["chart.js", "chartjs-adapter-date-fns"],
        },

        // Optimize chunk names for caching
        chunkFileNames: (chunkInfo) => {
          if (chunkInfo.name === "vendor") {
            return "assets/vendor.[hash].js";
          }
          return "assets/[name].[hash].js";
        },

        // Asset naming for optimal caching
        assetFileNames: (assetInfo) => {
          if (assetInfo.name?.endsWith(".css")) {
            return "assets/[name].[hash].css";
          }
          return "assets/[name].[hash][extname]";
        },
      },
    },

    // Performance optimizations
    reportCompressedSize: true,
    chunkSizeWarningLimit: 1000, // 1MB warning threshold

    // Source map configuration for production
    sourcemap: process.env.NODE_ENV === "development",
  },

  // Optimization settings
  optimizeDeps: {
    include: [
      "lucide-svelte",
      "@prisma/client",
      "clsx",
      "tailwind-merge",
      "date-fns",
      "zod",
    ],
    exclude: [
      // Large libraries that should be loaded on demand
      "chart.js",
      "@sentry/sveltekit",
    ],
  },

  // CSS optimization
  css: {
    devSourcemap: true,
    preprocessorOptions: {
      scss: {
        additionalData: '@import "$lib/styles/variables.scss";',
      },
    },
  },

  // Asset optimization
  assetsInclude: ["**/*.woff2", "**/*.woff"],

  // Server configuration for development
  server: {
    port: 5173,
    strictPort: true,
    host: true, // Allow external connections

    // HMR optimization
    hmr: {
      overlay: true,
    },

    // Proxy configuration for API calls during development
    proxy: {
      "/api/external": {
        target: "https://api.external-service.com",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/external/, ""),
      },
    },
  },

  // Preview server configuration
  preview: {
    port: 4173,
    strictPort: true,
    host: true,
  },

  // Environment variables configuration
  define: {
    __BUILD_DATE__: JSON.stringify(new Date().toISOString()),
    __BUILD_VERSION__: JSON.stringify(process.env.npm_package_version),
  },

  // Worker configuration for background tasks
  worker: {
    format: "es",
    plugins: [],
  },
});
