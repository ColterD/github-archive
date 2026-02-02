import "@testing-library/jest-dom";
import { vi } from "vitest";

// Mock environment variables
vi.mock("$env/dynamic/private", () => ({
  env: {
    DATABASE_URL: "postgresql://test:test@localhost:5432/test",
    AUTH_SECRET: "test-secret",
    REDIS_URL: "redis://localhost:6379",
  },
}));

// Mock SvelteKit stores
vi.mock("$app/stores", () => ({
  page: {
    subscribe: vi.fn(),
  },
  updated: {
    subscribe: vi.fn(),
  },
}));

// Mock SvelteKit navigation
vi.mock("$app/navigation", () => ({
  goto: vi.fn(),
  invalidate: vi.fn(),
  invalidateAll: vi.fn(),
  preloadData: vi.fn(),
  preloadCode: vi.fn(),
  beforeNavigate: vi.fn(),
  afterNavigate: vi.fn(),
}));

// Global test utilities
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock fetch
global.fetch = vi.fn();
