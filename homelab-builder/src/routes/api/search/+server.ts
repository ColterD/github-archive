import { json } from "@sveltejs/kit";
import { meilisearchService } from "$lib/server/services/meilisearch.js";
import type { MeilisearchSearchParams } from "$lib/server/services/meilisearch.js";
import { logger } from "$lib/server/logger.js";
import { z } from "zod";
import type { RequestHandler } from "./$types.js";
import type { HardwareCategory, HardwareCondition } from "@prisma/client";

// Validation schema for search parameters
const searchParamsSchema = z.object({
  q: z.string().optional().default(""),
  category: z
    .enum(["SERVER", "NETWORKING", "STORAGE", "COMPUTE", "MEMORY", "OTHER"])
    .optional(),
  manufacturer: z.string().optional(),
  condition: z.enum(["NEW", "REFURBISHED", "USED", "FOR_PARTS"]).optional(),
  priceMin: z.number().min(0).optional(),
  priceMax: z.number().min(0).optional(),
  sort: z
    .enum([
      "relevance",
      "price-asc",
      "price-desc",
      "rating",
      "newest",
      "popular",
    ])
    .optional()
    .default("relevance"),
  limit: z.number().min(1).max(100).optional().default(20),
  offset: z.number().min(0).optional().default(0),
  facets: z.array(z.string()).optional().default([]),
});

export const GET: RequestHandler = async ({ url }) => {
  try {
    const searchParams = url.searchParams;

    // Parse and validate search parameters
    const params = searchParamsSchema.parse({
      q: searchParams.get("q") || "",
      category: searchParams.get("category") || undefined,
      manufacturer: searchParams.get("manufacturer") || undefined,
      condition: searchParams.get("condition") || undefined,
      priceMin: searchParams.get("priceMin")
        ? Number(searchParams.get("priceMin"))
        : undefined,
      priceMax: searchParams.get("priceMax")
        ? Number(searchParams.get("priceMax"))
        : undefined,
      sort: searchParams.get("sort") || "relevance",
      limit: searchParams.get("limit") ? Number(searchParams.get("limit")) : 20,
      offset: searchParams.get("offset")
        ? Number(searchParams.get("offset"))
        : 0,
      facets: searchParams.get("facets")
        ? searchParams.get("facets")!.split(",")
        : [],
    });

    // Perform search using Meilisearch service
    const meilisearchParams: MeilisearchSearchParams = {
      query: params.q,
      category: params.category as HardwareCategory | undefined,
      manufacturer: params.manufacturer,
      condition: params.condition as HardwareCondition | undefined,
      priceMin: params.priceMin,
      priceMax: params.priceMax,
      sort: params.sort,
      limit: params.limit,
      offset: params.offset,
      facets: params.facets,
    };

    const searchResult = await meilisearchService.search(meilisearchParams);

    logger.info("Search request completed", {
      query: params.q,
      totalHits: searchResult.totalHits,
      processingTimeMs: searchResult.processingTimeMs,
    });

    return json({
      success: true,
      data: searchResult,
      meta: {
        query: params.q,
        filters: {
          category: params.category,
          manufacturer: params.manufacturer,
          condition: params.condition,
          priceRange:
            params.priceMin || params.priceMax
              ? {
                  min: params.priceMin,
                  max: params.priceMax,
                }
              : undefined,
        },
        sort: params.sort,
        pagination: {
          limit: params.limit,
          offset: params.offset,
          page: Math.floor(params.offset / params.limit) + 1,
          totalPages: searchResult.totalPages,
          totalItems: searchResult.totalHits,
        },
      },
    });
  } catch (error) {
    logger.error("Search API error:", error as Error);

    if (error instanceof z.ZodError) {
      return json(
        {
          success: false,
          error: "Invalid search parameters",
          details: error.issues,
        },
        { status: 400 },
      );
    }

    return json(
      {
        success: false,
        error: "Search failed",
        message: "An error occurred while searching. Please try again.",
      },
      { status: 500 },
    );
  }
};

export const POST: RequestHandler = async ({ request }) => {
  try {
    const body = await request.json();

    // Parse and validate search parameters
    const params = searchParamsSchema.parse(body);

    // Perform search using Meilisearch service
    const meilisearchParams: MeilisearchSearchParams = {
      query: params.q,
      category: params.category as HardwareCategory | undefined,
      manufacturer: params.manufacturer,
      condition: params.condition as HardwareCondition | undefined,
      priceMin: params.priceMin,
      priceMax: params.priceMax,
      sort: params.sort,
      limit: params.limit,
      offset: params.offset,
      facets: params.facets,
    };

    const searchResult = await meilisearchService.search(meilisearchParams);

    logger.info("Search request completed", {
      query: params.q,
      totalHits: searchResult.totalHits,
      processingTimeMs: searchResult.processingTimeMs,
    });

    return json({
      success: true,
      data: searchResult,
      meta: {
        query: params.q,
        filters: {
          category: params.category,
          manufacturer: params.manufacturer,
          condition: params.condition,
          priceRange:
            params.priceMin || params.priceMax
              ? {
                  min: params.priceMin,
                  max: params.priceMax,
                }
              : undefined,
        },
        sort: params.sort,
        pagination: {
          limit: params.limit,
          offset: params.offset,
          page: Math.floor(params.offset / params.limit) + 1,
          totalPages: searchResult.totalPages,
          totalItems: searchResult.totalHits,
        },
      },
    });
  } catch (error) {
    logger.error("Search API error:", error as Error);

    if (error instanceof z.ZodError) {
      return json(
        {
          success: false,
          error: "Invalid search parameters",
          details: error.issues,
        },
        { status: 400 },
      );
    }

    return json(
      {
        success: false,
        error: "Search failed",
        message: "An error occurred while searching. Please try again.",
      },
      { status: 500 },
    );
  }
};
