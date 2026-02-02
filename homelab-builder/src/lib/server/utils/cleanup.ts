// HOMELAB HARDWARE PLATFORM - SHARED CLEANUP UTILITIES
// Centralized cleanup functions to eliminate code duplication

import { logger } from './logger';

export interface CacheEntry<T = unknown> {
  value: T;
  timestamp: number;
}

export interface TimestampedEntry {
  createdAt: number;
  [key: string]: unknown;
}

/**
 * Generic cleanup function for Map-based caches with TTL
 */
export function cleanupExpiredMapEntries<T>(
  cache: Map<string, CacheEntry<T>>,
  ttl: number,
  cacheName?: string
): number {
  const now = Date.now();
  let cleanedCount = 0;

  for (const [key, entry] of cache.entries()) {
    if (now - entry.timestamp > ttl) {
      cache.delete(key);
      cleanedCount++;
    }
  }

  if (cacheName && cleanedCount > 0) {
    logger.debug(`Cleaned up ${cleanedCount} expired entries from ${cacheName}`);
  }

  return cleanedCount;
}

/**
 * Generic cleanup function for Map-based entries with timestamp
 */
export function cleanupExpiredTimestampEntries<T extends TimestampedEntry>(
  cache: Map<string, T>,
  ttl: number,
  cacheName?: string
): number {
  const now = Date.now();
  let cleanedCount = 0;

  for (const [key, entry] of cache.entries()) {
    if (now - entry.createdAt > ttl) {
      cache.delete(key);
      cleanedCount++;
    }
  }

  if (cacheName && cleanedCount > 0) {
    logger.debug(`Cleaned up ${cleanedCount} expired entries from ${cacheName}`);
  }

  return cleanedCount;
}

/**
 * Cleanup function for interval timers
 */
export function cleanupInterval(intervalId: NodeJS.Timeout | null): null {
  if (intervalId) {
    clearInterval(intervalId);
  }
  return null;
}

/**
 * Cleanup function for timeout timers
 */
export function cleanupTimeout(timeoutId: NodeJS.Timeout | null): null {
  if (timeoutId) {
    clearTimeout(timeoutId);
  }
  return null;
}

/**
 * Safe localStorage cleanup
 */
export function cleanupLocalStorage(key: string): void {
  if (typeof window !== 'undefined') {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      logger.warn(`Failed to cleanup localStorage key: ${key}`, { error });
    }
  }
}

/**
 * Batch cleanup for multiple localStorage keys
 */
export function cleanupLocalStorageKeys(keys: string[]): void {
  if (typeof window !== 'undefined') {
    keys.forEach(key => cleanupLocalStorage(key));
  }
}

/**
 * Create a periodic cleanup scheduler
 */
export function createPeriodicCleanup(
  cleanupFn: () => void,
  intervalMs: number,
  name?: string
): () => void {
  const intervalId = setInterval(() => {
    try {
      cleanupFn();
    } catch (error) {
      logger.error(`Periodic cleanup failed for ${name || 'unknown'}`, { error });
    }
  }, intervalMs);

  // Return cleanup function
  return () => {
    clearInterval(intervalId);
    if (name) {
      logger.debug(`Stopped periodic cleanup for ${name}`);
    }
  };
}

/**
 * Error classification utility (moved from duplicated locations)
 */
export function classifyError(message: string, stack?: string): string {
  const lowerMessage = message.toLowerCase();
  const lowerStack = stack?.toLowerCase() || '';

  if (lowerMessage.includes('network') || lowerMessage.includes('fetch')) {
    return 'network';
  }
  if (lowerMessage.includes('permission') || lowerMessage.includes('unauthorized')) {
    return 'auth';
  }
  if (lowerMessage.includes('validation') || lowerMessage.includes('invalid')) {
    return 'validation';
  }
  if (lowerMessage.includes('timeout') || lowerMessage.includes('abort')) {
    return 'timeout';
  }
  if (lowerMessage.includes('memory') || lowerMessage.includes('heap')) {
    return 'memory';
  }
  if (lowerStack.includes('database') || lowerStack.includes('prisma')) {
    return 'database';
  }

  return 'unknown';
}

/**
 * Attack pattern detection utility (moved from duplicated locations)
 */
export function detectAttackPattern(uri?: string, sample?: string): string | null {
  // XSS patterns
  if (
    uri?.includes('javascript:') ||
    uri?.includes('data:text/html') ||
    sample?.includes('<script') ||
    sample?.includes('javascript:')
  ) {
    return 'xss';
  }

  // SQL injection patterns
  if (
    uri?.includes('union select') ||
    uri?.includes('drop table') ||
    sample?.includes('union select') ||
    sample?.includes('drop table')
  ) {
    return 'sql_injection';
  }

  // Path traversal
  if (uri?.includes('../') || uri?.includes('..\\')) {
    return 'path_traversal';
  }

  // Command injection
  if (
    uri?.includes('$(') ||
    uri?.includes('`') ||
    sample?.includes('$(') ||
    sample?.includes('`')
  ) {
    return 'command_injection';
  }

  return null;
}