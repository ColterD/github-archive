import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { db } from "$lib/server/db";
import { logger } from "$lib/server/logger";

// GET /api/price-tracking/alerts - Get user's price alerts
export const GET: RequestHandler = async ({ locals }) => {
  try {
    const user = locals.user;
    if (!user) {
      return json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user's price alerts
    const alerts = await db.priceAlert.findMany({
      where: { userId: user.id },
      include: {
        hardware: {
          select: {
            id: true,
            name: true,
            currentPrice: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const formattedAlerts = alerts.map((alert) => ({
      id: alert.id,
      hardwareId: alert.hardwareId,
      hardwareName: alert.hardware.name,
      currentPrice: alert.hardware.currentPrice || 0,
      targetPrice: alert.targetPrice,
      isActive: alert.isActive,
      createdAt: alert.createdAt.toISOString(),
      lastTriggered: alert.lastTriggered?.toISOString(),
    }));

    return json(formattedAlerts);
  } catch (error) {
    logger.error("Failed to fetch price alerts:", error as Error);
    return json({ error: "Failed to fetch price alerts" }, { status: 500 });
  }
};

// POST /api/price-tracking/alerts - Create new price alert
export const POST: RequestHandler = async ({ request, locals }) => {
  try {
    const user = locals.user;
    if (!user) {
      return json({ error: "Unauthorized" }, { status: 401 });
    }

    const { hardwareId, targetPrice } = await request.json();

    if (!hardwareId || !targetPrice || targetPrice <= 0) {
      return json(
        { error: "Hardware ID and valid target price are required" },
        { status: 400 },
      );
    }

    // Check if hardware exists
    const hardware = await db.hardwareItem.findUnique({
      where: { id: hardwareId },
      select: { id: true, name: true, currentPrice: true },
    });

    if (!hardware) {
      return json({ error: "Hardware not found" }, { status: 404 });
    }

    // Check if user already has an alert for this hardware
    const existingAlert = await db.priceAlert.findFirst({
      where: {
        userId: user.id,
        hardwareId: hardwareId,
      },
    });

    if (existingAlert) {
      return json(
        { error: "You already have a price alert for this hardware" },
        { status: 409 },
      );
    }

    // Create the price alert
    const alert = await db.priceAlert.create({
      data: {
        userId: user.id,
        hardwareId: hardwareId,
        targetPrice: targetPrice,
        isActive: true,
      },
    });

    return json(
      {
        id: alert.id,
        hardwareId: alert.hardwareId,
        hardwareName: hardware.name,
        currentPrice: hardware.currentPrice || 0,
        targetPrice: alert.targetPrice,
        isActive: alert.isActive,
        createdAt: alert.createdAt.toISOString(),
      },
      { status: 201 },
    );
  } catch (error) {
    logger.error("Failed to create price alert:", error as Error);
    return json({ error: "Failed to create price alert" }, { status: 500 });
  }
};
