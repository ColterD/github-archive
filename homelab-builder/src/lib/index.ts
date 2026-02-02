// CLIENT-SAFE LIBRARY EXPORTS ONLY
// Server-side exports moved to prevent client-side bundling

// Client-safe utilities
export { cn } from "./utils.js";

// UI components - client-safe
export * from "./components/ui/index.js";

// Client-side stores - browser-safe
export { themeStore, applyTheme, watchSystemTheme } from "./stores/theme.js";
export type { Theme } from "./stores/theme.js";

// NOTE: Server-side exports (db, cache, services) are NOT exported here
// to prevent them from being bundled in client-side JavaScript.
// Import them directly from their modules in server-side code only.
