import { json } from "@sveltejs/kit";
import { error } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { priceTrackingService } from "$lib/server/services/price-tracking";
import { logger } from "$lib/server/logger";

export const GET: RequestHandler = async ({ params, url }) => {
  try {
    const { id } = params;
    const days = parseInt(url.searchParams.get("days") || "30");

    // Get price history
    const priceHistory = await priceTrackingService.getPriceHistory(id, days);

    // Get price statistics
    const priceStats = await priceTrackingService.getPriceStatistics(id);

    return json({
      success: true,
      data: {
        history: priceHistory,
        statistics: priceStats,
      },
    });
  } catch (err) {
    logger.error("Price history service error:", err as Error);
    throw error(500, "Failed to retrieve price history");
  }
};
