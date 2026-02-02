import { json } from "@sveltejs/kit";
import { meilisearchService } from "$lib/server/services/meilisearch.js";
import { logger } from "$lib/server/logger.js";
import { z } from "zod";
import type { RequestHandler } from "./$types.js";

// Validation schema for sync parameters
const syncParamsSchema = z.object({
  action: z.enum([
    "sync-hardware",
    "sync-manufacturers",
    "sync-all",
    "init-indexes",
    "get-stats",
  ]),
  force: z.boolean().optional().default(false),
});

export const POST: RequestHandler = async ({ request, locals }) => {
  try {
    // Check if user is authenticated and has admin role
    const session = await locals.auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return json(
        {
          success: false,
          error: "Unauthorized",
        },
        { status: 401 },
      );
    }

    const body = await request.json();

    // Parse and validate parameters
    const params = syncParamsSchema.parse(body);

    let result;
    let message;

    switch (params.action) {
      case "init-indexes":
        await meilisearchService.initializeIndexes();
        message = "Meilisearch indexes initialized successfully";
        result = { initialized: true };
        break;

      case "sync-hardware":
        result = await meilisearchService.syncHardwareItems();
        message = "Hardware items synced to Meilisearch";
        break;

      case "sync-manufacturers":
        result = await meilisearchService.syncManufacturers();
        message = "Manufacturers synced to Meilisearch";
        break;

      case "sync-all": {
        const [hardwareTask, manufacturersTask] = await Promise.all([
          meilisearchService.syncHardwareItems(),
          meilisearchService.syncManufacturers(),
        ]);
        result = { hardware: hardwareTask, manufacturers: manufacturersTask };
        message = "All data synced to Meilisearch";
        break;
      }

      case "get-stats":
        result = await meilisearchService.getStats();
        message = "Meilisearch stats retrieved";
        break;

      default:
        return json(
          {
            success: false,
            error: "Invalid action",
          },
          { status: 400 },
        );
    }

    logger.info("Meilisearch admin action completed", {
      action: params.action,
      user: session.user.email,
      result: typeof result === "object" ? Object.keys(result) : result,
    });

    return json({
      success: true,
      message,
      data: result,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error("Meilisearch admin API error:", error as Error);

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
        error: "Admin operation failed",
        message: "An error occurred while performing the admin operation.",
      },
      { status: 500 },
    );
  }
};

export const GET: RequestHandler = async ({ locals }) => {
  try {
    // Check if user is authenticated and has admin role
    const session = await locals.auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return json(
        {
          success: false,
          error: "Unauthorized",
        },
        { status: 401 },
      );
    }

    // Get Meilisearch health and stats
    const [healthCheck, stats] = await Promise.all([
      meilisearchService.healthCheck(),
      meilisearchService.getStats(),
    ]);

    return json({
      success: true,
      data: {
        health: {
          status: healthCheck ? "healthy" : "unhealthy",
          timestamp: new Date().toISOString(),
        },
        stats,
        actions: [
          "init-indexes",
          "sync-hardware",
          "sync-manufacturers",
          "sync-all",
          "get-stats",
        ],
      },
    });
  } catch (error) {
    logger.error("Meilisearch admin API error:", error as Error);

    return json(
      {
        success: false,
        error: "Failed to get admin information",
      },
      { status: 500 },
    );
  }
};
