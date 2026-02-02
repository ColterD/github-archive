// HOMELAB HARDWARE PLATFORM - ADMIN ANALYTICS SERVICE
// Comprehensive analytics engine for admin dashboard and business intelligence
// Updated: 2025-01-11 - TypeScript type safety improvements

import { db } from "../db";
import { logger } from "../logger";
import { 
  cleanupExpiredMapEntries, 
  createPeriodicCleanup,
  type CacheEntry 
} from "../utils/cleanup";
import type {
  AdminDashboardMetrics,
  SearchAnalytics,
  UserAnalytics,
  PerformanceMetrics,
} from "$lib/types/admin";

// User action metadata type
interface ActionMetadata {
  page?: string;
  category?: string;
  itemId?: string;
  searchQuery?: string;
  buildId?: string;
  duration?: number;
  [key: string]: string | number | boolean | undefined;
}

// Search event type for analytics tracking
interface SearchEvent {
  id?: string;
  query: string;
  userId: string | null;
  resultsCount: number;
  category: string | null;
  timestamp: Date;
  success: boolean;
  ip: string | null;
}

export class AdminAnalyticsService {
  private static instance: AdminAnalyticsService;
  private metricsCache = new Map<string, CacheEntry<unknown>>();
  private readonly CACHE_TTL = 60 * 1000; // 1 minute
  private cleanupScheduler: (() => void) | null = null;

  static getInstance(): AdminAnalyticsService {
    if (!this.instance) {
      this.instance = new AdminAnalyticsService();
      // Set up periodic cleanup
      this.instance.cleanupScheduler = createPeriodicCleanup(
        () => this.instance.cleanupExpiredEntries(),
        this.instance.CACHE_TTL,
        'AdminAnalyticsService'
      );
    }
    return this.instance;
  }

  // Clean up expired cache entries using shared utility
  private cleanupExpiredEntries(): void {
    cleanupExpiredMapEntries(this.metricsCache, this.CACHE_TTL, 'AdminAnalyticsService');
  }

  // Cleanup method for graceful shutdown
  destroy(): void {
    if (this.cleanupScheduler) {
      this.cleanupScheduler();
      this.cleanupScheduler = null;
    }
    this.metricsCache.clear();
  }

  // Get comprehensive dashboard metrics
  async getDashboardMetrics(): Promise<AdminDashboardMetrics> {
    const cacheKey = "dashboard-metrics";
    const cached = this.getCachedData<AdminDashboardMetrics>(cacheKey);
    // Explicit type guard to ensure TypeScript understands this is valid data
    if (cached && this.isValidDashboardMetrics(cached)) {
      return cached;
    }

    try {
      const [userMetrics, hardwareMetrics, buildMetrics, systemMetrics] =
        await Promise.all([
          this.getUserMetrics(),
          this.getHardwareMetrics(),
          this.getBuildMetrics(),
          this.getSystemHealthMetrics(),
        ]);

      const metrics: AdminDashboardMetrics = {
        users: userMetrics,
        hardware: hardwareMetrics,
        builds: buildMetrics,
        system: systemMetrics,
        timestamp: new Date().toISOString(),
      };

      this.setCachedData(cacheKey, metrics);
      return metrics;
    } catch (_error) {
      logger.error("Failed to get dashboard metrics", _error as Error);
      throw new Error("Failed to retrieve dashboard metrics");
    }
  }

  // Type guard for dashboard metrics
  private isValidDashboardMetrics(
    data: unknown,
  ): data is AdminDashboardMetrics {
    return (
      typeof data === "object" &&
      data !== null &&
      "users" in data &&
      "hardware" in data &&
      "builds" in data &&
      "system" in data &&
      "timestamp" in data
    );
  }

