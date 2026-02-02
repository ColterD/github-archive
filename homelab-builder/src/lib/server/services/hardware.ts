// HARDWARE SERVICE - Cached Database Operations
// Provides cached database operations for hardware-related queries
// Updated: 2025-01-16 - Fixed TypeScript errors and type safety

import { db } from "$lib/server/db";
import { redis } from "$lib/server/redis";
import { logger } from "$lib/server/logger";
import {
  HardwareCategory,
  HardwareStatus,
  HardwareCondition,
  type Prisma,
} from "@prisma/client";

export interface HardwareSearchParams {
  query?: string;
  category?: HardwareCategory;
  manufacturer?: string;
  priceMin?: number;
  priceMax?: number;
  condition?: HardwareCondition;
  sort?: string;
  page?: number;
  limit?: number;
}

export interface HardwareSearchResult {
  items: Array<{
    id: string;
    name: string;
    description?: string;
    category: HardwareCategory;
    condition: HardwareCondition;
    currentPrice: number;
    manufacturer?: {
      name: string;
      logoUrl?: string;
    };
    averageRating?: number;
    _count: {
      reviews: number;
    };
  }>;
  totalCount: number;
  totalPages: number;
  currentPage: number;
  filters: {
    categories: Array<{
      value: HardwareCategory;
      label: string;
      count: number;
    }>;
    manufacturers: Array<{ value: string; label: string; count: number }>;
    priceRanges: Array<{ min: number; max: number; count: number }>;
  };
}

export class HardwareService {
  private CACHE_PREFIX = "hardware:";
  private CACHE_TTL = 300; // 5 minutes

  private getCacheKey(
    operation: string,
    params: HardwareSearchParams | Record<string, unknown>,
  ): string {
    const paramsString = JSON.stringify(params);
    return `${this.CACHE_PREFIX}${operation}:${Buffer.from(paramsString).toString("base64")}`;
  }

  async search(params: HardwareSearchParams): Promise<HardwareSearchResult> {
    const cacheKey = this.getCacheKey("search", params);

    try {
      const cached = await redis?.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }
    } catch (error) {
      logger.warn("Cache read error:", {
        error: error instanceof Error ? error.message : String(error),
      });
    }

    const {
      query = "",
      category,
      manufacturer,
      priceMin = 0,
      priceMax = 999999,
      condition,
      sort = "name-asc",
      page = 1,
      limit = 24,
    } = params;

    const skip = (page - 1) * limit;

    // Build where clause
    const where: Prisma.HardwareItemWhereInput = {
      status: HardwareStatus.ACTIVE,
      currentPrice: {
        gte: priceMin,
        lte: priceMax,
      },
    };

    if (query.trim()) {
      where.OR = [
        { name: { contains: query } },
        { description: { contains: query } },
        { specifications: { contains: query } },
      ];
    }

    if (category) {
      where.category = category;
    }

    if (manufacturer) {
      where.manufacturer = { name: manufacturer };
    }

    if (condition) {
      where.condition = condition;
    }

    // Build order by clause
    let orderBy: Prisma.HardwareItemOrderByWithRelationInput = { name: "asc" };
    switch (sort) {
      case "price-asc":
        orderBy = { currentPrice: "asc" };
        break;
      case "price-desc":
        orderBy = { currentPrice: "desc" };
        break;
      case "name-desc":
        orderBy = { name: "desc" };
        break;
      case "newest":
        orderBy = { createdAt: "desc" };
        break;
      case "rating":
        orderBy = { averageRating: "desc" };
        break;
      default:
        orderBy = { name: "asc" };
    }

