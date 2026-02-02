// HOMELAB HARDWARE PLATFORM - BUILDS API
import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { db } from "$lib/server/db";
import { z } from "zod";
import { logger } from "$lib/server/logger";
import type { Prisma, BuildDifficulty } from "@prisma/client";

// Validation schemas
const CreateBuildSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(1000).optional(),
  difficulty: z
    .enum(["BEGINNER", "INTERMEDIATE", "ADVANCED", "EXPERT"])
    .optional(),
  isPublic: z.boolean().default(true),
  items: z.array(
    z.object({
      hardwareItemId: z.string(),
      quantity: z.number().int().min(1).max(100),
      notes: z.string().max(500).optional(),
    }),
  ),
});

const UpdateBuildSchema = CreateBuildSchema.partial().extend({
  id: z.string(),
});

export const GET: RequestHandler = async ({ url, locals }) => {
  try {
    const userId = locals.user?.id;
    const page = parseInt(url.searchParams.get("page") || "1");
    const limit = parseInt(url.searchParams.get("limit") || "12");
    const search = url.searchParams.get("search") || "";
    const difficulty = url.searchParams.get("difficulty");
    const sort = url.searchParams.get("sort") || "newest";
    const userBuildsOnly = url.searchParams.get("userOnly") === "true";

    const skip = (page - 1) * limit;

    // Build where clause with proper Prisma type
    const where: Prisma.BuildWhereInput = {
      isPublic: true,
    };

    if (userBuildsOnly && userId) {
      where.userId = userId;
      delete where.isPublic; // User can see their private builds
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    if (difficulty) {
      where.difficulty = difficulty as BuildDifficulty;
    }

    // Order by clause with proper Prisma type
    let orderBy: Prisma.BuildOrderByWithRelationInput = { createdAt: "desc" };
    if (sort === "popular") {
      orderBy = { likeCount: "desc" };
    } else if (sort === "name") {
      orderBy = { name: "asc" };
    } else if (sort === "cost") {
      orderBy = { totalCost: "desc" };
    }

    const [builds, totalCount] = await Promise.all([
      db.build.findMany({
        where,
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
                  currentPrice: true,
                  category: true,
                  manufacturerName: true,
                },
              },
            },
          },
          _count: {
            select: {
              buildItems: true,
            },
          },
        },
        orderBy,
        skip,
        take: limit,
      }),
      db.build.count({ where }),
    ]);

    return json({
      builds: builds.map((build) => ({
        ...build,
        itemsCount: build._count.buildItems,
        calculatedTotalCost: build.buildItems.reduce(
          (sum, item) =>
            sum + (item.hardwareItem.currentPrice || 0) * item.quantity,
          0,
        ),
      })),
      totalCount,
      totalPages: Math.ceil(totalCount / limit),
      currentPage: page,
    });
  } catch (error) {
    logger.error("Failed to fetch builds:", error as Error);
    throw new Response("Failed to fetch builds", { status: 500 });
  }
};

