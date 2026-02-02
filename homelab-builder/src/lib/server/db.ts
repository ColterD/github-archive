// DATABASE CLIENT - ENTERPRISE SINGLETON PATTERN
// Optimized for production with connection pooling and error handling
// Updated: 2025-01-09 - Web search verified best practices

import { PrismaClient, type Prisma } from "@prisma/client";
import { env } from "$env/dynamic/private";
import { logger } from "./logger.js";

declare global {
  var __db: PrismaClient | undefined;
}

type PrismaClientType = PrismaClient;

let db: PrismaClientType;

// Skip database connection during build if DATABASE_URL is not available
if (!env.DATABASE_URL) {
  // Create a mock client for build time
  db = new PrismaClient({
    datasources: {
      db: {
        url: "postgresql://localhost:5432/mock?schema=public",
      },
    },
    log: [],
    errorFormat: "pretty",
  });
} else if (env.NODE_ENV === "production") {
  // Production: Create new instance
  db = new PrismaClient({
    datasources: {
      db: {
        url: env.DATABASE_URL,
      },
    },
    log: ["error"],
    errorFormat: "pretty",
  });
} else {
  // Development: Use global singleton to prevent multiple instances
  if (!global.__db) {
    global.__db = new PrismaClient({
      datasources: {
        db: {
          url: env.DATABASE_URL,
        },
      },
      log: ["query", "info", "warn", "error"],
      errorFormat: "pretty",
    });
  }
  db = global.__db;
}

// Enhanced error handling for database operations with proper logging
if (env.DATABASE_URL) {
  db.$use(
    async (
      params: Prisma.MiddlewareParams,
      next: (params: Prisma.MiddlewareParams) => Promise<unknown>,
    ) => {
      const start = Date.now();
      const operation = `${params.model}.${params.action}`;

      try {
        const result = await next(params);
        const duration = Date.now() - start;

        // Log query performance
        logger.query(operation, duration, {
          model: params.model,
          action: params.action,
          args: params.args,
        });

        return result;
      } catch (error) {
        const duration = Date.now() - start;

        logger.error(
          `Database operation failed: ${operation}`,
          error as Error,
          {
            model: params.model,
            action: params.action,
            duration,
            args: params.args,
          },
        );

        // Re-throw the error to maintain normal error handling
        throw error;
      }
    },
  );
}

// Graceful shutdown handling
process.on("SIGTERM", async () => {
  logger.info("🔌 Disconnecting from database...");
  await db.$disconnect();
  process.exit(0);
});

process.on("SIGINT", async () => {
  logger.info("🔌 Disconnecting from database...");
  await db.$disconnect();
  process.exit(0);
});

export { db };
export default db;