    try {
      const [rawItems, totalCount] = await Promise.all([
        db.hardwareItem.findMany({
          where,
          include: {
            manufacturer: {
              select: {
                name: true,
                logoUrl: true,
              },
            },
            _count: {
              select: {
                reviews: true,
                favorites: true,
              },
            },
          },
          orderBy,
          skip,
          take: limit,
        }),
        db.hardwareItem.count({ where }),
      ]);

      // Transform to match interface (handle null descriptions and prices)
      const items = rawItems.map((item) => ({
        id: item.id,
        name: item.name,
        description: item.description || undefined,
        category: item.category,
        condition: item.condition,
        currentPrice: item.currentPrice || 0,
        manufacturer: item.manufacturer
          ? {
              name: item.manufacturer.name,
              logoUrl: item.manufacturer.logoUrl || undefined,
            }
          : undefined,
        averageRating: item.averageRating || undefined,
        _count: item._count,
      }));

      // Get filter aggregations with optimized single query approach
      const [categories, manufacturersWithNames] = await Promise.all([
        db.hardwareItem.groupBy({
          by: ["category"],
          _count: { category: true },
          where: {
            status: HardwareStatus.ACTIVE,
          },
        }),
        // Optimized: Single query with aggregation and join to get manufacturer names
        db.manufacturer.findMany({
          select: {
            id: true,
            name: true,
            _count: {
              select: {
                hardwareItems: {
                  where: {
                    status: HardwareStatus.ACTIVE,
                  },
                },
              },
            },
          },
          where: {
            hardwareItems: {
              some: {
                status: HardwareStatus.ACTIVE,
              },
            },
          },
          orderBy: {
            hardwareItems: {
              _count: "desc",
            },
          },
          take: 20,
        }),
      ]);

      const result: HardwareSearchResult = {
        items,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
        currentPage: page,
        filters: {
          categories: categories.map((c) => ({
            value: c.category,
            label: c.category
              .replace("_", " ")
              .toLowerCase()
              .replace(/\b\w/g, (l) => l.toUpperCase()),
            count: c._count.category,
          })),
          manufacturers: manufacturersWithNames.map((m) => ({
            value: m.name,
            label: m.name,
            count: m._count.hardwareItems,
          })),
          priceRanges: [
            { min: 0, max: 100, count: 0 },
            { min: 100, max: 500, count: 0 },
            { min: 500, max: 1000, count: 0 },
            { min: 1000, max: 5000, count: 0 },
            { min: 5000, max: 999999, count: 0 },
          ],
        },
      };

      // Cache the result
      try {
        await redis?.setex(cacheKey, this.CACHE_TTL, JSON.stringify(result));
      } catch (error) {
        logger.warn("Cache write error:", {
          error: error instanceof Error ? error.message : String(error),
        });
      }

      return result;
    } catch (error) {
      logger.error(
        `Hardware search error: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw error;
    }
  }

  async findBySlug(slug: string) {
    try {
      const item = await db.hardwareItem.findUnique({
        where: { slug },
        include: {
          manufacturer: {
            select: {
              name: true,
              logoUrl: true,
              website: true,
            },
          },
          reviews: {
            include: {
              user: {
                select: {
                  name: true,
                  username: true,
                  avatar: true,
                },
              },
            },
            orderBy: { createdAt: "desc" },
            take: 10,
          },
          _count: {
            select: {
              reviews: true,
              favorites: true,
            },
          },
        },
      });

      return item;
    } catch (error) {
      logger.error("Find by slug error:", error as Error);
      throw error;
    }
  }

  async getPriceHistory(hardwareItemId: string) {
    try {
      const history = await db.priceHistory.findMany({
        where: { hardwareId: hardwareItemId },
        orderBy: { timestamp: "desc" },
        take: 30, // Last 30 price points
      });

      return history;
    } catch (error) {
      logger.error("Price history error:", error as Error);
      return [];
    }
  }

  async getByCategory(
    category: HardwareCategory,
    page: number = 1,
    limit: number = 12,
  ) {
    try {
      const skip = (page - 1) * limit;

      const [items, totalCount] = await Promise.all([
        db.hardwareItem.findMany({
          where: {
            category,
            status: HardwareStatus.ACTIVE,
          },
          include: {
            manufacturer: {
              select: {
                name: true,
                logoUrl: true,
              },
            },
            _count: {
              select: {
                reviews: true,
                favorites: true,
              },
            },
          },
          orderBy: { averageRating: "desc" },
          skip,
          take: limit,
        }),
        db.hardwareItem.count({
          where: {
            category,
            status: HardwareStatus.ACTIVE,
          },
        }),
      ]);

      return {
        items,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
        currentPage: page,
      };
    } catch (error) {
      logger.error("Get by category error:", error as Error);
      throw error;
    }
  }

  async getById(id: string) {
    try {
      return await db.hardwareItem.findUnique({
        where: { id },
        include: {
          manufacturer: {
            select: {
              name: true,
              logoUrl: true,
              website: true,
            },
          },
        },
      });
    } catch (error) {
      logger.error("Get by ID error:", error as Error);
      throw error;
    }
  }

  async getSuggestions(query: string, limit: number = 5) {
    try {
      const cacheKey = this.getCacheKey("suggestions", { query, limit });

      const cached = await redis?.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }

      const suggestions = await db.hardwareItem.findMany({
        where: {
          OR: [
            { name: { contains: query } },
            { description: { contains: query } },
          ],
          status: HardwareStatus.ACTIVE,
        },
        select: {
          name: true,
          category: true,
          currentPrice: true,
        },
        take: limit,
        orderBy: { averageRating: "desc" },
      });

      await redis?.setex(cacheKey, this.CACHE_TTL, JSON.stringify(suggestions));
      return suggestions;
    } catch (error) {
      logger.error("Get suggestions error:", error as Error);
      return [];
    }
  }

  async getFeatured(limit: number = 8) {
    try {
      const cacheKey = this.getCacheKey("featured", { limit });

      const cached = await redis?.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }

      const featured = await db.hardwareItem.findMany({
        where: {
          status: HardwareStatus.ACTIVE,
          averageRating: { gte: 4.0 },
        },
        include: {
          manufacturer: {
            select: {
              name: true,
              logoUrl: true,
            },
          },
          _count: {
            select: {
              reviews: true,
              favorites: true,
            },
          },
        },
        orderBy: [{ averageRating: "desc" }, { reviewCount: "desc" }],
        take: limit,
      });

      await redis?.setex(cacheKey, this.CACHE_TTL, JSON.stringify(featured));
      return featured;
    } catch (error) {
      logger.error("Get featured error:", error as Error);
      return [];
    }
  }

  async getTrending(limit: number = 8) {
    try {
      const cacheKey = this.getCacheKey("trending", { limit });

      const cached = await redis?.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }

      // Get trending based on recent view count and reviews
      const trending = await db.hardwareItem.findMany({
        where: {
          status: HardwareStatus.ACTIVE,
          createdAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
          },
        },
        include: {
          manufacturer: {
            select: {
              name: true,
              logoUrl: true,
            },
          },
          _count: {
            select: {
              reviews: true,
              favorites: true,
            },
          },
        },
        orderBy: [{ viewCount: "desc" }, { reviewCount: "desc" }],
        take: limit,
      });

      await redis?.setex(cacheKey, this.CACHE_TTL, JSON.stringify(trending));
      return trending;
    } catch (error) {
      logger.error("Get trending error:", error as Error);
      return [];
    }
  }
}

// Manufacturer Service
export class ManufacturerService {
  async getAll() {
    try {
      return await db.manufacturer.findMany({
        orderBy: { name: "asc" },
      });
    } catch (error) {
      logger.error("Get all manufacturers error:", error as Error);
      return [];
    }
  }

  async getById(id: string) {
    try {
      return await db.manufacturer.findUnique({
        where: { id },
        include: {
          hardwareItems: {
            where: { status: HardwareStatus.ACTIVE },
            take: 10,
            orderBy: { averageRating: "desc" },
          },
        },
      });
    } catch (error) {
      logger.error("Get manufacturer by ID error:", error as Error);
      return null;
    }
  }
}

// Trending Service
export class TrendingService {
  async getHardware(limit: number = 10) {
    try {
      return await db.hardwareItem.findMany({
        where: {
          status: HardwareStatus.ACTIVE,
        },
        include: {
          manufacturer: {
            select: {
              name: true,
              logoUrl: true,
            },
          },
        },
        orderBy: [{ viewCount: "desc" }, { averageRating: "desc" }],
        take: limit,
      });
    } catch (error) {
      logger.error("Get trending hardware error:", error as Error);
      return [];
    }
  }

  async getBuilds(limit: number = 10) {
    try {
      return await db.build.findMany({
        where: {
          isPublic: true,
        },
        include: {
          user: {
            select: {
              name: true,
              username: true,
              avatar: true,
            },
          },
          _count: {
            select: {
              buildItems: true,
            },
          },
        },
        orderBy: [{ viewCount: "desc" }, { likeCount: "desc" }],
        take: limit,
      });
    } catch (error) {
      logger.error("Get trending builds error:", error as Error);
      return [];
    }
  }
}

// Export service instances
export const hardwareService = new HardwareService();
export const manufacturerService = new ManufacturerService();
export const trendingService = new TrendingService();
