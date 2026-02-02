// LOGGING SYSTEM - Enterprise-grade Structured Logging
// Provides centralized logging with performance monitoring and error tracking
// Updated: 2025-01-09 - Performance optimization and cleanup

/* eslint-disable @typescript-eslint/no-explicit-any -- Flexible logging system requires any types */

import { env } from "$env/dynamic/private";

export type LogLevel = "debug" | "info" | "warn" | "error" | "fatal";

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: Record<string, any>;
  error?: Error;
  requestId?: string;
  userId?: string;
  duration?: number;
}

// Log level hierarchy
const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
  fatal: 4,
};

// Get current log level from environment
const currentLogLevel =
  (env.LOG_LEVEL as LogLevel) ||
  (env.NODE_ENV === "production" ? "info" : "debug");

class Logger {
  private minLevel: number;

  constructor(minLevel: LogLevel = currentLogLevel) {
    this.minLevel = LOG_LEVELS[minLevel];
  }

  private shouldLog(level: LogLevel): boolean {
    return LOG_LEVELS[level] >= this.minLevel;
  }

  private formatLogEntry(entry: LogEntry): string {
    const {
      timestamp,
      level,
      message,
      context,
      error,
      requestId,
      userId,
      duration,
    } = entry;

    const parts = [
      `[${timestamp}]`,
      `[${level.toUpperCase()}]`,
      requestId ? `[${requestId}]` : "",
      userId ? `[user:${userId}]` : "",
      message,
      duration ? `(${duration}ms)` : "",
      context ? JSON.stringify(context) : "",
      error ? `\n${error.stack}` : "",
    ].filter(Boolean);

    return parts.join(" ");
  }

  private log(
    level: LogLevel,
    message: string,
    context?: Record<string, unknown>,
    error?: Error,
  ): void {
    if (!this.shouldLog(level)) return;

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context,
      error,
    };

    const formatted = this.formatLogEntry(entry);

    // Use appropriate console method based on level
    switch (level) {
      case "debug":
        console.debug(formatted);
        break;
      case "info":
        console.info(formatted);
        break;
      case "warn":
        console.warn(formatted);
        break;
      case "error":
      case "fatal":
        console.error(formatted);
        break;
    }

    // In production, you might want to send to external logging service
    if (env.NODE_ENV === "production" && level === "error") {
      this.sendToExternalService(entry);
    }
  }

  private async sendToExternalService(entry: LogEntry): Promise<void> {
    // Placeholder for external logging service integration
    // Could integrate with services like Sentry, LogRocket, etc.
    try {
      // Example: Sentry error reporting
      if (env.SENTRY_DSN && entry.error) {
        // Implementation would go here
      }
    } catch (error) {
      // Fallback to console if external service fails
      console.error("Failed to send log to external service:", error);
    }
  }

  debug(message: string, context?: Record<string, unknown>): void {
    this.log("debug", message, context);
  }

  info(message: string, context?: Record<string, unknown>): void {
    this.log("info", message, context);
  }

  warn(message: string, context?: Record<string, unknown>): void {
    this.log("warn", message, context);
  }

  error(
    message: string,
    error?: Error,
    context?: Record<string, unknown>,
  ): void {
    this.log("error", message, context, error);
  }

  fatal(
    message: string,
    error?: Error,
    context?: Record<string, unknown>,
  ): void {
    this.log("fatal", message, context, error);
  }

  // Performance monitoring
  time(label: string): () => void {
    const start = Date.now();
    return () => {
      const duration = Date.now() - start;
      this.debug(`Timer: ${label}`, { duration });
    };
  }

  // Request logging
  request(
    method: string,
    url: string,
    context?: Record<string, unknown>,
  ): void {
    this.info(`${method} ${url}`, context);
  }

  // Database query logging
  query(
    query: string,
    duration: number,
    context?: Record<string, unknown>,
  ): void {
    const level = duration > 100 ? "warn" : "debug";
    this.log(level, `Query: ${query}`, { ...context, duration });
  }

  // Cache operation logging
  cache(operation: string, key: string, hit: boolean, duration?: number): void {
    this.debug(`Cache ${operation}: ${key}`, { hit, duration });
  }

  // Authentication logging
  auth(
    event: string,
    userId?: string,
    context?: Record<string, unknown>,
  ): void {
    this.info(`Auth: ${event}`, { userId, ...context });
  }

  // Security logging
  security(event: string, context?: Record<string, unknown>): void {
    this.warn(`Security: ${event}`, context);
  }
}

// Create singleton logger instance
export const logger = new Logger();

// Performance monitoring decorator
export function withLogging<T extends (...args: unknown[]) => unknown>(
  fn: T,
  name?: string,
): T {
  const functionName = name || fn.name || "anonymous";

  return ((...args: Parameters<T>) => {
    const timer = logger.time(functionName);

    try {
      const result = fn(...args);

      // Handle promises
      if (
        result &&
        typeof result === "object" &&
        "then" in result &&
        typeof result.then === "function"
      ) {
        return (result as Promise<unknown>)
          .then((value: unknown) => {
            timer();
            return value;
          })
          .catch((error: unknown) => {
            timer();
            logger.error(`Function ${functionName} failed`, error as Error);
            throw error;
          });
      }

      timer();
      return result;
    } catch (error) {
      timer();
      logger.error(`Function ${functionName} failed`, error as Error);
      throw error;
    }
  }) as T;
}

// Request context middleware
export function createRequestLogger(requestId: string, userId?: string) {
  return {
    debug: (message: string, context?: Record<string, unknown>) =>
      logger.debug(message, { requestId, userId, ...context }),
    info: (message: string, context?: Record<string, unknown>) =>
      logger.info(message, { requestId, userId, ...context }),
    warn: (message: string, context?: Record<string, unknown>) =>
      logger.warn(message, { requestId, userId, ...context }),
    error: (
      message: string,
      error?: Error,
      context?: Record<string, unknown>,
    ) => logger.error(message, error, { requestId, userId, ...context }),
    fatal: (
      message: string,
      error?: Error,
      context?: Record<string, unknown>,
    ) => logger.fatal(message, error, { requestId, userId, ...context }),
  };
}

// Export logger as default
export default logger;
