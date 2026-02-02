// PERFORMANCE METRICS API - Client Performance Data Collection
// Collects and processes client-side performance metrics
// Updated: 2025-01-09 - Added performance metrics collection endpoint

import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { logger } from "$lib/server/logger";
import { z } from "zod";
import { rateLimit } from "$lib/server/rate-limit";

// Validation schemas
const performanceMetricSchema = z.object({
  name: z.string().min(1).max(100),
  value: z.number().min(0),
  unit: z.string().min(1).max(20),
  timestamp: z.number(),
  url: z.string().url(),
  metadata: z.record(z.string(), z.any()).optional(),
});

const vitalMetricsSchema = z.object({
  fcp: z.number().optional(), // First Contentful Paint
  lcp: z.number().optional(), // Largest Contentful Paint
  fid: z.number().optional(), // First Input Delay
  cls: z.number().optional(), // Cumulative Layout Shift
  ttfb: z.number().optional(), // Time to First Byte
});

const connectionInfoSchema = z
  .object({
    effectiveType: z.string().optional(),
    downlink: z.number().optional(),
    rtt: z.number().optional(),
    saveData: z.boolean().optional(),
  })
  .optional();

const viewportSchema = z.object({
  width: z.number(),
  height: z.number(),
});

const performanceReportSchema = z.object({
  metrics: z.array(performanceMetricSchema).max(100),
  vitals: vitalMetricsSchema,
  userAgent: z.string().max(500),
  viewport: viewportSchema,
  connection: connectionInfoSchema,
});

