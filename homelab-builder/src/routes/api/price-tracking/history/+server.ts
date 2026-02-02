import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { db } from "$lib/server/db";
import { logger } from "$lib/server/logger";
import type { Prisma } from "@prisma/client";

// GET /api/price-tracking/history - Get price history
export const GET: RequestHandler = async ({ url, locals }) => {
  try {
    if (!locals.user?.id) {
      return json({ error: "Unauthorized" }, { status: 401 });
    }

    const limit = parseInt(url.searchParams.get("limit") || "50");
    const hardwareId = url.searchParams.get("hardwareId");
    const vendor = url.searchParams.get("vendor");

    // Build where clause
    const whereClause: Prisma.PriceHistoryWhereInput = {};
    if (hardwareId) {
      whereClause.hardwareId = hardwareId;
    }
    if (vendor) {
      whereClause.vendor = vendor;
    }

    // Get recent price history
    const priceHistory = await db.priceHistory.findMany({
      where: whereClause,
      include: {
        hardware: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { timestamp: "desc" },
      take: limit,
    });

    // Calculate price changes
    const formattedHistory = await Promise.all(
      priceHistory.map(async (entry) => {
        // Get previous price for comparison
        const previousEntry = await db.priceHistory.findFirst({
          where: {
            hardwareId: entry.hardwareId,
            vendor: entry.vendor,
            timestamp: { lt: entry.timestamp },
          },
          orderBy: { timestamp: "desc" },
        });

        let priceChange = null;
        let priceChangePercent = null;

        if (previousEntry) {
          priceChange = entry.price - previousEntry.price;
          priceChangePercent = (priceChange / previousEntry.price) * 100;
        }

        return {
          id: entry.id,
          hardwareId: entry.hardwareId,
          hardwareName: entry.hardware.name,
          price: entry.price,
          vendor: entry.vendor,
          url: entry.url,
          timestamp: entry.timestamp.toISOString(),
          priceChange,
          priceChangePercent,
        };
      }),
    );

    return json(formattedHistory);
  } catch (error) {
    logger.error("Failed to fetch price history", error as Error);
    return json({ error: "Failed to fetch price history" }, { status: 500 });
  }
};