  // Get detailed search analytics
  async getSearchAnalytics(
    timeframe: "24h" | "7d" | "30d" = "24h",
  ): Promise<SearchAnalytics> {
    const cacheKey = `search-analytics-${timeframe}`;
    const cached = this.getCachedData<SearchAnalytics>(cacheKey);
    if (cached && this.isValidSearchAnalytics(cached)) {
      return cached;
    }

    try {
      const endDate = new Date();
      const startDate = new Date();

      switch (timeframe) {
        case "24h":
          startDate.setHours(endDate.getHours() - 24);
          break;
        case "7d":
          startDate.setDate(endDate.getDate() - 7);
          break;
        case "30d":
          startDate.setDate(endDate.getDate() - 30);
          break;
      }

      const [searchStats, topQueries, searchTrends] = await Promise.all([
        this.getSearchStatistics(startDate, endDate),
        this.getTopSearchQueries(startDate, endDate),
        this.getSearchTrends(startDate, endDate),
      ]);

      const analytics: SearchAnalytics = {
        totalSearches: searchStats.total,
        uniqueUsers: searchStats.uniqueUsers,
        averageResultsPerQuery: searchStats.avgResults,
        searchSuccessRate: searchStats.successRate,
        averageResponseTime: 150, // Default value in ms
        successRate: searchStats.successRate,
        zeroResultsRate: Math.max(0, 1 - searchStats.successRate),
        popularCategories: searchStats.categories as Array<{
          category: string;
          count: number;
        }>,
        topQueries,
        searchTrends,
        timeframe,
        lastUpdated: new Date().toISOString(),
      };

      this.setCachedData(cacheKey, analytics, 5 * 60 * 1000); // Cache for 5 minutes
      return analytics;
    } catch (_error) {
      logger.error("Failed to get search analytics", _error as Error, {
        timeframe,
      });
      throw new Error("Failed to retrieve search analytics");
    }
  }

  // Type guard for search analytics
  private isValidSearchAnalytics(data: unknown): data is SearchAnalytics {
    return (
      typeof data === "object" &&
      data !== null &&
      "totalSearches" in data &&
      "uniqueUsers" in data &&
      "averageResultsPerQuery" in data &&
      "searchSuccessRate" in data
    );
  }

  // Get user behavior analytics
  async getUserAnalytics(
    timeframe: "24h" | "7d" | "30d" = "7d",
  ): Promise<UserAnalytics> {
    const cacheKey = `user-analytics-${timeframe}`;
    const cached = this.getCachedData<UserAnalytics>(cacheKey);
    if (cached && this.isValidUserAnalytics(cached)) {
      return cached;
    }

    try {
      const endDate = new Date();
      const startDate = new Date();

      switch (timeframe) {
        case "24h":
          startDate.setHours(endDate.getHours() - 24);
          break;
        case "7d":
          startDate.setDate(endDate.getDate() - 7);
          break;
        case "30d":
          startDate.setDate(endDate.getDate() - 30);
          break;
      }

      const [registrationTrends, engagementMetrics, behaviorPatterns] =
        await Promise.all([
          this.getRegistrationTrends(startDate, endDate),
          this.getEngagementMetrics(startDate, endDate),
          this.getBehaviorPatterns(startDate, endDate),
        ]);

      const analytics: UserAnalytics = {
        newRegistrations: registrationTrends.total,
        registrationTrend: registrationTrends.trend,
        activeUsers: engagementMetrics.active,
        engagementRate: engagementMetrics.rate,
        avgSessionDuration: behaviorPatterns.sessionDuration,
        topPages: behaviorPatterns.pages,
        userRetention: behaviorPatterns.retention,
        timeframe,
        lastUpdated: new Date().toISOString(),
      };

      this.setCachedData(cacheKey, analytics, 5 * 60 * 1000);
      return analytics;
    } catch (_error) {
      logger.error("Failed to get user analytics", _error as Error, {
        timeframe,
      });
      throw new Error("Failed to retrieve user analytics");
    }
  }

  // Type guard for user analytics
  private isValidUserAnalytics(data: unknown): data is UserAnalytics {
    return (
      typeof data === "object" &&
      data !== null &&
      "newRegistrations" in data &&
      "activeUsers" in data &&
      "engagementRate" in data
    );
  }

  // Get real-time system performance metrics
  async getPerformanceMetrics(): Promise<PerformanceMetrics> {
    const cacheKey = "performance-metrics";
    const cached = this.getCachedData<PerformanceMetrics>(cacheKey, 30 * 1000); // 30 second cache
    if (cached && this.isValidPerformanceMetrics(cached)) {
      return cached;
    }

    try {
      const [dbMetrics, apiMetrics, searchMetrics] = await Promise.all([
        this.getDatabaseMetrics(),
        this.getAPIMetrics(),
        this.getSearchPerformanceMetrics(),
      ]);

      const metrics: PerformanceMetrics = {
        database: dbMetrics,
        api: apiMetrics,
        search: searchMetrics,
        timestamp: new Date().toISOString(),
      };

      this.setCachedData(cacheKey, metrics, 30 * 1000);
      return metrics;
    } catch (_error) {
      logger.error("Failed to get performance metrics", _error as Error);
      throw new Error("Failed to retrieve performance metrics");
    }
  }

