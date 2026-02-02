// PERFORMANCE MONITORING - Client-Side Performance Tracking
// Provides comprehensive performance monitoring and metrics collection
// Updated: 2025-01-09 - Added performance monitoring utilities

import { logger } from "./logger";

// Performance API type extensions
interface PerformanceEventTiming extends PerformanceEntry {
  processingStart: number;
}

interface LayoutShiftEntry extends PerformanceEntry {
  hadRecentInput: boolean;
  value: number;
}

interface NetworkInformation {
  effectiveType: string;
  downlink: number;
  rtt: number;
  saveData: boolean;
}

interface NavigatorWithConnection extends Navigator {
  connection?: NetworkInformation;
  mozConnection?: NetworkInformation;
  webkitConnection?: NetworkInformation;
}

interface PerformanceMetric {
  name: string;
  value: number;
  unit: string;
  timestamp: number;
  url: string;
  metadata?: Record<string, unknown>;
}

interface NavigationTiming {
  dns: number;
  tcp: number;
  ssl: number;
  ttfb: number; // Time to First Byte
  domLoad: number;
  domReady: number;
  windowLoad: number;
  total: number;
}

interface VitalMetrics {
  fcp?: number; // First Contentful Paint
  lcp?: number; // Largest Contentful Paint
  fid?: number; // First Input Delay
  cls?: number; // Cumulative Layout Shift
  ttfb?: number; // Time to First Byte
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private vitals: VitalMetrics = {};
  private observer?: PerformanceObserver;
  private isEnabled: boolean;

  constructor() {
    this.isEnabled = typeof window !== "undefined" && "performance" in window;

    if (this.isEnabled) {
      this.initializeMonitoring();
    }
  }

  private initializeMonitoring() {
    // Monitor navigation timing
    this.measureNavigationTiming();

    // Monitor Core Web Vitals
    this.measureWebVitals();

    // Monitor resource loading
    this.measureResourceTiming();

    // Monitor long tasks
    this.measureLongTasks();

    // Send metrics periodically
    this.startPeriodicReporting();
  }

  private measureNavigationTiming() {
    if (!window.performance?.timing) return;

    window.addEventListener("load", () => {
      setTimeout(() => {
        const timing = window.performance.timing;
        const navigationStart = timing.navigationStart;

        const metrics: NavigationTiming = {
          dns: timing.domainLookupEnd - timing.domainLookupStart,
          tcp: timing.connectEnd - timing.connectStart,
          ssl:
            timing.secureConnectionStart > 0
              ? timing.connectEnd - timing.secureConnectionStart
              : 0,
          ttfb: timing.responseStart - timing.requestStart,
          domLoad: timing.domContentLoadedEventEnd - navigationStart,
          domReady: timing.domComplete - navigationStart,
          windowLoad: timing.loadEventEnd - navigationStart,
          total: timing.loadEventEnd - navigationStart,
        };

        this.recordMetric("navigation_timing", metrics.total, "ms", {
          details: metrics,
        });

        logger.performance("Navigation Timing", metrics.total, metrics);
      }, 0);
    });
  }

  private measureWebVitals() {
    // First Contentful Paint
    this.observePerformanceEntry("paint", (entries) => {
      entries.forEach((entry) => {
        if (entry.name === "first-contentful-paint") {
          this.vitals.fcp = entry.startTime;
          this.recordMetric("fcp", entry.startTime, "ms");
        }
      });
    });

    // Largest Contentful Paint
    this.observePerformanceEntry("largest-contentful-paint", (entries) => {
      const lastEntry = entries[entries.length - 1];
      if (lastEntry) {
        this.vitals.lcp = lastEntry.startTime;
        this.recordMetric("lcp", lastEntry.startTime, "ms");
      }
    });

    // First Input Delay
    this.observePerformanceEntry("first-input", (entries) => {
      entries.forEach((entry) => {
        const firstInputEntry = entry as PerformanceEventTiming;
        const fid = firstInputEntry.processingStart - entry.startTime;
        this.vitals.fid = fid;
        this.recordMetric("fid", fid, "ms");
      });
    });

    // Cumulative Layout Shift
    let clsValue = 0;
    this.observePerformanceEntry("layout-shift", (entries) => {
      entries.forEach((entry) => {
        const layoutShiftEntry = entry as LayoutShiftEntry;
        if (!layoutShiftEntry.hadRecentInput) {
          clsValue += layoutShiftEntry.value;
        }
      });
      this.vitals.cls = clsValue;
      this.recordMetric("cls", clsValue, "score");
    });
  }

  private measureResourceTiming() {
    this.observePerformanceEntry("resource", (entries) => {
      entries.forEach((entry) => {
        const resourceEntry = entry as PerformanceResourceTiming;
        const duration = resourceEntry.responseEnd - entry.startTime;
        const size = resourceEntry.transferSize || 0;

        this.recordMetric("resource_load", duration, "ms", {
          name: entry.name,
          type: resourceEntry.initiatorType,
          size,
          cached:
            resourceEntry.transferSize === 0 &&
            resourceEntry.decodedBodySize > 0,
        });
      });
    });
  }

