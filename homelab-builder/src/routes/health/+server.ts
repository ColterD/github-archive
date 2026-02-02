// Health check endpoint for Railway monitoring and load balancer
import { json } from "@sveltejs/kit";
import { db } from "$lib/server/db.js";
import { env } from "$env/dynamic/private";
import type { RequestHandler } from "./$types";

interface HealthCheck {
  status: "healthy" | "unhealthy";
  timestamp: string;
  version: string;
  environment: string;
  services: {
    database: ServiceStatus;
    redis: ServiceStatus;
    email: ServiceStatus;
    search: ServiceStatus;
  };
  system: {
    uptime: number;
    memory: {
      used: number;
      total: number;
      percentage: number;
    };
    cpu: {
      usage: number;
    };
  };
}

interface ServiceStatus {
  status: "healthy" | "unhealthy" | "degraded";
  responseTime: number;
  error?: string;
}

export const GET: RequestHandler = async () => {
  const startTime = Date.now();
  const healthCheck: HealthCheck = {
    status: "healthy",
    timestamp: new Date().toISOString(),
    version: "1.0.0", // Will be updated by CI/CD
    environment: env.NODE_ENV || "development",
    services: {
      database: await checkDatabase(),
      redis: await checkRedis(),
      email: await checkEmail(),
      search: await checkSearch(),
    },
    system: {
      uptime: process.uptime(),
      memory: getMemoryStats(),
      cpu: getCpuStats(),
    },
  };

  // Determine overall health status
  const serviceStatuses = Object.values(healthCheck.services);
  const hasUnhealthyService = serviceStatuses.some(
    (service) => service.status === "unhealthy",
  );
  const hasDegradedService = serviceStatuses.some(
    (service) => service.status === "degraded",
  );

  if (hasUnhealthyService) {
    healthCheck.status = "unhealthy";
  } else if (hasDegradedService) {
    healthCheck.status = "unhealthy"; // Treat degraded as unhealthy for load balancer
  }

  const responseTime = Date.now() - startTime;

  // Return appropriate HTTP status code
  const statusCode = healthCheck.status === "healthy" ? 200 : 503;

  return json(healthCheck, {
    status: statusCode,
    headers: {
      "Cache-Control": "no-cache, no-store, must-revalidate",
      "X-Response-Time": `${responseTime}ms`,
    },
  });
};

async function checkDatabase(): Promise<ServiceStatus> {
  const startTime = Date.now();
  try {
    // Simple query to check database connectivity and performance
    await db.$queryRaw`SELECT 1`;
    const responseTime = Date.now() - startTime;

    // Consider degraded if response time is too high
    const status = responseTime > 1000 ? "degraded" : "healthy";

    return {
      status,
      responseTime,
    };
  } catch (error) {
    return {
      status: "unhealthy",
      responseTime: Date.now() - startTime,
      error:
        error instanceof Error ? error.message : "Database connection failed",
    };
  }
}

async function checkRedis(): Promise<ServiceStatus> {
  const startTime = Date.now();
  try {
    // Import Redis client dynamically to avoid issues if Redis is not configured
    const { createClient } = await import("redis");
    const client = createClient({
      url: env.REDIS_URL,
    });

    await client.connect();
    await client.ping();
    await client.disconnect();

    const responseTime = Date.now() - startTime;
    const status = responseTime > 500 ? "degraded" : "healthy";

    return {
      status,
      responseTime,
    };
  } catch (error) {
    return {
      status: "unhealthy",
      responseTime: Date.now() - startTime,
      error: error instanceof Error ? error.message : "Redis connection failed",
    };
  }
}

async function checkEmail(): Promise<ServiceStatus> {
  const startTime = Date.now();
  try {
    // Check if Resend API key is configured
    if (!env.RESEND_API_KEY) {
      return {
        status: "degraded",
        responseTime: Date.now() - startTime,
        error: "Email service not configured",
      };
    }

    // In production, you might want to make a test API call to Resend
    // For now, just check configuration
    return {
      status: "healthy",
      responseTime: Date.now() - startTime,
    };
  } catch (error) {
    return {
      status: "unhealthy",
      responseTime: Date.now() - startTime,
      error:
        error instanceof Error ? error.message : "Email service check failed",
    };
  }
}

async function checkSearch(): Promise<ServiceStatus> {
  const startTime = Date.now();
  try {
    // Check if Meilisearch is configured
    if (!env.MEILISEARCH_HOST) {
      return {
        status: "degraded",
        responseTime: Date.now() - startTime,
        error: "Search service not configured",
      };
    }

    // Import Meilisearch client dynamically
    const { MeiliSearch } = await import("meilisearch");
    const client = new MeiliSearch({
      host: env.MEILISEARCH_HOST,
      apiKey: env.MEILISEARCH_MASTER_KEY,
    });

    // Test connection with health endpoint
    await client.health();

    const responseTime = Date.now() - startTime;
    const status = responseTime > 1000 ? "degraded" : "healthy";

    return {
      status,
      responseTime,
    };
  } catch (error) {
    return {
      status: "unhealthy",
      responseTime: Date.now() - startTime,
      error:
        error instanceof Error
          ? error.message
          : "Search service connection failed",
    };
  }
}

function getMemoryStats() {
  const memUsage = process.memoryUsage();
  const totalMemory = memUsage.heapTotal;
  const usedMemory = memUsage.heapUsed;

  return {
    used: Math.round(usedMemory / 1024 / 1024), // MB
    total: Math.round(totalMemory / 1024 / 1024), // MB
    percentage: Math.round((usedMemory / totalMemory) * 100),
  };
}

function getCpuStats() {
  // Simple CPU usage approximation
  // In production, you might want to use a more sophisticated method
  const loadAvg = process.cpuUsage();
  const usage = (loadAvg.user + loadAvg.system) / 1000000; // Convert to seconds

  return {
    usage: Math.round(usage * 100) / 100,
  };
}

// Note: Graceful shutdown is handled in the main database module
