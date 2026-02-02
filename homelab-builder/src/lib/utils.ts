import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import type { HTMLAttributes } from "svelte/elements";

// Type utility for Svelte components with HTML element refs
export type WithElementRef<
  T extends keyof HTMLElementTagNameMap,
  P = Record<string, never>,
> = P & HTMLAttributes<HTMLElementTagNameMap[T]>;

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Remove diacritics
    .replace(/[^a-z0-9\s-]/g, "") // Remove special chars but keep spaces and hyphens
    .replace(/\s+/g, "-") // Replace spaces with hyphens
    .replace(/-+/g, "-") // Replace multiple hyphens with single
    .replace(/^-+|-+$/g, ""); // Remove leading/trailing hyphens
}

// Currency formatting
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

// Backward compatibility alias
export const formatPrice = formatCurrency;

// Date formatting
export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  if (isNaN(d.getTime())) {
    return "Invalid Date";
  }
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(d);
}

export function formatRelativeTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - d.getTime()) / 1000);

  if (diffInSeconds < 60) return "just now";
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 2592000)
    return `${Math.floor(diffInSeconds / 86400)}d ago`;

  return formatDate(d);
}

// Number formatting
export function formatNumber(num: number): string {
  return new Intl.NumberFormat("en-US").format(num);
}

// Performance utilities for enterprise search
export function debounce<T extends (...args: never[]) => unknown>(
  func: T,
  delay: number,
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
}

export function throttle<T extends (...args: never[]) => unknown>(
  func: T,
  delay: number,
): (...args: Parameters<T>) => void {
  let lastCall = 0;
  return (...args: Parameters<T>) => {
    const now = Date.now();
    if (now - lastCall >= delay) {
      lastCall = now;
      func(...args);
    }
  };
}

// Safe JSON parsing
export function safeJsonParse<T>(jsonString: string): T | null {
  try {
    return JSON.parse(jsonString) as T;
  } catch {
    return null;
  }
}

// Local storage helpers with error handling
export function getFromStorage<T>(key: string): T | null {
  if (typeof window === "undefined") return null;

  try {
    const item = window.localStorage.getItem(key);
    return item ? safeJsonParse<T>(item) : null;
  } catch {
    return null;
  }
}

export function setToStorage<T>(key: string, value: T): void {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage might be full or disabled, silently fail
  }
}

// Text highlighting for search results - XSS safe
export function highlightText(text: string, searchTerm: string): string {
  if (!searchTerm) return text;

  // Escape special regex characters to prevent ReDoS and injection
  const escapedTerm = searchTerm.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(`(${escapedTerm})`, "gi");

  // Escape HTML entities in both text and search term to prevent XSS
  const escapeHtml = (str: string) =>
    str.replace(/[&<>"']/g, (match) => {
      const escapeMap: Record<string, string> = {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      };
      return escapeMap[match];
    });

  const escapedText = escapeHtml(text);
  return escapedText.replace(regex, "<mark>$1</mark>");
}

// Performance measurement utilities
export function measure<T>(_name: string, fn: () => T): T {
  if (typeof performance === "undefined") return fn();

  // Performance measurement variables intentionally unused in production
  performance.now();
  const result = fn();
  performance.now();

  // Performance logging removed for production
  return result;
}

export async function measureAsync<T>(
  _name: string,
  fn: () => Promise<T>,
): Promise<T> {
  if (typeof performance === "undefined") return await fn();

  // Performance measurement variables intentionally unused in production
  performance.now();
  const result = await fn();
  performance.now();

  // Performance logging removed for production
  return result;
}
