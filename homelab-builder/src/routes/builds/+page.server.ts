// BUILDS LISTING PAGE - Server-side data loading
import { db } from "$lib/server/db";
import type { PageServerLoad } from "./$types";
import type { BuildDifficulty, Prisma } from "@prisma/client";

// Type for build with count
type BuildWithCount = Prisma.BuildGetPayload<{
  include: {
    user: {
      select: {
        id: true;
        name: true;
        username: true;
        avatar: true;
      };
    };
    buildItems: {
      include: {
        hardwareItem: true;
      };
    };
    _count: {
      select: {
        buildItems: true;
      };
    };
  };
}>;

export const load: PageServerLoad = async ({ url }) => {
  const search = url.searchParams.get("search") || "";
  const difficulty = url.searchParams.get(
    "difficulty",
  ) as BuildDifficulty | null;
  const sort = url.searchParams.get("sort") || "newest";
  const page = parseInt(url.searchParams.get("page") || "1");
  const limit = 12;
  const skip = (page - 1) * limit;

  // Build where clause with proper Prisma type
  const where: Prisma.BuildWhereInput = {};

  if (search) {
    where.OR = [
      { name: { contains: search } },
      { description: { contains: search } },
    ];
  }

  if (difficulty) {
    where.difficulty = difficulty;
  }

  // Handle sorting
  let orderBy: Prisma.BuildOrderByWithRelationInput = { createdAt: "desc" }; // Default sort
  if (sort === "popular") {
    orderBy = { likeCount: "desc" };
  } else if (sort === "difficulty") {
    orderBy = { difficulty: "asc" }; // Assuming 'difficulty' is a field on Build
  } else if (sort === "name") {
    orderBy = { name: "asc" };
  }

  const [builds, totalCount] = await Promise.all([
    db.build.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            username: true,
            avatar: true,
          },
        },
        buildItems: {
          include: {
            hardwareItem: true,
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
    }) as Promise<BuildWithCount[]>,
    db.build.count({ where }),
  ]);

  return {
    builds: builds.map((build: BuildWithCount) => ({
      ...build,
      totalPrice: build.buildItems.reduce(
        (sum: number, item) =>
          sum + (item.hardwareItem.currentPrice || 0) * item.quantity,
        0,
      ),
      likesCount: build.likeCount,
      itemsCount: build._count.buildItems,
    })),
    totalCount,
    totalPages: Math.ceil(totalCount / limit),
    currentPage: page,
    filters: {
      search,
      difficulty,
      sort,
    },
  };
};