  private measureLongTasks() {
    this.observePerformanceEntry("longtask", (entries) => {
      entries.forEach((entry) => {
        this.recordMetric("long_task", entry.duration, "ms", {
          startTime: entry.startTime,
        });

        logger.warn("Long task detected", {
          duration: entry.duration,
          startTime: entry.startTime,
        });
      });
    });
  }

  private observePerformanceEntry(
    type: string,
    callback: (entries: PerformanceEntry[]) => void,
  ) {
    try {
      const observer = new PerformanceObserver((list) => {
        callback(list.getEntries());
      });
      observer.observe({ entryTypes: [type] });
    } catch (error) {
      logger.debug(`Performance observer for ${type} not supported`, error);
    }
  }

  private recordMetric(
    name: string,
    value: number,
    unit: string,
    metadata?: Record<string, unknown>,
  ) {
    const metric: PerformanceMetric = {
      name,
      value,
      unit,
      timestamp: Date.now(),
      url: window.location.href,
      metadata,
    };

    this.metrics.push(metric);

    // Keep only last 100 metrics to prevent memory issues
    if (this.metrics.length > 100) {
      this.metrics = this.metrics.slice(-100);
    }
  }

  private reportingInterval: ReturnType<typeof setInterval> | null = null;

  private startPeriodicReporting() {
    // Clear existing interval if any
    if (this.reportingInterval) {
      clearInterval(this.reportingInterval);
    }

    // Report metrics every 30 seconds
    this.reportingInterval = setInterval(() => {
      this.reportMetrics();
    }, 30000);

    // Report on page visibility change
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") {
        this.reportMetrics();
      }
    });

    // Report on page unload
    window.addEventListener("beforeunload", () => {
      this.reportMetrics();
      this.cleanup();
    });
  }

  private cleanup() {
    if (this.reportingInterval) {
      clearInterval(this.reportingInterval);
      this.reportingInterval = null;
    }
  }

  private async reportMetrics() {
    if (this.metrics.length === 0) return;

    const metricsToSend = [...this.metrics];
    this.metrics = [];

    try {
      await fetch("/api/metrics/performance", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          metrics: metricsToSend,
          vitals: this.vitals,
          userAgent: navigator.userAgent,
          viewport: {
            width: window.innerWidth,
            height: window.innerHeight,
          },
          connection: this.getConnectionInfo(),
        }),
      });
    } catch (error) {
      logger.error("Failed to report performance metrics", error);
      // Put metrics back if sending failed
      this.metrics.unshift(...metricsToSend.slice(-50)); // Keep only last 50
    }
  }

  private getConnectionInfo() {
    const nav = navigator as NavigatorWithConnection;
    const connection =
      nav.connection || nav.mozConnection || nav.webkitConnection;

    if (!connection) return null;

    return {
      effectiveType: connection.effectiveType,
      downlink: connection.downlink,
      rtt: connection.rtt,
      saveData: connection.saveData,
    };
  }

  // Public API
  public measureFunction<T>(name: string, fn: () => T): T {
    const start = performance.now();
    const result = fn();
    const duration = performance.now() - start;

    this.recordMetric(`function_${name}`, duration, "ms");
    logger.performance(`Function: ${name}`, duration);

    return result;
  }

  public async measureAsyncFunction<T>(
    name: string,
    fn: () => Promise<T>,
  ): Promise<T> {
    const start = performance.now();
    const result = await fn();
    const duration = performance.now() - start;

    this.recordMetric(`async_function_${name}`, duration, "ms");
    logger.performance(`Async Function: ${name}`, duration);

    return result;
  }

  public markStart(name: string) {
    performance.mark(`${name}_start`);
  }

  public markEnd(name: string) {
    performance.mark(`${name}_end`);
    performance.measure(name, `${name}_start`, `${name}_end`);

    const measure = performance.getEntriesByName(name, "measure")[0];
    if (measure) {
      this.recordMetric(`measure_${name}`, measure.duration, "ms");
      logger.performance(`Measure: ${name}`, measure.duration);
    }
  }

  public getVitals(): VitalMetrics {
    return { ...this.vitals };
  }

  public getMetrics(): PerformanceMetric[] {
    return [...this.metrics];
  }

  public forceReport() {
    this.reportMetrics();
  }
}

// Create singleton instance
export const performanceMonitor = new PerformanceMonitor();

// Export types
export type { PerformanceMetric, NavigationTiming, VitalMetrics };

// Utility functions
export const measure = {
  function: <T>(name: string, fn: () => T): T =>
    performanceMonitor.measureFunction(name, fn),
  async: <T>(name: string, fn: () => Promise<T>): Promise<T> =>
    performanceMonitor.measureAsyncFunction(name, fn),
  start: (name: string) => performanceMonitor.markStart(name),
  end: (name: string) => performanceMonitor.markEnd(name),
};
