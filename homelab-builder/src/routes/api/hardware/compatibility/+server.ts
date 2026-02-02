import { json, error } from "@sveltejs/kit";
import {
  hardwareComparisonService,
  ComparisonRequestSchema,
} from "$lib/server/services/hardware-comparison.js";
import { logger } from "$lib/server/logger.js";
import type { RequestHandler } from "./$types";

// Check compatibility between multiple hardware items
export const POST: RequestHandler = async ({ request }) => {
  try {
    const body = await request.json();
    const { itemIds } = ComparisonRequestSchema.parse(body);

    logger.info("Hardware compatibility check request:", {
      itemIds,
      count: itemIds.length,
    });

    // Check hardware compatibility
    const matrix = await hardwareComparisonService.checkCompatibility(itemIds);

    // Count compatibility issues
    const totalIssues = matrix.compatibility.reduce(
      (total, pair) => total + pair.issues.length,
      0,
    );
    const errorIssues = matrix.compatibility.reduce(
      (total, pair) =>
        total +
        pair.issues.filter((issue) => issue.severity === "error").length,
      0,
    );

    logger.info("Hardware compatibility check completed:", {
      itemCount: matrix.items.length,
      totalIssues,
      errorIssues,
      compatible: errorIssues === 0,
    });

    return json({
      success: true,
      data: matrix,
    });
  } catch (err) {
    logger.error("Compatibility check service error:", err as Error);
    throw error(500, "Failed to check hardware compatibility");
  }
};
