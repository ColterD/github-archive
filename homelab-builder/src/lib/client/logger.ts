// CLIENT-SIDE LOGGER - Enhanced Frontend Logging
// Provides structured logging for client-side operations
// Updated: 2025-01-09 - Added comprehensive client logging

type LogLevel = "debug" | "info" | "warn" | "error";

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  url: string;
  userAgent: string;
  data?: unknown;
  stack?: string;
}

class ClientLogger {
  private isDevelopment: boolean;
  private logBuffer: LogEntry[] = [];
  private maxBufferSize = 100;
  private flushInterval = 30000; // 30 seconds
  private flushTimer?: number;

  constructor() {
    this.isDevelopment = import.meta.env.DEV;
    this.startPeriodicFlush();
  }

  private createLogEntry(
    level: LogLevel,
    message: string,
    data?: unknown,
    error?: Error,
  ): LogEntry {
    return {
      level,
      message,
      timestamp: new Date().toISOString(),
      url: window.location.href,
      userAgent: navigator.userAgent,
      data,
      stack: error?.stack,
    };
  }

  private addToBuffer(entry: LogEntry) {
    this.logBuffer.push(entry);

    // Keep buffer size manageable
    if (this.logBuffer.length > this.maxBufferSize) {
      this.logBuffer = this.logBuffer.slice(-this.maxBufferSize);
    }

    // Flush immediately for errors in production
    if (entry.level === "error" && !this.isDevelopment) {
      this.flush();
    }
  }

  private startPeriodicFlush() {
    if (typeof window !== "undefined") {
      this.flushTimer = window.setInterval(() => {
        this.flush();
      }, this.flushInterval);
    }
  }

  private async flush() {
    if (this.logBuffer.length === 0) return;

    const logsToSend = [...this.logBuffer];
    this.logBuffer = [];

    try {
      await fetch("/api/logs/client", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ logs: logsToSend }),
      });
    } catch (error) {
      // If sending fails, put logs back in buffer (but don't create infinite loop)
      if (this.logBuffer.length < this.maxBufferSize / 2) {
        this.logBuffer.unshift(...logsToSend.slice(-10)); // Keep only last 10
      }
      console.warn("Failed to send logs to server:", error);
    }
  }

  debug(message: string, data?: unknown) {
    const entry = this.createLogEntry("debug", message, data);

    if (this.isDevelopment) {
      console.debug(`[DEBUG] ${message}`, data);
    }

    this.addToBuffer(entry);
  }

  info(message: string, data?: unknown) {
    const entry = this.createLogEntry("info", message, data);

    if (this.isDevelopment) {
      console.info(`[INFO] ${message}`, data);
    }

    this.addToBuffer(entry);
  }

  warn(message: string, data?: unknown) {
    const entry = this.createLogEntry("warn", message, data);

    if (this.isDevelopment) {
      console.warn(`[WARN] ${message}`, data);
    }

    this.addToBuffer(entry);
  }

  error(message: string, error?: Error | unknown, data?: unknown) {
    const errorObj = error instanceof Error ? error : new Error(String(error));
    const entry = this.createLogEntry("error", message, data, errorObj);

    // Always log errors to console
    console.error(`[ERROR] ${message}`, errorObj, data);

    this.addToBuffer(entry);
  }

  // Performance logging
  performance(name: string, duration: number, data?: unknown) {
    this.info(`Performance: ${name}`, {
      duration,
      ...((data as object) || {}),
    });
  }

  // User interaction logging
  userAction(action: string, data?: unknown) {
    this.info(`User Action: ${action}`, data);
  }

  // API call logging
  apiCall(
    method: string,
    url: string,
    duration: number,
    status: number,
    data?: unknown,
  ) {
    const level = status >= 400 ? "error" : status >= 300 ? "warn" : "info";
    const entry = this.createLogEntry(level, `API ${method} ${url}`, {
      method,
      url,
      duration,
      status,
      ...((data as object) || {}),
    });

    if (this.isDevelopment) {
      console.log(`[API] ${method} ${url} - ${status} (${duration}ms)`, data);
    }

    this.addToBuffer(entry);
  }

  // Manual flush
  async flushNow() {
    await this.flush();
  }

  // Cleanup
  destroy() {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }
    this.flush(); // Final flush
  }
}

// Create singleton instance
export const logger = new ClientLogger();

// Cleanup on page unload
if (typeof window !== "undefined") {
  window.addEventListener("beforeunload", () => {
    logger.destroy();
  });

  // Also flush on visibility change (when user switches tabs)
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") {
      logger.flushNow();
    }
  });
}

// Export types for use in other files
export type { LogLevel, LogEntry };
