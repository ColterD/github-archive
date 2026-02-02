// HOMELAB HARDWARE PLATFORM - SERVER HOOKS
// Authentication, security, and performance optimization

import { sequence } from "@sveltejs/kit/hooks";
import { handle as authHandle } from "./auth";
import type { Handle } from "@sveltejs/kit";
import { logger } from "$lib/server/logger";
import { websocketService } from "$lib/server/websocket.js";
import { getRateLimiterForPath, getClientIP } from "$lib/server/rate-limiter";
import { securityHeaders } from "$lib/server/security-headers";
import { error } from "@sveltejs/kit";

// Rate limiting middleware
const rateLimitHandle: Handle = async ({ event, resolve }) => {
  // Skip rate limiting for static assets and in development for certain paths
  if (
    event.url.pathname.startsWith("/_app/") ||
    event.url.pathname.startsWith("/favicon") ||
    event.url.pathname.startsWith("/robots.txt")
  ) {
    return resolve(event);
  }

  const clientIP = getClientIP(event.request);
  const rateLimiter = getRateLimiterForPath(event.url.pathname);

  try {
    await rateLimiter.consume(clientIP);
    return resolve(event);
  } catch (rateLimiterRes: unknown) {
    // Rate limit exceeded
    const secs =
      Math.round(
        ((rateLimiterRes as { msBeforeNext?: number })?.msBeforeNext || 60000) /
          1000,
      ) || 1;

    logger.warn(
      `Rate limit exceeded for ${clientIP} on ${event.url.pathname}`,
      {
        ip: clientIP,
        path: event.url.pathname,
        retryAfter: secs,
      },
    );

    // Return 429 Too Many Requests
    throw error(429, `Too many requests. Please try again in ${secs} seconds.`);
  }
};

// Enhanced security headers are now handled by the securityHeaders middleware

// WebSocket initialization middleware
let wsInitialized = false;
const websocketHandle: Handle = async ({ event, resolve }) => {
  // Initialize WebSocket server on first request (when HTTP server is available)
  if (!wsInitialized && event.platform && "server" in event.platform) {
    try {
      websocketService.initialize(
        event.platform.server as unknown as import("http").Server,
      );
      wsInitialized = true;
      logger.info("WebSocket server initialized via hooks");
    } catch (error) {
      logger.error("Failed to initialize WebSocket server:", error as Error);
    }
  }

  // Add WebSocket service to locals for access in routes
  event.locals.websocket = websocketService;

  const response = await resolve(event);
  return response;
};

// Performance monitoring middleware
const performanceHandle: Handle = async ({ event, resolve }) => {
  const start = Date.now();
  const response = await resolve(event);
  const duration = Date.now() - start;

  // Log slow requests
  if (duration > 1000) {
    logger.warn(`Slow request: ${event.url.pathname} took ${duration}ms`, {
      path: event.url.pathname,
      method: event.request.method,
      duration,
    });
  }

  // Add performance timing header
  response.headers.set("X-Response-Time", `${duration}ms`);

  return response;
};

// Combine all handles in sequence
export const handle = sequence(
  rateLimitHandle,
  authHandle,
  websocketHandle,
  securityHeaders, // Enhanced security headers with CSP nonces
  performanceHandle,
);

// Graceful shutdown
process.on("SIGTERM", () => {
  logger.info("SIGTERM received, shutting down WebSocket server...");
  websocketService.shutdown();
});

process.on("SIGINT", () => {
  logger.info("SIGINT received, shutting down WebSocket server...");
  websocketService.shutdown();
});
