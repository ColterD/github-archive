// THEME STORE - Centralized Theme Management
// Provides reactive theme state with localStorage persistence
// Updated: 2025-01-09 - Performance optimization and cleanup

import { writable } from "svelte/store";
import { browser } from "$app/environment";

export type Theme = "light" | "dark" | "system";

// Theme store with localStorage persistence
function createThemeStore() {
  const { subscribe, set, update } = writable<Theme>("system");

  return {
    subscribe,

    // Initialize theme from localStorage
    init: () => {
      if (browser) {
        const savedTheme = localStorage.getItem("theme") as Theme | null;
        if (savedTheme && ["light", "dark", "system"].includes(savedTheme)) {
          set(savedTheme);
        }
      }
    },

    // Set theme and persist to localStorage
    setTheme: (newTheme: Theme) => {
      if (browser) {
        localStorage.setItem("theme", newTheme);
      }
      set(newTheme);
    },

    // Toggle through themes in order
    toggle: () => {
      update((currentTheme) => {
        const themes: Theme[] = ["light", "dark", "system"];
        const currentIndex = themes.indexOf(currentTheme);
        const nextTheme = themes[(currentIndex + 1) % themes.length];

        if (browser) {
          localStorage.setItem("theme", nextTheme);
        }

        return nextTheme;
      });
    },
  };
}

export const themeStore = createThemeStore();

// Reactive computed value for actual theme (resolves 'system' to light/dark)
export const resolvedTheme = writable<"light" | "dark">("light");

// Apply theme to document
export function applyTheme(theme: Theme) {
  if (!browser) return;

  const root = document.documentElement;
  const isDark =
    theme === "dark" ||
    (theme === "system" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches);

  root.classList.toggle("dark", isDark);
  resolvedTheme.set(isDark ? "dark" : "light");
}

// Listen for system theme changes
export function watchSystemTheme() {
  if (!browser) return;

  const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

  const handleChange = () => {
    themeStore.subscribe((theme) => {
      if (theme === "system") {
        applyTheme("system");
      }
    })();
  };

  mediaQuery.addEventListener("change", handleChange);

  // Cleanup function
  return () => {
    mediaQuery.removeEventListener("change", handleChange);
  };
}

// Theme icon mapping for UI
export const themeIcons = {
  light: "sun",
  dark: "moon",
  system: "monitor",
} as const;

// Theme display names
export const themeLabels = {
  light: "Light",
  dark: "Dark",
  system: "System",
} as const;
