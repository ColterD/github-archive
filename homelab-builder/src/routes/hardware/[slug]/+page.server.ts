// HARDWARE ITEM DETAIL PAGE - Server-side data loading
import type { PageServerLoad } from "./$types";
import { error } from "@sveltejs/kit";
import { hardwareService } from "$lib/server/services/hardware";
import { logger } from "$lib/server/logger";

// Type for hardware item with id property for filtering
interface HardwareItemWithId {
  id: string;
  [key: string]: unknown;
}

export const load: PageServerLoad = async ({ params }) => {
  try {
    // Find hardware by slug
    const hardwareItem = await hardwareService.findBySlug(params.slug);

    if (!hardwareItem) {
      throw error(404, "Hardware item not found");
    }

    // Get price history
    const priceHistory = await hardwareService.getPriceHistory(hardwareItem.id);

    // Get related items (same category)
    const relatedItemsResult = await hardwareService.getByCategory(
      hardwareItem.category,
      1,
      4,
    );

    return {
      item: hardwareItem,
      priceHistory,
      relatedItems: relatedItemsResult.items.filter(
        (related: HardwareItemWithId) => related.id !== hardwareItem.id,
      ),
    };
  } catch (err) {
    logger.error('Error loading hardware item', err instanceof Error ? err : new Error(String(err)));

    if (err && typeof err === "object" && "status" in err) {
      throw err;
    }

    throw error(500, "Failed to load hardware item");
  }
};
