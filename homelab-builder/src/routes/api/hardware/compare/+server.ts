import { json, error } from "@sveltejs/kit";
import {
  hardwareComparisonService,
  ComparisonRequestSchema,
} from "$lib/server/services/hardware-comparison.js";
import { logger } from "$lib/server/logger.js";
import type { RequestHandler } from "./$types";
import { z } from "zod";

// Compare multiple hardware items side-by-side
export const POST: RequestHandler = async ({ request }) => {
  try {
    const body = await request.json();
    const { itemIds } = ComparisonRequestSchema.parse(body);

    logger.info("Hardware comparison request:", {
      itemIds,
      count: itemIds.length,
    });

    // Perform hardware comparison
    const comparison = await hardwareComparisonService.compareHardware(itemIds);

    // Log successful comparison
    logger.info("Hardware comparison completed:", {
      itemCount: comparison.metadata.itemCount,
      categories: comparison.metadata.categories,
      compatibilityScore: comparison.compatibility.overallScore,
    });

    return json({
      success: true,
      data: comparison,
    });
  } catch (err) {
    logger.error("Hardware comparison service error:", err as Error);
    throw error(500, "Failed to compare hardware items");
  }
};

const querySchema = z.object({
  ids: z.string(), // comma-separated hardware IDs
});

export const GET: RequestHandler = async ({ url }) => {
  const query = Object.fromEntries(url.searchParams.entries());
  const parsed = querySchema.safeParse(query);
  if (!parsed.success) {
    return new Response(JSON.stringify({ error: "Invalid query parameters" }), {
      status: 400,
    });
  }
  // Placeholder: return empty comparison
  return new Response(JSON.stringify({ items: [] }), { status: 200 });
};
