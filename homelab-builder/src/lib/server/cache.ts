// REDIS CACHING LAYER - Enterprise Performance Optimization
// Provides application-level caching for database queries and expensive operations
// Updated: 2025-01-09 - Performance optimization implementation

import { env } from "$env/dynamic/private";
import { createClient, type RedisClientType } from "redis";
import { logger } from "./logger";

declare global {
  var __redis: RedisClientType | undefined;
}

let redis: RedisClientType;

if (env.NODE_ENV === "production") {
  // Production: Create new instance with optimized configuration
  redis = createClient({
    url: env.REDIS_URL || "redis://localhost:6379",
    socket: {
      reconnectStrategy: (retries) => Math.min(retries * 50, 1000),
    },
    commandsQueueMaxLength: 1000,
  });
} else {
  // Development: Use global singleton to prevent multiple instances
  if (!global.__redis) {
    global.__redis = createClient({
      url: env.REDIS_URL || "redis://localhost:6379",
      socket: {
        reconnectStrategy: (retries) => Math.min(retries * 50, 1000),
      },
    });
  }
  redis = global.__redis;
}

// Connection management
redis.on("error", (err) => {
  logger.error("Redis Client Error", err);
});

redis.on("connect", () => {
  logger.info("Redis connected");
});

redis.on("ready", () => {
  logger.info("Redis ready for operations");
});

// Initialize connection
if (!redis.isOpen) {
  redis
    .connect()
    .catch((error) => logger.error("Redis connection failed", error));
}

// Cache utility functions
export const cache = {
  // Get cached value with automatic JSON parsing
  async get<T>(key: string): Promise<T | null> {
    try {
      const value = await redis.get(key);
      return value && typeof value === "string" ? JSON.parse(value) : null;
    } catch (error) {
      logger.warn(`Cache GET error for key ${key}`, {
        key,
        error: error instanceof Error ? error.message : String(error),
      });
      return null;
    }
  },

  // Set cached value with automatic JSON stringification
  async set<T>(
    key: string,
    value: T,
    ttlSeconds: number = 3600,
  ): Promise<void> {
    try {
      await redis.setEx(key, ttlSeconds, JSON.stringify(value));
    } catch (error) {
      logger.warn(`Cache SET error for key ${key}`, {
        key,
        ttl: ttlSeconds,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  },

  // Delete cached value
  async del(key: string): Promise<void> {
    try {
      await redis.del(key);
    } catch (error) {
      logger.warn(`Cache DEL error for key ${key}`, {
        key,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  },

  // Clear all cached values matching pattern
  async clear(pattern: string): Promise<void> {
    try {
      const keys = await redis.keys(pattern);
      if (keys.length > 0) {
        await redis.del(keys);
      }
    } catch (error) {
      logger.warn(`Cache CLEAR error for pattern ${pattern}`, {
        pattern,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  },

  // Check if key exists
  async exists(key: string): Promise<boolean> {
    try {
      return (await redis.exists(key)) === 1;
    } catch (error) {
      logger.warn(`Cache EXISTS error for key ${key}`, {
        key,
        error: error instanceof Error ? error.message : String(error),
      });
      return false;
    }
  },

  // Get multiple keys at once
  async mget<T>(keys: string[]): Promise<(T | null)[]> {
    try {
      const values = await redis.mGet(keys);
      return values.map((value) =>
        value && typeof value === "string" ? JSON.parse(value) : null,
      );
    } catch (error) {
      logger.warn(`Cache MGET error for keys ${keys.join(", ")}`, {
        keys,
        error: error instanceof Error ? error.message : String(error),
      });
      return keys.map(() => null);
    }
  },

  // Set multiple keys at once
  async mset<T>(keyValuePairs: [string, T, number][]): Promise<void> {
    try {
      const pipeline = redis.multi();
      keyValuePairs.forEach(([key, value, ttl]) => {
        pipeline.setEx(key, ttl, JSON.stringify(value));
      });
      await pipeline.exec();
    } catch (error) {
      logger.warn(`Cache MSET error`, {
        valueCount: keyValuePairs.length,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  },

  // Increment counter
  async incr(key: string, ttl: number = 3600): Promise<number> {
    try {
      const value = await redis.incr(key);
      if (value === 1) {
        await redis.expire(key, ttl);
      }
      return value;
    } catch (error) {
      logger.warn(`Cache INCR error for key ${key}`, {
        key,
        ttl,
        error: error instanceof Error ? error.message : String(error),
      });
      return 0;
    }
  },
};

// Cache key builders for consistent naming
export const cacheKeys = {
  hardware: (id: string) => `hardware:${id}`,
  hardwareList: (category?: string, page?: number) =>
    `hardware:list:${category || "all"}:${page || 1}`,
  manufacturer: (id: string) => `manufacturer:${id}`,
  manufacturerList: () => "manufacturers:all",
  user: (id: string) => `user:${id}`,
  userProfile: (id: string) => `user:profile:${id}`,
  build: (id: string) => `build:${id}`,
  buildList: (page?: number) => `builds:list:${page || 1}`,
  search: (query: string, page?: number) => `search:${query}:${page || 1}`,
  priceHistory: (hardwareId: string) => `price:history:${hardwareId}`,
  analytics: (type: string, period: string) => `analytics:${type}:${period}`,
  session: (sessionId: string) => `session:${sessionId}`,
  rateLimit: (identifier: string) => `rate:${identifier}`,
};

// Cache TTL constants (in seconds)
export const cacheTTL = {
  SHORT: 300, // 5 minutes
  MEDIUM: 1800, // 30 minutes
  LONG: 3600, // 1 hour
  EXTENDED: 86400, // 24 hours
  PERMANENT: 604800, // 7 days
};

// Database query caching wrapper
export function withCache<T>(
  cacheKey: string,
  ttl: number,
  queryFn: () => Promise<T>,
): Promise<T> {
  return (async function cachedQuery(): Promise<T> {
    // Try to get from cache first
    const cached = await cache.get<T>(cacheKey);
    if (cached !== null) {
      return cached;
    }

    // Execute query and cache result
    const result = await queryFn();
    await cache.set(cacheKey, result, ttl);
    return result;
  })();
}

// Cache invalidation helpers
export const invalidateCache = {
  hardware: async (id: string) => {
    await cache.del(cacheKeys.hardware(id));
    await cache.clear("hardware:list:*");
  },

  manufacturer: async (id: string) => {
    await cache.del(cacheKeys.manufacturer(id));
    await cache.del(cacheKeys.manufacturerList());
  },

  user: async (id: string) => {
    await cache.del(cacheKeys.user(id));
    await cache.del(cacheKeys.userProfile(id));
  },

  build: async (id: string) => {
    await cache.del(cacheKeys.build(id));
    await cache.clear("builds:list:*");
  },

  search: async () => {
    await cache.clear("search:*");
  },

  all: async () => {
    await redis.flushDb();
  },
};

// Graceful shutdown
process.on("SIGTERM", async () => {
  logger.info("Disconnecting from Redis...");
  await redis.quit();
});

process.on("SIGINT", async () => {
  logger.info("Disconnecting from Redis...");
  await redis.quit();
});

export default redis;
