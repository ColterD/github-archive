import { sveltekit } from "@sveltejs/kit/vite";
import { defineConfig } from "vite";
import { visualizer } from "rollup-plugin-visualizer";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [
    sveltekit(),
    visualizer({
      filename: ".svelte-kit/output/client/bundle-analysis.html",
      open: false,
      gzipSize: true,
      brotliSize: true,
    }),
    tailwindcss(),
  ],

  build: {
    // Enable source maps for production debugging
    sourcemap: true,
    // Minimize CSS
    cssMinify: true,
    // Set a reasonable chunk size warning limit
    chunkSizeWarningLimit: 1000,
    // Use modern target for better performance
    target: "esnext",
    minify: "esbuild",
    rollupOptions: {
      treeshake: {
        moduleSideEffects: false,
        propertyReadSideEffects: false,
        tryCatchDeoptimization: false,
      },
      output: {
        // Let Vite handle chunking automatically to avoid conflicts with externalized modules
      },
    },
  },
  optimizeDeps: {
    // Exclude server-only packages from optimization
    include: [
      // Pre-bundle commonly used icons to improve tree-shaking
      "lucide-svelte/icons/sun",
      "lucide-svelte/icons/moon",
      "lucide-svelte/icons/monitor",
      "lucide-svelte/icons/user",
      "lucide-svelte/icons/log-out",
      "lucide-svelte/icons/search",
      "lucide-svelte/icons/server",
    ],
    exclude: [
      "@prisma/client",
      "@prisma/engines",
      "bcrypt",
      "resend",
      "ioredis",
      "redis",
      "sharp",
      "meilisearch",
      "ws",
      "bull",
    ],
  },
  ssr: {
    // Don't externalize these in SSR (keep them bundled for SSR)
    noExternal: ["lucide-svelte"],
    // Externalize server-only packages in SSR
    external: [
      "@prisma/client",
      "@prisma/engines",
      "bcrypt",
      "sharp",
      "ioredis",
      "redis",
      "ws",
      "bull",
      "meilisearch",
      "helmet",
      "rate-limiter-flexible",
    ],
  },
  server: {
    port: 5173,
    host: true,
  },
});
