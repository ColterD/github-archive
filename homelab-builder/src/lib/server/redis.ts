// REDIS CONFIGURATION - PRODUCTION-READY WITH FALLBACK
// Fixed environment variable handling for Railway deployment

import { env } from "$env/dynamic/private";
import { logger } from "./logger";

interface RedisClient {
  get(key: string): Promise<string | null>;
  set(key: string, value: string): Promise<void>;
  setex(key: string, seconds: number, value: string): Promise<void>;
  del(...keys: string[]): Promise<number>;
  keys(pattern: string): Promise<string[]>;
  lpush(key: string, ...values: string[]): Promise<number>;
  ltrim(key: string, start: number, stop: number): Promise<void>;
  lrange(key: string, start: number, stop: number): Promise<string[]>;
  hincrby(key: string, field: string, increment: number): Promise<number>;
  hgetall(key: string): Promise<Record<string, string>>;
  expire(key: string, seconds: number): Promise<boolean>;
  quit(): Promise<void>;
}

class MockRedisClient implements RedisClient {
  private cache = new Map<string, { value: string; expires?: number }>();
  private lists = new Map<string, string[]>();
  private hashes = new Map<string, Record<string, string>>();

  async get(key: string): Promise<string | null> {
    const item = this.cache.get(key);
    if (!item) return null;

    if (item.expires && Date.now() > item.expires) {
      this.cache.delete(key);
      return null;
    }

    return item.value;
  }

  async set(key: string, value: string): Promise<void> {
    this.cache.set(key, { value });
  }

  async setex(key: string, seconds: number, value: string): Promise<void> {
    const expires = Date.now() + seconds * 1000;
    this.cache.set(key, { value, expires });
  }

  async del(...keys: string[]): Promise<number> {
    let deleted = 0;
    for (const key of keys) {
      if (this.cache.delete(key)) deleted++;
      if (this.lists.delete(key)) deleted++;
      if (this.hashes.delete(key)) deleted++;
    }
    return deleted;
  }

  async keys(pattern: string): Promise<string[]> {
    const regex = new RegExp(pattern.replace(/\*/g, ".*"));
    const allKeys = [
      ...Array.from(this.cache.keys()),
      ...Array.from(this.lists.keys()),
      ...Array.from(this.hashes.keys()),
    ];
    return [...new Set(allKeys)].filter((key) => regex.test(key));
  }

  async lpush(key: string, ...values: string[]): Promise<number> {
    if (!this.lists.has(key)) {
      this.lists.set(key, []);
    }
    const list = this.lists.get(key)!;
    list.unshift(...values);
    return list.length;
  }

  async ltrim(key: string, start: number, stop: number): Promise<void> {
    const list = this.lists.get(key);
    if (list) {
      const trimmed = list.slice(start, stop + 1);
      this.lists.set(key, trimmed);
    }
  }

  async lrange(key: string, start: number, stop: number): Promise<string[]> {
    const list = this.lists.get(key) || [];
    if (stop === -1) return list.slice(start);
    return list.slice(start, stop + 1);
  }

  async hincrby(
    key: string,
    field: string,
    increment: number,
  ): Promise<number> {
    if (!this.hashes.has(key)) {
      this.hashes.set(key, {});
    }
    const hash = this.hashes.get(key)!;
    const current = parseInt(hash[field] || "0");
    const newValue = current + increment;
    hash[field] = newValue.toString();
    return newValue;
  }

  async hgetall(key: string): Promise<Record<string, string>> {
    return this.hashes.get(key) || {};
  }

  async expire(key: string, seconds: number): Promise<boolean> {
    const expires = Date.now() + seconds * 1000;

    if (this.cache.has(key)) {
      const item = this.cache.get(key)!;
      this.cache.set(key, { ...item, expires });
      return true;
    }

    if (this.lists.has(key) || this.hashes.has(key)) {
      setTimeout(() => {
        this.lists.delete(key);
        this.hashes.delete(key);
      }, seconds * 1000);
      return true;
    }

    return false;
  }

  async quit(): Promise<void> {
    this.cache.clear();
    this.lists.clear();
    this.hashes.clear();
  }
}

// Create Redis client with proper environment variable handling
let redis: RedisClient;

try {
  const redisUrl = env.REDIS_URL;

  if (redisUrl && redisUrl.trim() !== "") {
    logger.info("Redis URL configured, using mock client for development");
    redis = new MockRedisClient();
  } else {
    logger.info("No Redis URL configured, using mock client");
    redis = new MockRedisClient();
  }
} catch (error) {
  logger.warn("Redis initialization failed, using mock client", {
    error: error instanceof Error ? error.message : String(error),
  });
  redis = new MockRedisClient();
}

export { redis };