  // Type guard for performance metrics
  private isValidPerformanceMetrics(data: unknown): data is PerformanceMetrics {
    return (
      typeof data === "object" &&
      data !== null &&
      "database" in data &&
      "api" in data &&
      "search" in data &&
      "timestamp" in data
    );
  }

  // Track search query for analytics
  async trackSearchQuery(
    query: string,
    userId?: string,
    resultsCount: number = 0,
    category?: string,
  ): Promise<void> {
    try {
      // Track search in database using SearchLog table with correct schema
      await db.searchLog.create({
        data: {
          query: query.toLowerCase().trim(),
          userId: userId || null,
          results: resultsCount,
          filters: category ? JSON.stringify({ category }) : null,
          // createdAt is automatic
        },
      });

      // Note: Redis integration removed for simplicity
    } catch (_error) {
      logger.error("Failed to track search query", _error as Error, {
        query,
        userId,
        resultsCount,
      });
      // Don't throw - analytics failures shouldn't break user experience
    }
  }

  // Track user action for analytics
  async trackUserAction(
    action: string,
    userId: string,
    metadata?: ActionMetadata,
  ): Promise<void> {
    try {
      // For now, we'll use a simplified tracking approach
      // In a production system, you'd want a dedicated UserActions table
      logger.info("User action tracked", {
        action,
        userId,
        metadata,
        timestamp: new Date().toISOString(),
      });

      // Could be extended to use SearchLog for search actions
      if (action === "search" && metadata?.searchQuery) {
        await this.trackSearchQuery(
          metadata.searchQuery,
          userId,
          (metadata.resultsCount as number) || 0,
          metadata.category as string,
        );
      }
    } catch (_error) {
      logger.error("Failed to track user action", _error as Error, {
        action,
        userId,
        metadata,
      });
      // Don't throw - analytics failures shouldn't break user experience
    }
  }

  private async getUserMetrics() {
    try {
      const [total, newToday, activeNow] = await Promise.all([
        db.user.count(),
        db.user.count({
          where: {
            createdAt: {
              gte: new Date(new Date().setHours(0, 0, 0, 0)),
            },
          },
        }),
        this.getActiveUserCount(),
      ]);

      const lastMonth = new Date();
      lastMonth.setMonth(lastMonth.getMonth() - 1);

      const lastMonthCount = await db.user.count({
        where: {
          createdAt: {
            lt: lastMonth,
          },
        },
      });

      const growth =
        lastMonthCount > 0
          ? (((total - lastMonthCount) / lastMonthCount) * 100).toFixed(1) + "%"
          : "+0%";

      return {
        total,
        newToday,
        activeNow,
        growth,
      };
    } catch (error) {
      logger.error("Failed to get user metrics", error as Error);
      return { total: 0, newToday: 0, activeNow: 0, growth: "0%" };
    }
  }

  private async getHardwareMetrics() {
    try {
      const [total, inactive, active, discontinued] = await Promise.all([
        db.hardwareItem.count(),
        db.hardwareItem.count({ where: { status: "INACTIVE" } }),
        db.hardwareItem.count({ where: { status: "ACTIVE" } }),
        db.hardwareItem.count({ where: { status: "DISCONTINUED" } }),
      ]);

      return {
        total,
        pending: inactive, // Use inactive as pending
        active,
        archived: discontinued, // Use discontinued as archived
      };
    } catch (error) {
      logger.error("Failed to get hardware metrics", error as Error);
      return { total: 0, pending: 0, active: 0, archived: 0 };
    }
  }

  private async getBuildMetrics() {
    try {
      const [total, published, draft, featured] = await Promise.all([
        db.build.count(),
        db.build.count({ where: { isPublic: true } }),
        db.build.count({ where: { isPublic: false } }),
        db.build.count({ where: { isFeatured: true } }),
      ]);

      return {
        total,
        totalBuilds: total,
        published,
        publishedBuilds: published,
        draft,
        draftBuilds: draft,
        featured,
      };
    } catch (error) {
      logger.error("Failed to get build metrics", error as Error);
      return {
        total: 0,
        totalBuilds: 0,
        published: 0,
        publishedBuilds: 0,
        draft: 0,
        draftBuilds: 0,
        featured: 0,
      };
    }
  }

