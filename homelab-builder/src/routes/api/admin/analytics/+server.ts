// HOMELAB HARDWARE PLATFORM - ADMIN ANALYTICS API
import { json } from "@sveltejs/kit";
import { error } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { adminAnalytics } from "$lib/server/services/admin-analytics";
import { requireAdminAuth } from "$lib/server/auth";
import { logger } from "$lib/server/logger";
import { z } from "zod";

const analyticsQuerySchema = z.object({
  timeframe: z.enum(["24h", "7d", "30d"]).optional().default("24h"),
  type: z
    .enum(["dashboard", "search", "users", "performance"])
    .optional()
    .default("dashboard"),
});

export const GET: RequestHandler = async ({ url, locals }) => {
  try {
    // Require admin authentication
    const user = await requireAdminAuth(locals);

    // Parse and validate query parameters
    const timeframe = url.searchParams.get("timeframe") || "24h";
    const type = url.searchParams.get("type") || "dashboard";
    const refresh = url.searchParams.get("refresh") === "true";

    const query = analyticsQuerySchema.parse({ timeframe, type });

    logger.info("Admin analytics request", {
      userId: user.id,
      type: query.type,
      timeframe: query.timeframe,
      refresh,
    });

    let data;

    switch (query.type) {
      case "dashboard":
        data = await adminAnalytics.getDashboardMetrics();
        break;

      case "search":
        data = await adminAnalytics.getSearchAnalytics(
          query.timeframe as "24h" | "7d" | "30d",
        );
        break;

      case "users":
        data = await adminAnalytics.getUserAnalytics(
          query.timeframe as "24h" | "7d" | "30d",
        );
        break;

      case "performance":
        data = await adminAnalytics.getPerformanceMetrics();
        break;

      default:
        throw error(400, "Invalid analytics type");
    }

    return json({
      success: true,
      data,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    logger.error("Admin analytics error", err as Error);

    if (err && typeof err === "object" && "status" in err) {
      throw err;
    }

    throw error(500, "Failed to retrieve analytics data");
  }
};

export const POST: RequestHandler = async ({ request, locals }) => {
  try {
    // Require admin authentication
    const user = await requireAdminAuth(locals);

    const body = await request.json();
    const { action, data } = body;

    logger.info("Admin analytics action", {
      userId: user.id,
      action,
      data: data ? Object.keys(data) : [],
    });

    switch (action) {
      case "track_search":
        if (!data.query) {
          throw error(400, "Search query required");
        }
        await adminAnalytics.trackSearchQuery(
          data.query,
          data.userId,
          data.resultsCount || 0,
          data.category,
        );
        break;

      case "track_user_action":
        if (!data.action || !data.userId) {
          throw error(400, "Action and userId required");
        }
        await adminAnalytics.trackUserAction(
          data.action,
          data.userId,
          data.metadata,
        );
        break;

      default:
        throw error(400, "Invalid action");
    }

    return json({
      success: true,
      message: "Action tracked successfully",
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    logger.error("Admin analytics action error", err as Error);

    if (err && typeof err === "object" && "status" in err) {
      throw err;
    }

    throw error(500, "Failed to process analytics action");
  }
};
