// ENVIRONMENT VARIABLE VALIDATION - Enterprise Security
// Validates all required environment variables at startup
// Updated: 2025-01-09 - Added comprehensive validation

import { z } from "zod";
import { logger } from "./logger.js";

// Type for SvelteKit build context
interface SvelteKitGlobal {
  __sveltekit_build?: boolean;
}

// Check if we're in build mode - enhanced detection for CI/CD environments
const isBuildTime =
  process.env.NODE_ENV === undefined ||
  process.argv.includes("build") ||
  process.env.BUILDING === "true" ||
  process.env.CI === "true" ||
  process.env.GITHUB_ACTIONS === "true" ||
  process.env.VERCEL === "1" ||
  process.env.NETLIFY === "true" ||
  process.argv.some((arg) => arg.includes("vite") && arg.includes("build")) ||
  process.argv.some((arg) => arg.includes("svelte-kit")) ||
  // Check if we're in a SvelteKit build context
  (typeof globalThis !== "undefined" &&
    (globalThis as SvelteKitGlobal).__sveltekit_build === true);

// Environment variable schema with conditional validation
const envSchema = z.object({
  // Database
  DATABASE_URL: isBuildTime
    ? z.string().optional()
    : z.string().url("DATABASE_URL must be a valid URL"),

  // Authentication
  AUTH_SECRET: isBuildTime
    ? z.string().optional()
    : z.string().min(32, "AUTH_SECRET must be at least 32 characters"),

  // OAuth Providers
  GITHUB_CLIENT_ID: isBuildTime
    ? z.string().optional()
    : z.string().min(1, "GITHUB_CLIENT_ID is required"),
  GITHUB_CLIENT_SECRET: isBuildTime
    ? z.string().optional()
    : z.string().min(1, "GITHUB_CLIENT_SECRET is required"),
  GOOGLE_CLIENT_ID: isBuildTime
    ? z.string().optional()
    : z.string().min(1, "GOOGLE_CLIENT_ID is required"),
  GOOGLE_CLIENT_SECRET: isBuildTime
    ? z.string().optional()
    : z.string().min(1, "GOOGLE_CLIENT_SECRET is required"),

  // Application
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  ORIGIN: z.string().url().optional(),

  // External Services (Optional)
  RESEND_API_KEY: z.string().optional(),
  MEILISEARCH_HOST: z.string().url().optional(),
  REDIS_URL: z.string().url().optional(),
  RATE_LIMIT_REDIS_URL: z.string().url().optional(),

  // Security
  CONTENT_SECURITY_POLICY_NONCE_SECRET: z.string().min(32).optional(),

  // Monitoring (Optional)
  SENTRY_DSN: z.string().url().optional(),

  // File Upload (Optional)
  UPLOADTHING_SECRET: z.string().optional(),
  UPLOADTHING_APP_ID: z.string().optional(),

  // Analytics (Optional)
  PLAUSIBLE_API_KEY: z.string().optional(),
  PLAUSIBLE_DOMAIN: z.string().optional(),

  // Admin Settings (Optional)
  ADMIN_EMAIL: z.string().email().optional(),
  ADMIN_PASSWORD: z.string().min(8).optional(),

  // Cloud Services (Optional)
  CLOUDFLARE_ACCOUNT_ID: z.string().optional(),
  CLOUDFLARE_API_TOKEN: z.string().optional(),

  // E-commerce (Optional)
  EBAY_CLIENT_ID: z.string().optional(),
  EBAY_CLIENT_SECRET: z.string().optional(),
});

