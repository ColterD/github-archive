import { json } from "@sveltejs/kit";
import { meilisearchService } from "$lib/server/services/meilisearch.js";
import { logger } from "$lib/server/logger.js";
import { z } from "zod";
import type { RequestHandler } from "./$types.js";

// Validation schema for suggestions parameters
const suggestionsParamsSchema = z.object({
  q: z.string().min(1, { error: "Query must be at least 1 character" }),
  limit: z.number().min(1).max(20).optional().default(5),
});

export const GET: RequestHandler = async ({ url }) => {
  try {
    const searchParams = url.searchParams;

    // Parse and validate parameters
    const params = suggestionsParamsSchema.parse({
      q: searchParams.get("q") || "",
      limit: searchParams.get("limit") ? Number(searchParams.get("limit")) : 5,
    });

    // Get suggestions from Meilisearch service
    const suggestions = await meilisearchService.getSuggestions(
      params.q,
      params.limit,
    );

    logger.info("Suggestions request completed", {
      query: params.q,
      suggestionsCount: suggestions.length,
    });

    return json({
      success: true,
      data: {
        query: params.q,
        suggestions,
      },
    });
  } catch (error) {
    logger.error("Suggestions API error:", error as Error);

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
        error: "Suggestions failed",
        message:
          "An error occurred while getting suggestions. Please try again.",
      },
      { status: 500 },
    );
  }
};
