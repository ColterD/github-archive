import { json } from "@sveltejs/kit";
import { meilisearchService } from "$lib/server/services/meilisearch.js";
import { logger } from "$lib/server/logger.js";
import { z } from "zod";
import type { RequestHandler } from "./$types.js";

// Validation schema for similar items parameters
const similarItemsParamsSchema = z.object({
  limit: z.number().min(1).max(20).optional().default(5),
});

export const GET: RequestHandler = async ({ params, url }) => {
  try {
    const { id } = params;
    const searchParams = url.searchParams;

    if (!id) {
      return json(
        {
          success: false,
          error: "Missing item ID",
        },
        { status: 400 },
      );
    }

    // Parse and validate parameters
    const queryParams = similarItemsParamsSchema.parse({
      limit: searchParams.get("limit") ? Number(searchParams.get("limit")) : 5,
    });

    // Get similar items from Meilisearch service
    const similarItems = await meilisearchService.getSimilarItems(
      id,
      queryParams.limit,
    );

    logger.info("Similar items request completed", {
      itemId: id,
      similarItemsCount: similarItems.length,
    });

    return json({
      success: true,
      data: {
        itemId: id,
        similarItems,
      },
    });
  } catch (error) {
    logger.error("Similar items API error:", error as Error);

    if (error instanceof z.ZodError) {
      return json(
        {
          success: false,
          error: "Invalid parameters",
          details: error.issues,
        },
        { status: 400 },
      );
    }

    return json(
      {
        success: false,
        error: "Similar items lookup failed",
        message:
          "An error occurred while finding similar items. Please try again.",
      },
      { status: 500 },
    );
  }
};