// Validate environment variables
function validateEnv() {
  try {
    const result = envSchema.safeParse(process.env);

    if (!result.success) {
      // During build time, provide default values for missing required variables
      if (isBuildTime) {
        console.log(
          "[BUILD] Build time detected, using default environment values",
        );
        return {
          DATABASE_URL:
            process.env.DATABASE_URL || "postgresql://localhost:5432/homelab",
          AUTH_SECRET:
            process.env.AUTH_SECRET || "build-time-secret-32-characters-long",
          GITHUB_CLIENT_ID:
            process.env.GITHUB_CLIENT_ID || "build-github-client-id",
          GITHUB_CLIENT_SECRET:
            process.env.GITHUB_CLIENT_SECRET || "build-github-client-secret",
          GOOGLE_CLIENT_ID:
            process.env.GOOGLE_CLIENT_ID || "build-google-client-id",
          GOOGLE_CLIENT_SECRET:
            process.env.GOOGLE_CLIENT_SECRET || "build-google-client-secret",
          NODE_ENV: process.env.NODE_ENV || "development",
          ORIGIN: process.env.ORIGIN,
          RESEND_API_KEY: process.env.RESEND_API_KEY,
          MEILISEARCH_HOST: process.env.MEILISEARCH_HOST,
          REDIS_URL: process.env.REDIS_URL,
          RATE_LIMIT_REDIS_URL: process.env.RATE_LIMIT_REDIS_URL,
          CONTENT_SECURITY_POLICY_NONCE_SECRET:
            process.env.CONTENT_SECURITY_POLICY_NONCE_SECRET,
          SENTRY_DSN: process.env.SENTRY_DSN,
          UPLOADTHING_SECRET: process.env.UPLOADTHING_SECRET,
          UPLOADTHING_APP_ID: process.env.UPLOADTHING_APP_ID,
          PLAUSIBLE_API_KEY: process.env.PLAUSIBLE_API_KEY,
          PLAUSIBLE_DOMAIN: process.env.PLAUSIBLE_DOMAIN,
          ADMIN_EMAIL: process.env.ADMIN_EMAIL,
          ADMIN_PASSWORD: process.env.ADMIN_PASSWORD,
          CLOUDFLARE_ACCOUNT_ID: process.env.CLOUDFLARE_ACCOUNT_ID,
          CLOUDFLARE_API_TOKEN: process.env.CLOUDFLARE_API_TOKEN,
          EBAY_CLIENT_ID: process.env.EBAY_CLIENT_ID,
          EBAY_CLIENT_SECRET: process.env.EBAY_CLIENT_SECRET,
        } as BuildTimeEnv;
      }

      logger.error("Environment validation failed", undefined, {
        errors: result.error.issues,
      });

      // Log specific missing variables
      result.error.issues.forEach((issue) => {
        logger.error(
          `Environment variable error: ${issue.path.join(".")} - ${issue.message}`,
        );
      });

      throw new Error("Invalid environment configuration");
    }

    logger.info("Environment validation successful", {
      nodeEnv: result.data.NODE_ENV,
      hasDatabase: !!result.data.DATABASE_URL,
      hasAuth: !!result.data.AUTH_SECRET,
      hasGitHub: !!(
        result.data.GITHUB_CLIENT_ID && result.data.GITHUB_CLIENT_SECRET
      ),
      hasGoogle: !!(
        result.data.GOOGLE_CLIENT_ID && result.data.GOOGLE_CLIENT_SECRET
      ),
    });

    return result.data;
  } catch (error) {
    // During build time, don't exit the process and provide safe defaults
    if (isBuildTime) {
      console.log(
        "[BUILD] Environment validation failed during build, using safe defaults",
      );
      return {
        DATABASE_URL: "postgresql://localhost:5432/homelab",
        AUTH_SECRET: "build-time-secret-32-characters-long",
        GITHUB_CLIENT_ID: "build-github-client-id",
        GITHUB_CLIENT_SECRET: "build-github-client-secret",
        GOOGLE_CLIENT_ID: "build-google-client-id",
        GOOGLE_CLIENT_SECRET: "build-google-client-secret",
        NODE_ENV: "development",
        ORIGIN: undefined,
        RESEND_API_KEY: undefined,
        MEILISEARCH_HOST: undefined,
        REDIS_URL: undefined,
        RATE_LIMIT_REDIS_URL: undefined,
        CONTENT_SECURITY_POLICY_NONCE_SECRET: undefined,
        SENTRY_DSN: undefined,
        UPLOADTHING_SECRET: undefined,
        UPLOADTHING_APP_ID: undefined,
        PLAUSIBLE_API_KEY: undefined,
        PLAUSIBLE_DOMAIN: undefined,
        ADMIN_EMAIL: undefined,
        ADMIN_PASSWORD: undefined,
        CLOUDFLARE_ACCOUNT_ID: undefined,
        CLOUDFLARE_API_TOKEN: undefined,
        EBAY_CLIENT_ID: undefined,
        EBAY_CLIENT_SECRET: undefined,
      } as BuildTimeEnv;
    }
    logger.fatal("Failed to validate environment variables", error as Error);
    process.exit(1);
  }
}

// Export validated environment variables
export const env = validateEnv();

// Helper function to check if we're in production
export const isProduction = env.NODE_ENV === "production";
export const isDevelopment = env.NODE_ENV === "development";
export const isTest = env.NODE_ENV === "test";

// Helper function to get optional environment variables safely
export function getOptionalEnv(key: keyof typeof env): string | undefined {
  return env[key] as string | undefined;
}

// Helper function to require environment variables at runtime
export function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    logger.error(`Required environment variable missing: ${key}`);
    throw new Error(`Environment variable ${key} is required`);
  }
  return value;
}

// Export type for TypeScript
export type Env = z.infer<typeof envSchema>;

// Build-time environment type
type BuildTimeEnv = {
  DATABASE_URL: string;
  AUTH_SECRET: string;
  GITHUB_CLIENT_ID: string;
  GITHUB_CLIENT_SECRET: string;
  GOOGLE_CLIENT_ID: string;
  GOOGLE_CLIENT_SECRET: string;
  NODE_ENV: string;
  ORIGIN?: string;
  RESEND_API_KEY?: string;
  MEILISEARCH_HOST?: string;
  REDIS_URL?: string;
  RATE_LIMIT_REDIS_URL?: string;
  CONTENT_SECURITY_POLICY_NONCE_SECRET?: string;
  SENTRY_DSN?: string;
  UPLOADTHING_SECRET?: string;
  UPLOADTHING_APP_ID?: string;
  PLAUSIBLE_API_KEY?: string;
  PLAUSIBLE_DOMAIN?: string;
  ADMIN_EMAIL?: string;
  ADMIN_PASSWORD?: string;
  CLOUDFLARE_ACCOUNT_ID?: string;
  CLOUDFLARE_API_TOKEN?: string;
  EBAY_CLIENT_ID?: string;
  EBAY_CLIENT_SECRET?: string;
};
