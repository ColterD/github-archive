import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { db } from "$lib/server/db";
import { logger } from "$lib/server/logger";
import type { Prisma } from "@prisma/client";

// GET /api/builds/discover - Advanced build discovery with filtering and recommendations
export const GET: RequestHandler = async ({ url, locals }) => {
  try {
    const userId = locals.user?.id;

    // Query parameters
    const category = url.searchParams.get("category");
    const minBudget = parseFloat(url.searchParams.get("minBudget") || "0");
    const maxBudget = parseFloat(url.searchParams.get("maxBudget") || "999999");
    const sortBy = url.searchParams.get("sortBy") || "popular"; // popular, newest, budget, rating
    const tags = url.searchParams.get("tags")?.split(",").filter(Boolean) || [];
    const limit = parseInt(url.searchParams.get("limit") || "20");
    const offset = parseInt(url.searchParams.get("offset") || "0");
    // Build where clause
    const whereClause: Prisma.BuildWhereInput = {
      isDeleted: false,
      isHidden: false,
      totalPrice: {
        gte: minBudget,
        lte: maxBudget,
      },
    };

    if (category) {
      whereClause.category = category;
    }

    if (tags.length > 0) {
      // For JSON string tags, we need to use contains for each tag
      whereClause.OR = tags.map(tag => ({
        tags: {
          contains: tag
        }
      }));
    }

    // Build order clause based on sortBy
    let orderBy:
      | Prisma.BuildOrderByWithRelationInput
      | Prisma.BuildOrderByWithRelationInput[] = {};
    switch (sortBy) {
      case "newest":
        orderBy = { createdAt: "desc" };
        break;
      case "budget":
        orderBy = { totalPrice: "asc" };
        break;
      case "rating":
        orderBy = { averageRating: "desc" };
        break;
      case "popular":
      default:
        // Sort by a combination of views, likes, and recency
        orderBy = [{ viewCount: "desc" }, { createdAt: "desc" }];
        break;
    }

    // Get builds with related data
    const builds = await db.build.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
        buildItems: {
          include: {
            hardwareItem: {
              select: {
                id: true,
                name: true,
                category: true,
                currentPrice: true,
                images: true,
              },
            },
          },
        },
        _count: {
          select: {
            reviews: true,
            likes: true,
          },
        },
      },
      orderBy,
      skip: offset,
      take: limit,
    });

    // Get total count for pagination
    const totalCount = await db.build.count({ where: whereClause });

    // Get all user likes in a single query to avoid N+1 problem
    let userLikes: Set<string> = new Set();
    if (userId) {
      const likes = await db.buildLike.findMany({
        where: {
          userId,
          buildId: { in: builds.map((b) => b.id) },
        },
        select: { buildId: true },
      });
      userLikes = new Set(likes.map((like) => like.buildId));
    }

    // Format builds for response
    const formattedBuilds = builds.map((build) => {
      // Check if current user has liked this build
      const isLiked = userLikes.has(build.id);

      // Get primary hardware categories
      const categories = [
        ...new Set(build.buildItems.map((item) => item.hardwareItem.category)),
      ];

      return {
        id: build.id,
        name: build.name,
        description: build.description,
        category: build.category,
        tags: build.tags ? JSON.parse(build.tags) : [],
        totalPrice: build.totalPrice,
        averageRating: build.averageRating || 0,
        viewCount: build.viewCount || 0,
        likeCount: build._count.likes,
        reviewCount: build._count.reviews,
        isLiked,
        createdAt: build.createdAt.toISOString(),
        updatedAt: build.updatedAt.toISOString(),
        user: build.user,
        hardwareCategories: categories,
        componentCount: build.buildItems.length,
        featuredComponents: build.buildItems.slice(0, 3).map((item) => ({
          id: item.hardwareItem.id,
          name: item.hardwareItem.name,
          category: item.hardwareItem.category,
          quantity: item.quantity,
          price: item.hardwareItem.currentPrice,
        })),
      };
    });

    // Get recommendations if user is logged in
    let recommendations: Array<{
      id: string;
      name: string;
      category: string | null;
      totalPrice: number | null;
      averageRating: number | null;
      user: { name: string | null };
    }> = [];
    if (userId && offset === 0) {
      // Get user's build history and preferences
      const userBuilds = await db.build.findMany({
        where: { userId },
        select: { category: true, tags: true, totalPrice: true },
        take: 10,
      });

      const userLikes = await db.buildLike.findMany({
        where: { userId },
        include: {
          build: {
            select: { category: true, tags: true, totalPrice: true },
          },
        },
        take: 20,
      });

      // Extract user preferences
      const allUserBuilds = [
        ...userBuilds,
        ...userLikes.map((like) => like.build),
      ];

      const preferredCategories = [
        ...new Set(
          allUserBuilds
            .map((build) => build.category)
            .filter((cat): cat is string => Boolean(cat)),
        ),
      ];

      const preferredTags = [
        ...new Set(allUserBuilds.flatMap((build) => {
          try {
            return build.tags ? JSON.parse(build.tags) : [];
          } catch {
            return [];
          }
        })),
      ];

      const avgBudget =
        allUserBuilds.length > 0
          ? allUserBuilds.reduce(
              (sum, build) => sum + (build.totalPrice || 0),
              0,
            ) / allUserBuilds.length
          : 1000;

      // Find recommended builds
      if (preferredCategories.length > 0 || preferredTags.length > 0) {
        const recommendationWhere: Prisma.BuildWhereInput = {
          isDeleted: false,
          isHidden: false,
          userId: { not: userId }, // Exclude user's own builds
          OR: [] as Prisma.BuildWhereInput[],
        };

        if (preferredCategories.length > 0) {
          recommendationWhere.OR!.push({
            category: { in: preferredCategories },
          });
        }

        if (preferredTags.length > 0) {
          recommendationWhere.OR!.push({
            OR: preferredTags.map(tag => ({
              tags: {
                contains: tag
              }
            }))
          });
        }

        // Budget-based recommendations (within 50% of user's average)
        recommendationWhere.OR!.push({
          totalPrice: {
            gte: avgBudget * 0.5,
            lte: avgBudget * 1.5,
          },
        });

        recommendations = await db.build.findMany({
          where: recommendationWhere,
          select: {
            id: true,
            name: true,
            category: true,
            totalPrice: true,
            averageRating: true,
            user: {
              select: { name: true },
            },
          },
          orderBy: [{ averageRating: "desc" }, { createdAt: "desc" }],
          take: 5,
        });
      }
    }

    return json({
      builds: formattedBuilds,
      recommendations: recommendations.map((rec) => ({
        id: rec.id,
        name: rec.name,
        category: rec.category,
        totalPrice: rec.totalPrice,
        averageRating: rec.averageRating || 0,
        userName: rec.user.name,
      })),
      pagination: {
        total: totalCount,
        limit,
        offset,
        hasMore: offset + limit < totalCount,
      },
      filters: {
        category,
        minBudget,
        maxBudget,
        sortBy,
        tags,
      },
    });
  } catch (error) {
    logger.error(`Failed to discover builds: ${(error as Error).message}`);
    return json({ error: "Failed to discover builds" }, { status: 500 });
  }
};
