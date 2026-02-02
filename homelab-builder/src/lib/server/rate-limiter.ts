// Rate limiting service for API endpoints
import { RateLimiterMemory } from "rate-limiter-flexible";
import { dev } from "$app/environment";

// Different rate limits for different types of requests
export const rateLimiters = {
  // General API requests: 100 requests per 15 minutes
  api: new RateLimiterMemory({
    points: dev ? 1000 : 100, // More lenient in development
    duration: 15 * 60, // 15 minutes
    blockDuration: 5 * 60, // Block for 5 minutes
  }),

  // Authentication requests: 5 attempts per 15 minutes
  auth: new RateLimiterMemory({
    points: dev ? 50 : 5, // More lenient in development
    duration: 15 * 60,
    blockDuration: 15 * 60, // Block for 15 minutes
  }),

  // Search requests: 30 requests per minute
  search: new RateLimiterMemory({
    points: dev ? 300 : 30, // More lenient in development
    duration: 60, // 1 minute
    blockDuration: 60, // Block for 1 minute
  }),

  // Form submissions: 10 requests per 5 minutes
  form: new RateLimiterMemory({
    points: dev ? 100 : 10, // More lenient in development
    duration: 5 * 60,
    blockDuration: 10 * 60, // Block for 10 minutes
  }),
};

export function getRateLimiterForPath(pathname: string): RateLimiterMemory {
  if (pathname.startsWith("/api/auth/")) {
    return rateLimiters.auth;
  }
  if (pathname.startsWith("/api/search/")) {
    return rateLimiters.search;
  }
  if (pathname.includes("/api/")) {
    return rateLimiters.api;
  }
  // Default to form rate limiter for form actions
  return rateLimiters.form;
}

export function getClientIP(request: Request): string {
  // Try to get real IP from headers (for reverse proxies)
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }

  const realIP = request.headers.get("x-real-ip");
  if (realIP) {
    return realIP;
  }

  // Fallback to connection IP (may not be available in all environments)
  return "unknown";
}
