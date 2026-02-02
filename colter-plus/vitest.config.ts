import { defineConfig } from 'vitest/config';
import Vue from '@vitejs/plugin-vue';
import { fileURLToPath } from 'url';

export default defineConfig({
  plugins: [Vue()],
  test: {
    globals: true,
    environment: 'happy-dom',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['**/node_modules/**', '**/dist/**', '**/tests/**'],
    },
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./docs', import.meta.url)),
      '@theme': fileURLToPath(new URL('./docs/.vitepress/theme', import.meta.url)),
      '@components': fileURLToPath(new URL('./docs/.vitepress/theme/components', import.meta.url)),
      '@composables': fileURLToPath(new URL('./docs/.vitepress/theme/composables', import.meta.url)),
      '@utils': fileURLToPath(new URL('./docs/.vitepress/theme/utils', import.meta.url)),
      '@styles': fileURLToPath(new URL('./docs/.vitepress/theme/styles', import.meta.url)),
      '@config': fileURLToPath(new URL('./docs/.vitepress/config', import.meta.url)),
    },
  },
});