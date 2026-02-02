import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { db } from "$lib/server/db";
import { logger } from "$lib/server/logger";

// GET /api/price-tracking/drops - Get recent significant price drops
export const GET: RequestHandler = async ({ url, locals }) => {
  try {
    if (!locals.user) {
      return json({ error: "Unauthorized" }, { status: 401 });
    }

    const limit = parseInt(url.searchParams.get("limit") || "20");
    const minDiscountPercent = parseFloat(
      url.searchParams.get("minDiscount") || "10",
    );
    const days = parseInt(url.searchParams.get("days") || "7");

    // Get recent significant price drops using Prisma queries to prevent SQL injection
    try {
      // Get recent price history entries from the last 24 hours
      const recentHistory = await db.priceHistory.findMany({
        where: {
          timestamp: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
          },
        },
        include: {
          hardware: {
            select: { id: true, name: true },
          },
        },
        orderBy: { timestamp: "desc" },
        take: 500, // Get more to filter from
      });

      const drops = [];
      const processedItems = new Set<string>();

      for (const entry of recentHistory) {
        const itemKey = `${entry.hardwareId}-${entry.vendor}`;
        if (processedItems.has(itemKey)) continue;
        processedItems.add(itemKey);

        // Find previous price for comparison within the specified days
        const previousEntry = await db.priceHistory.findFirst({
          where: {
            hardwareId: entry.hardwareId,
            vendor: entry.vendor,
            timestamp: {
              lt: entry.timestamp,
              gte: new Date(
                entry.timestamp.getTime() - days * 24 * 60 * 60 * 1000,
              ),
            },
          },
          orderBy: { timestamp: "desc" },
        });

        if (previousEntry && entry.price < previousEntry.price) {
          const discountPercent =
            ((previousEntry.price - entry.price) / previousEntry.price) * 100;

          if (discountPercent >= minDiscountPercent) {
            drops.push({
              id: entry.id,
              hardwareId: entry.hardwareId,
              hardwareName: entry.hardware.name,
              oldPrice: previousEntry.price,
              newPrice: entry.price,
              discountPercent: Math.round(discountPercent * 10) / 10,
              vendor: entry.vendor,
              url: entry.url,
              timestamp: entry.timestamp,
            });
          }
        }

        if (drops.length >= limit) break;
      }

      // Sort by discount percentage descending
      drops.sort((a, b) => b.discountPercent - a.discountPercent);
      const recentDrops = drops.slice(0, limit);

      const formattedDrops = recentDrops.map((drop) => ({
        id: drop.id,
        hardwareId: drop.hardwareId,
        hardwareName: drop.hardwareName,
        oldPrice:
          typeof drop.oldPrice === "string"
            ? parseFloat(drop.oldPrice)
            : drop.oldPrice,
        newPrice:
          typeof drop.newPrice === "string"
            ? parseFloat(drop.newPrice)
            : drop.newPrice,
        discountPercent:
          typeof drop.discountPercent === "string"
            ? parseFloat(drop.discountPercent)
            : drop.discountPercent,
        vendor: drop.vendor,
        url: drop.url,
        timestamp: drop.timestamp.toISOString(),
      }));

      return json(formattedDrops);
    } catch (queryError) {
      // Fallback to a simpler approach if the complex query fails
      logger.warn("Complex price drop query failed, using fallback");
      logger.info("Query error details", { error: queryError as Error });

      // Get recent price history and calculate drops in application code
      const recentHistory = await db.priceHistory.findMany({
        where: {
          timestamp: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
          },
        },
        include: {
          hardware: {
            select: { id: true, name: true },
          },
        },
        orderBy: { timestamp: "desc" },
        take: 100, // Get more to filter from
      });

      const drops = [];
      for (const entry of recentHistory) {
        // Find previous price for comparison
        const previousEntry = await db.priceHistory.findFirst({
          where: {
            hardwareId: entry.hardwareId,
            vendor: entry.vendor,
            timestamp: {
              lt: entry.timestamp,
              gte: new Date(
                entry.timestamp.getTime() - days * 24 * 60 * 60 * 1000,
              ),
            },
          },
          orderBy: { timestamp: "desc" },
        });

        if (previousEntry && entry.price < previousEntry.price) {
          const discountPercent =
            ((previousEntry.price - entry.price) / previousEntry.price) * 100;

          if (discountPercent >= minDiscountPercent) {
            drops.push({
              id: entry.id,
              hardwareId: entry.hardwareId,
              hardwareName: entry.hardware.name,
              oldPrice: previousEntry.price,
              newPrice: entry.price,
              discountPercent: Math.round(discountPercent * 10) / 10,
              vendor: entry.vendor,
              url: entry.url,
              timestamp: entry.timestamp.toISOString(),
            });
          }
        }

        if (drops.length >= limit) break;
      }

      // Sort by discount percentage descending
      drops.sort((a, b) => b.discountPercent - a.discountPercent);

      return json(drops.slice(0, limit));
    }
  } catch (error) {
    logger.error("Failed to fetch price drops", error as Error);
    return json({ error: "Failed to fetch price drops" }, { status: 500 });
  }
};
