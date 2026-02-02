import { json } from "@sveltejs/kit";
import { error } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { priceTrackingService } from "$lib/server/services/price-tracking";
import { logger } from "$lib/server/logger";

export const POST: RequestHandler = async ({ request }) => {
  try {
    const { itemId, action } = await request.json();

    if (action === "enable") {
      await priceTrackingService.enableTracking(itemId);
    } else if (action === "disable") {
      await priceTrackingService.disableTracking(itemId);
    } else {
      throw error(400, "Invalid action");
    }

    return json({
      success: true,
      message: `Price tracking ${action}d for item`,
    });
  } catch (err) {
    logger.error("Price tracking service error:", err as Error);
    throw error(500, "Failed to update price tracking");
  }
};

export const PUT: RequestHandler = async ({ request }) => {
  try {
    const { itemId } = await request.json();

    // For now, just log the request since updateItemPrice is private
    // In a real implementation, you'd need to create a public method for this
    logger.info(`Manual price update requested for item ${itemId}`);

    return json({
      success: true,
      message: "Price update request logged",
    });
  } catch (err) {
    logger.error("Price update service error:", err as Error);
    throw error(500, "Failed to update price");
  }
};