  private async getSystemHealthMetrics() {
    try {
      const [responseTime, dbQueries] = await Promise.all([
        this.getAverageResponseTime(),
        this.getDailyQueryCount(),
      ]);

      return {
        uptime: process.uptime().toString(),
        responseTime,
        errorRate: "0.1%", // Placeholder
        dbQueries,
      };
    } catch (error) {
      logger.error("Failed to get system health metrics", error as Error);
      return {
        uptime: "0",
        responseTime: "0ms",
        errorRate: "0%",
        dbQueries: "0",
      };
    }
  }

  private async getActiveUserCount(): Promise<number> {
    try {
      // if (!redis) return 0; // redis is removed from imports, so this block is commented out
      // const activeKeys = await redis.keys("user:activity:*"); // redis is removed from imports, so this block is commented out
      // return activeKeys.length; // redis is removed from imports, so this block is commented out
      return 0; // Placeholder as redis is removed
    } catch {
      return 0;
    }
  }

  private async getAverageResponseTime(): Promise<string> {
    try {
      // if (!redis) return "0ms"; // redis is removed from imports, so this block is commented out
      // const metrics = await redis.lrange("response_times", 0, 99); // redis is removed from imports, so this block is commented out
      // if (metrics.length === 0) return "0ms"; // redis is removed from imports, so this block is commented out

      // const sum = metrics.reduce((acc, time) => acc + parseFloat(time), 0); // redis is removed from imports, so this block is commented out
      // const avg = sum / metrics.length; // redis is removed from imports, so this block is commented out
      // return Math.round(avg) + "ms"; // redis is removed from imports, so this block is commented out
      return "0ms"; // Placeholder as redis is removed
    } catch {
      return "0ms";
    }
  }

  private async getDailyQueryCount(): Promise<string> {
    try {
      // if (!redis) return "0"; // redis is removed from imports, so this block is commented out
      // const dailyKey = `search_daily:${new Date().toISOString().slice(0, 10)}`; // redis is removed from imports, so this block is commented out
      // const queries = await redis.hgetall(dailyKey); // redis is removed from imports, so this block is commented out
      // const total = Object.values(queries).reduce((acc: number, count) => { // redis is removed from imports, so this block is commented out
      //   const countNum = // redis is removed from imports, so this block is commented out
      //     typeof count === "string" ? parseInt(count, 10) : Number(count); // redis is removed from imports, so this block is commented out
      //   return acc + (isNaN(countNum) ? 0 : countNum); // redis is removed from imports, so this block is commented out
      // }, 0); // redis is removed from imports, so this block is commented out
      // return total.toString(); // redis is removed from imports, so this block is commented out
      return "0"; // Placeholder as redis is removed
    } catch {
      return "0";
    }
  }

  // Get search statistics using actual SearchLog schema
  private async getSearchStatistics(startDate: Date, endDate: Date) {
    try {
      const searchLogs = await db.searchLog.findMany({
        where: {
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
        },
        select: {
          id: true,
          query: true,
          results: true,
          userId: true,
          filters: true,
          createdAt: true,
        },
      });

      const total = searchLogs.length;
      const uniqueUsers = new Set(
        searchLogs.filter((log) => log.userId).map((log) => log.userId),
      ).size;

      const avgResults =
        total > 0
          ? searchLogs.reduce((sum, log) => sum + log.results, 0) / total
          : 0;

      const successfulSearches = searchLogs.filter(
        (log) => log.results > 0,
      ).length;
      const successRate = total > 0 ? (successfulSearches / total) * 100 : 0;

      // Extract categories from filters
      const categories = searchLogs
        .map((log) => {
          try {
            const filters = log.filters ? JSON.parse(log.filters) : {};
            return filters.category;
          } catch {
            return null;
          }
        })
        .filter(Boolean)
        .reduce((acc: Record<string, number>, category: string) => {
          acc[category] = (acc[category] || 0) + 1;
          return acc;
        }, {});

      const categoryArray = Object.entries(categories).map(
        ([category, count]) => ({
          category,
          count: count as number,
        }),
      );

      return {
        total,
        uniqueUsers,
        avgResults: Number(avgResults.toFixed(2)),
        successRate: Number(successRate.toFixed(2)),
        categories: categoryArray,
      };
    } catch (_error) {
      logger.error("Failed to get search statistics", _error as Error);
      return {
        total: 0,
        uniqueUsers: 0,
        avgResults: 0,
        successRate: 0,
        categories: [],
      };
    }
  }