export const POST: RequestHandler = async ({ request, getClientAddress }) => {
  try {
    // Rate limiting for performance metrics
    const clientIP = getClientAddress();
    const rateLimitResult = await rateLimit({
      key: `performance-metrics:${clientIP}`,
      limit: 60, // 60 requests per minute
      window: 60 * 1000, // 1 minute
    });

    if (!rateLimitResult.success) {
      logger.warn("Performance metrics rate limit exceeded", {
        clientIP,
        remaining: rateLimitResult.remaining,
      });
      return json({ error: "Rate limit exceeded" }, { status: 429 });
    }

    // Parse and validate request body
    const body = await request.json();
    const report = performanceReportSchema.parse(body);

    // Process performance metrics
    const processedMetrics = await processPerformanceMetrics(report, clientIP);

    // Log aggregated performance data
    logger.info("Performance metrics received", {
      clientIP,
      metricsCount: report.metrics.length,
      vitals: report.vitals,
      viewport: report.viewport,
      connection: report.connection,
      userAgent: report.userAgent.substring(0, 100), // Truncate for logging
      summary: processedMetrics.summary,
    });

    // Check for performance issues
    const issues = detectPerformanceIssues(report);
    if (issues.length > 0) {
      logger.warn("Performance issues detected", {
        clientIP,
        issues,
        vitals: report.vitals,
      });
    }

    return json({
      success: true,
      processed: report.metrics.length,
      issues: issues.length,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      logger.warn("Invalid performance metrics format");
      logger.info("Client IP", { clientIP: getClientAddress() });
      return json(
        { error: "Invalid request format", details: error.issues },
        { status: 400 },
      );
    }

    logger.error("Performance metrics processing failed", error as Error);
    logger.info("Client IP", { clientIP: getClientAddress() });

    return json({ error: "Internal server error" }, { status: 500 });
  }
};

// Process and analyze performance metrics
async function processPerformanceMetrics(
  report: z.infer<typeof performanceReportSchema>,
  clientIP: string,
) {
  const { metrics, vitals } = report;

  // Log for debugging (ensures variables are used)
  logger.debug('Processing metrics for client', { clientIP, vitals });

  // Group metrics by type
  const metricsByType = metrics.reduce(
    (acc, metric) => {
      if (!acc[metric.name]) {
        acc[metric.name] = [];
      }
      acc[metric.name].push(metric.value);
      return acc;
    },
    {} as Record<string, number[]>,
  );

  // Calculate statistics for each metric type
  const summary = Object.entries(metricsByType).map(([name, values]) => {
    const sorted = values.sort((a, b) => a - b);
    return {
      name,
      count: values.length,
      min: Math.min(...values),
      max: Math.max(...values),
      avg: values.reduce((sum, val) => sum + val, 0) / values.length,
      p50: sorted[Math.floor(sorted.length * 0.5)],
      p95: sorted[Math.floor(sorted.length * 0.95)],
      p99: sorted[Math.floor(sorted.length * 0.99)],
    };
  });

  // Store metrics for analytics (could be database, time-series DB, etc.)
  // await storeMetricsForAnalytics(report, clientIP, summary);

  return { summary };
}

// Detect performance issues based on Web Vitals and other metrics
function detectPerformanceIssues(
  report: z.infer<typeof performanceReportSchema>,
): string[] {
  const issues: string[] = [];
  const { vitals, metrics } = report;

  // Check Core Web Vitals thresholds
  if (vitals.fcp && vitals.fcp > 1800) {
    issues.push(
      `Slow First Contentful Paint: ${Math.round(vitals.fcp)}ms (should be < 1.8s)`,
    );
  }

  if (vitals.lcp && vitals.lcp > 2500) {
    issues.push(
      `Slow Largest Contentful Paint: ${Math.round(vitals.lcp)}ms (should be < 2.5s)`,
    );
  }

  if (vitals.fid && vitals.fid > 100) {
    issues.push(
      `High First Input Delay: ${Math.round(vitals.fid)}ms (should be < 100ms)`,
    );
  }

  if (vitals.cls && vitals.cls > 0.1) {
    issues.push(
      `High Cumulative Layout Shift: ${vitals.cls.toFixed(3)} (should be < 0.1)`,
    );
  }

  if (vitals.ttfb && vitals.ttfb > 800) {
    issues.push(
      `Slow Time to First Byte: ${Math.round(vitals.ttfb)}ms (should be < 800ms)`,
    );
  }

  // Check for long tasks
  const longTasks = metrics.filter((m) => m.name === "long_task");
  if (longTasks.length > 0) {
    const maxLongTask = Math.max(...longTasks.map((t) => t.value));
    issues.push(
      `Long tasks detected: ${longTasks.length} tasks, max duration: ${Math.round(maxLongTask)}ms`,
    );
  }

  // Check for slow resource loading
  const slowResources = metrics.filter(
    (m) => m.name === "resource_load" && m.value > 3000,
  );
  if (slowResources.length > 0) {
    issues.push(
      `Slow resource loading: ${slowResources.length} resources took > 3s`,
    );
  }

  // Check navigation timing
  const navigationMetrics = metrics.filter(
    (m) => m.name === "navigation_timing",
  );
  if (navigationMetrics.length > 0) {
    const slowNavigation = navigationMetrics.filter((m) => m.value > 5000);
    if (slowNavigation.length > 0) {
      issues.push(
        `Slow page load: ${Math.round(slowNavigation[0].value)}ms (should be < 5s)`,
      );
    }
  }

  return issues;
}

// Health check and configuration endpoint
export const GET: RequestHandler = async () => {
  return json({
    service: "performance-metrics",
    status: "operational",
    timestamp: new Date().toISOString(),
    limits: {
      rateLimit: "60 requests per minute",
      maxMetricsPerBatch: 100,
    },
    thresholds: {
      webVitals: {
        fcp: { good: 1800, poor: 3000, unit: "ms" },
        lcp: { good: 2500, poor: 4000, unit: "ms" },
        fid: { good: 100, poor: 300, unit: "ms" },
        cls: { good: 0.1, poor: 0.25, unit: "score" },
        ttfb: { good: 800, poor: 1800, unit: "ms" },
      },
      other: {
        longTask: { threshold: 50, unit: "ms" },
        resourceLoad: { slow: 3000, unit: "ms" },
        navigationTiming: { slow: 5000, unit: "ms" },
      },
    },
    supportedMetrics: [
      "fcp",
      "lcp",
      "fid",
      "cls",
      "ttfb",
      "navigation_timing",
      "resource_load",
      "long_task",
      "function_*",
      "async_function_*",
      "measure_*",
    ],
  });
};
