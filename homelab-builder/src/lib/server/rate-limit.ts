// Rate limiting utility function
// Provides a simplified interface for rate limiting API endpoints

import { RateLimiterMemory } from "rate-limiter-flexible";
import { dev } from "$app/environment";

interface RateLimitOptions {
  key: string;
  limit: number;
  window: number; // in milliseconds
}

interface RateLimitResult {
  success: boolean;
  remaining: number;
  resetTime?: number;
}

// Cache for rate limiters to avoid creating new instances
const rateLimiterCache = new Map<string, RateLimiterMemory>();

/**
 * Rate limiting function that creates or reuses rate limiters based on the key pattern
 */
export async function rateLimit(
  options: RateLimitOptions,
): Promise<RateLimitResult> {
  const { key, limit, window } = options;

  // Create a cache key based on the limit and window to reuse rate limiters
  const cacheKey = `${limit}-${window}`;

  let rateLimiter = rateLimiterCache.get(cacheKey);

  if (!rateLimiter) {
    rateLimiter = new RateLimiterMemory({
      points: dev ? limit * 10 : limit, // More lenient in development
      duration: Math.floor(window / 1000), // Convert to seconds
      blockDuration: Math.floor(window / 1000), // Block for the same duration
    });
    rateLimiterCache.set(cacheKey, rateLimiter);
  }

  try {
    const result = await rateLimiter.consume(key);
    return {
      success: true,
      remaining: result.remainingPoints || 0,
      resetTime: result.msBeforeNext
        ? Date.now() + result.msBeforeNext
        : undefined,
    };
  } catch (rateLimiterRes: unknown) {
    return {
      success: false,
      remaining: 0,
      resetTime: (rateLimiterRes as { msBeforeNext?: number })?.msBeforeNext
        ? Date.now() +
          (rateLimiterRes as { msBeforeNext?: number }).msBeforeNext!
        : undefined,
    };
  }
}