export const POST: RequestHandler = async ({ request, locals }) => {
  try {
    const user = locals.user;
    if (!user) {
      return json({ error: "Authentication required" }, { status: 401 });
    }

    const data = await request.json();
    const validatedData = CreateBuildSchema.parse(data);

    // Calculate total cost
    const hardwareItems = await db.hardwareItem.findMany({
      where: {
        id: { in: validatedData.items.map((item) => item.hardwareItemId) },
      },
      select: {
        id: true,
        currentPrice: true,
      },
    });

    const totalCost = validatedData.items.reduce((sum, item) => {
      const hardware = hardwareItems.find((h) => h.id === item.hardwareItemId);
      return sum + (hardware?.currentPrice || 0) * item.quantity;
    }, 0);

    // Generate unique slug
    const baseSlug = validatedData.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

    let slug = baseSlug;
    let counter = 1;
    while (await db.build.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    // Create build with items in a transaction
    const build = await db.$transaction(async (tx) => {
      const newBuild = await tx.build.create({
        data: {
          name: validatedData.name,
          slug,
          description: validatedData.description,
          difficulty: validatedData.difficulty,
          isPublic: validatedData.isPublic,
          totalCost,
          userId: user.id,
        },
      });

      // Create build items
      await tx.buildItem.createMany({
        data: validatedData.items.map((item) => ({
          buildId: newBuild.id,
          hardwareItemId: item.hardwareItemId,
          quantity: item.quantity,
          notes: item.notes,
        })),
      });

      return newBuild;
    });

    logger.info("Build created:", { buildId: build.id, userId: user.id });

    return json(
      {
        success: true,
        build: {
          ...build,
          url: `/builds/${build.slug}`,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    logger.error("Failed to create build:", error as Error);
    throw new Response("Failed to create build", { status: 500 });
  }
};

export const PUT: RequestHandler = async ({ request, locals }) => {
  try {
    const user = locals.user;
    if (!user) {
      return json({ error: "Authentication required" }, { status: 401 });
    }

    const data = await request.json();
    const validatedData = UpdateBuildSchema.parse(data);

    // Check if user owns the build
    const existingBuild = await db.build.findUnique({
      where: { id: validatedData.id },
      select: { userId: true, slug: true },
    });

    if (!existingBuild) {
      return json({ error: "Build not found" }, { status: 404 });
    }

    if (existingBuild.userId !== user.id) {
      return json({ error: "Permission denied" }, { status: 403 });
    }

    // Calculate new total cost if items were updated
    let totalCost: number | undefined;
    if (validatedData.items) {
      const hardwareItems = await db.hardwareItem.findMany({
        where: {
          id: { in: validatedData.items.map((item) => item.hardwareItemId) },
        },
        select: {
          id: true,
          currentPrice: true,
        },
      });

      totalCost = validatedData.items.reduce((sum, item) => {
        const hardware = hardwareItems.find(
          (h) => h.id === item.hardwareItemId,
        );
        return sum + (hardware?.currentPrice || 0) * item.quantity;
      }, 0);
    }

    // Update build in transaction
    const updatedBuild = await db.$transaction(async (tx) => {
      // Update build
      const build = await tx.build.update({
        where: { id: validatedData.id },
        data: {
          ...(validatedData.name && { name: validatedData.name }),
          ...(validatedData.description !== undefined && {
            description: validatedData.description,
          }),
          ...(validatedData.difficulty && {
            difficulty: validatedData.difficulty,
          }),
          ...(validatedData.isPublic !== undefined && {
            isPublic: validatedData.isPublic,
          }),
          ...(totalCost !== undefined && { totalCost }),
        },
      });

      // Update items if provided
      if (validatedData.items) {
        // Delete existing items
        await tx.buildItem.deleteMany({
          where: { buildId: validatedData.id },
        });

        // Create new items
        await tx.buildItem.createMany({
          data: validatedData.items.map((item) => ({
            buildId: validatedData.id,
            hardwareItemId: item.hardwareItemId,
            quantity: item.quantity,
            notes: item.notes,
          })),
        });
      }

      return build;
    });

    logger.info("Build updated:", {
      buildId: validatedData.id,
      userId: user.id,
    });

    return json({
      success: true,
      build: {
        ...updatedBuild,
        url: `/builds/${updatedBuild.slug}`,
      },
    });
  } catch (error) {
    logger.error("Failed to update build:", error as Error);
    throw new Response("Failed to update build", { status: 500 });
  }
};

export const DELETE: RequestHandler = async ({ url, locals }) => {
  try {
    const user = locals.user;
    if (!user) {
      return json({ error: "Authentication required" }, { status: 401 });
    }

    const buildId = url.searchParams.get("id");
    if (!buildId) {
      return json({ error: "Build ID required" }, { status: 400 });
    }

    // Check if user owns the build
    const existingBuild = await db.build.findUnique({
      where: { id: buildId },
      select: { userId: true },
    });

    if (!existingBuild) {
      return json({ error: "Build not found" }, { status: 404 });
    }

    if (existingBuild.userId !== user.id) {
      return json({ error: "Permission denied" }, { status: 403 });
    }

    // Delete build (items will be cascade deleted)
    await db.build.delete({
      where: { id: buildId },
    });

    logger.info("Build deleted:", { buildId, userId: user.id });

    return json({ success: true });
  } catch (error) {
    logger.error("Failed to delete build:", error as Error);
    throw new Response("Failed to delete build", { status: 500 });
  }
};
