// HEALTH CHECK API - Enterprise Monitoring
// Provides comprehensive application health status
// Updated: 2025-01-09 - Added detailed health checks

import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { db } from "$lib/server/db";
import { logger } from "$lib/server/logger";
import { env } from "$lib/server/env";

interface HealthCheck {
  status: "healthy" | "degraded" | "unhealthy";
  timestamp: string;
  version: string;
  environment: string;
  uptime: number;
  checks: {
    database: HealthCheckResult;
    memory: HealthCheckResult;
    disk?: HealthCheckResult;
    external?: {
      redis?: HealthCheckResult;
      meilisearch?: HealthCheckResult;
    };
  };
}

interface HealthCheckResult {
  status: "pass" | "fail" | "warn";
  message: string;
  duration?: number;
  details?: Record<string, unknown>;
}

export const GET: RequestHandler = async () => {
  const startTime = Date.now();
  const timestamp = new Date().toISOString();

  try {
    // Database health check
    const dbCheck = await checkDatabase();

    // Memory health check
    const memoryCheck = checkMemory();

    // Determine overall status
    const checks = {
      database: dbCheck,
      memory: memoryCheck,
    };

    const hasFailures = Object.values(checks).some(
      (check) => check.status === "fail",
    );
    const hasWarnings = Object.values(checks).some(
      (check) => check.status === "warn",
    );

    const overallStatus: "healthy" | "degraded" | "unhealthy" = hasFailures
      ? "unhealthy"
      : hasWarnings
        ? "degraded"
        : "healthy";

    const healthCheck: HealthCheck = {
      status: overallStatus,
      timestamp,
      version: process.env.npm_package_version || "unknown",
      environment: env.NODE_ENV,
      uptime: process.uptime(),
      checks,
    };

    const duration = Date.now() - startTime;

    logger.info("Health check completed", {
      status: overallStatus,
      duration,
      checks: Object.fromEntries(
        Object.entries(checks).map(([key, value]) => [key, value.status]),
      ),
    });

    // Return appropriate HTTP status
    const httpStatus =
      overallStatus === "healthy"
        ? 200
        : overallStatus === "degraded"
          ? 200
          : 503;

    return json(healthCheck, { status: httpStatus });
  } catch (error) {
    logger.error("Health check failed", error as Error);

    const healthCheck: HealthCheck = {
      status: "unhealthy",
      timestamp,
      version: process.env.npm_package_version || "unknown",
      environment: env.NODE_ENV,
      uptime: process.uptime(),
      checks: {
        database: {
          status: "fail",
          message: "Health check system failure",
          details: { error: (error as Error).message },
        },
        memory: {
          status: "fail",
          message: "Unable to check memory",
        },
      },
    };

    return json(healthCheck, { status: 503 });
  }
};

async function checkDatabase(): Promise<HealthCheckResult> {
  const startTime = Date.now();

  try {
    // Simple database connectivity test
    await db.$queryRaw`SELECT 1`;

    const duration = Date.now() - startTime;

    return {
      status: duration > 1000 ? "warn" : "pass",
      message:
        duration > 1000 ? "Database responding slowly" : "Database connected",
      duration,
      details: {
        responseTime: `${duration}ms`,
      },
    };
  } catch (error) {
    return {
      status: "fail",
      message: "Database connection failed",
      duration: Date.now() - startTime,
      details: {
        error: (error as Error).message,
      },
    };
  }
}

function checkMemory(): HealthCheckResult {
  try {
    const memUsage = process.memoryUsage();
    const totalMB = Math.round(memUsage.rss / 1024 / 1024);
    const heapUsedMB = Math.round(memUsage.heapUsed / 1024 / 1024);
    const heapTotalMB = Math.round(memUsage.heapTotal / 1024 / 1024);

    // Warn if using more than 512MB RSS or heap usage > 80%
    const heapUsagePercent = (memUsage.heapUsed / memUsage.heapTotal) * 100;
    const isHighMemory = totalMB > 512 || heapUsagePercent > 80;

    return {
      status: isHighMemory ? "warn" : "pass",
      message: isHighMemory
        ? "High memory usage detected"
        : "Memory usage normal",
      details: {
        rss: `${totalMB}MB`,
        heapUsed: `${heapUsedMB}MB`,
        heapTotal: `${heapTotalMB}MB`,
        heapUsagePercent: `${Math.round(heapUsagePercent)}%`,
      },
    };
  } catch (error) {
    return {
      status: "fail",
      message: "Unable to check memory usage",
      details: {
        error: (error as Error).message,
      },
    };
  }
}

// Simple health check endpoint for load balancers
export const HEAD: RequestHandler = async () => {
  try {
    // Quick database ping
    await db.$queryRaw`SELECT 1`;
    return new Response(null, { status: 200 });
  } catch {
    return new Response(null, { status: 503 });
  }
};