  // Get top search queries using actual SearchLog schema
  private async getTopSearchQueries(startDate: Date, endDate: Date) {
    try {
      const searchLogs = await db.searchLog.findMany({
        where: {
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
        },
        select: {
          query: true,
          results: true,
        },
      });

      // Group by query and calculate stats
      const queryStats = searchLogs.reduce(
        (acc: Record<string, { count: number; totalResults: number }>, log) => {
          const query = log.query.toLowerCase();
          if (!acc[query]) {
            acc[query] = { count: 0, totalResults: 0 };
          }
          acc[query].count += 1;
          acc[query].totalResults += log.results;
          return acc;
        },
        {},
      );

      // Convert to array and sort by count
      return Object.entries(queryStats)
        .map(([query, stats]) => ({
          query,
          count: stats.count,
          averageResults:
            stats.count > 0 ? stats.totalResults / stats.count : 0,
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10); // Top 10
    } catch (_error) {
      logger.error("Failed to get top search queries", _error as Error);
      return [];
    }
  }

  // Get search trends using actual SearchLog schema
  private async getSearchTrends(startDate: Date, endDate: Date) {
    try {
      const searchLogs = await db.searchLog.findMany({
        where: {
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
        },
        select: {
          createdAt: true,
          results: true,
        },
        orderBy: {
          createdAt: "asc",
        },
      });

      // Group by day
      const dailyStats = searchLogs.reduce(
        (
          acc: Record<string, { searches: number; totalResults: number }>,
          log,
        ) => {
          const day = log.createdAt.toISOString().split("T")[0];
          if (!acc[day]) {
            acc[day] = { searches: 0, totalResults: 0 };
          }
          acc[day].searches += 1;
          acc[day].totalResults += log.results;
          return acc;
        },
        {},
      );

      // Convert to array format
      return Object.entries(dailyStats).map(([date, stats]) => ({
        date,
        searches: stats.searches,
        averageResults:
          stats.searches > 0 ? stats.totalResults / stats.searches : 0,
      }));
    } catch (_error) {
      logger.error("Failed to get search trends", _error as Error);
      return [];
    }
  }

  // Helper method to get top categories from search events
  private getTopCategories(searchEvents: SearchEvent[]) {
    const categoryMap = new Map<string, number>();

    searchEvents.forEach((event) => {
      if (event.category) {
        categoryMap.set(
          event.category,
          (categoryMap.get(event.category) || 0) + 1,
        );
      }
    });

    return Array.from(categoryMap.entries())
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }

  private async getRegistrationTrends(_startDate: Date, _endDate: Date) {
    try {
      const users = await db.user.findMany({
        where: {
          createdAt: {
            gte: _startDate,
            lte: _endDate,
          },
        },
        select: { createdAt: true },
      });

      const total = users.length;
      const trend = this.calculateTrend(users.map((u) => u.createdAt));

      return { total, trend };
    } catch {
      return { total: 0, trend: 0 };
    }
  }

  private async getEngagementMetrics(_startDate: Date, _endDate: Date) {
    try {
      // In production, use date range: startDate to endDate for filtering
      // Mock engagement data - in production this would track user sessions
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const dateRange = { start: _startDate, end: _endDate };

      // Mock engagement data - in production this would track user sessions
      return {
        active: await this.getActiveUserCount(),
        rate: 75.5, // Placeholder percentage
      };
    } catch {
      return { active: 0, rate: 0 };
    }
  }

  private async getBehaviorPatterns(_startDate: Date, _endDate: Date) {
    try {
      // In production, use date range: startDate to endDate for filtering
      // Mock behavior data - in production this would track page views and sessions
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const dateRange = { start: _startDate, end: _endDate };

      // Mock behavior data - in production this would track page views and sessions
      return {
        sessionDuration: "8m 32s",
        pages: [
          { page: "/hardware", views: 1250 },
          { page: "/search", views: 890 },
          { page: "/builds", views: 650 },
          { page: "/profile", views: 420 },
          { page: "/build-creator", views: 380 },
        ],
        retention: {
          day1: 85,
          day7: 45,
          day30: 22,
        },
      };
    } catch {
      return {
        sessionDuration: "0m 0s",
        pages: [],
        retention: { day1: 0, day7: 0, day30: 0 },
      };
    }
  }

  private async getDatabaseMetrics() {
    try {
      // Mock database metrics - in production this would query actual DB stats
      return {
        connectionPool: {
          active: 5,
          idle: 10,
          waiting: 0,
        },
        queryPerformance: {
          average: 45,
          slowQueries: 2,
        },
        storage: {
          used: "2.1 GB",
          available: "7.9 GB",
        },
      };
    } catch {
      return {
        connectionPool: { active: 0, idle: 0, waiting: 0 },
        queryPerformance: { average: 0, slowQueries: 0 },
        storage: { used: "0 GB", available: "0 GB" },
      };
    }
  }

  private async getAPIMetrics() {
    try {
      // Mock API metrics - in production this would track actual API usage
      return {
        requestsPerMinute: 45,
        averageResponseTime: 125,
        errorRate: 0.8,
        topEndpoints: [
          { endpoint: "/api/search", requests: 1250, avgTime: 89 },
          { endpoint: "/api/hardware", requests: 890, avgTime: 156 },
          { endpoint: "/api/builds", requests: 650, avgTime: 203 },
        ],
      };
    } catch {
      return {
        requestsPerMinute: 0,
        averageResponseTime: 0,
        errorRate: 0,
        topEndpoints: [],
      };
    }
  }

  private async getSearchPerformanceMetrics() {
    try {
      // meilisearchService is removed from imports, so this block is commented out
      // const stats = await meilisearchService.getStats(); // meilisearchService is removed from imports, so this block is commented out
      return {
        indexSize: 0, // Placeholder as meilisearchService is removed
        documentsCount: 0, // Placeholder as meilisearchService is removed
        averageSearchTime: 25, // Mock value
        searchesPerMinute: 15, // Mock value
      };
    } catch {
      return {
        indexSize: 0,
        documentsCount: 0,
        averageSearchTime: 0,
        searchesPerMinute: 0,
      };
    }
  }

  private calculateTrend(dates: Date[]): number {
    if (dates.length < 2) return 0;

    // Simple trend calculation based on distribution over time
    const sorted = dates.sort((a, b) => a.getTime() - b.getTime());
    const timeRange = sorted[sorted.length - 1].getTime() - sorted[0].getTime();
    const midpoint = sorted[0].getTime() + timeRange / 2;

    const firstHalf = sorted.filter((d) => d.getTime() <= midpoint).length;
    const secondHalf = sorted.length - firstHalf;

    return firstHalf > 0 ? ((secondHalf - firstHalf) / firstHalf) * 100 : 0;
  }

  // Cache management methods
  // Get cached data with proper type safety and validation
  private getCachedData<T>(
    key: string,
    ttl: number = this.CACHE_TTL,
  ): T | null {
    const entry = this.metricsCache.get(key) as CacheEntry<T> | undefined;

    if (!entry) {
      return null;
    }

    // Check if entry has expired
    if (Date.now() - entry.timestamp > ttl) {
      this.metricsCache.delete(key);
      return null;
    }

    // Validate that we have meaningful data (not empty object or null/undefined)
    if (
      !entry.data ||
      (typeof entry.data === "object" &&
        entry.data !== null &&
        Object.keys(entry.data).length === 0)
    ) {
      this.metricsCache.delete(key); // Remove invalid entries
      return null;
    }

    return entry.data;
  }

  // Set cached data with proper validation
  private setCachedData<T>(
    key: string,
    data: T,
    _ttl: number = this.CACHE_TTL,
  ): void {
    // Only cache valid, non-empty data
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const ttlValue = _ttl;
    if (
      !data ||
      (typeof data === "object" &&
        data !== null &&
        Object.keys(data as Record<string, unknown>).length === 0)
    ) {
      return; // Don't cache empty or invalid data
    }

    this.metricsCache.set(key, {
      data,
      timestamp: Date.now(),
    });

    // Clean up expired entries periodically
    if (this.metricsCache.size > 100) {
      this.cleanupExpiredEntries();
    }
  }
}

export const adminAnalytics = AdminAnalyticsService.getInstance();
