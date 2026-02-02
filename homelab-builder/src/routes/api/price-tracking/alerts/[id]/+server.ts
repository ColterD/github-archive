import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { db } from "$lib/server/db";
import { logger } from "$lib/server/logger";
import type { Prisma } from "@prisma/client";

// PATCH /api/price-tracking/alerts/[id] - Update price alert
export const PATCH: RequestHandler = async ({ request, params, locals }) => {
  try {
    if (!locals.user?.id) {
      return json({ error: "Unauthorized" }, { status: 401 });
    }

    const alertId = params.id;
    if (!alertId) {
      return json({ error: "Alert ID is required" }, { status: 400 });
    }

    const { isActive, targetPrice } = await request.json();

    // Verify the alert belongs to the user
    const existingAlert = await db.priceAlert.findFirst({
      where: {
        id: alertId,
        userId: locals.user.id,
      },
    });

    if (!existingAlert) {
      return json({ error: "Alert not found" }, { status: 404 });
    }

    // Prepare update data
    const updateData: Prisma.PriceAlertUpdateInput = {};
    if (typeof isActive === "boolean") {
      updateData.isActive = isActive;
    }
    if (targetPrice && targetPrice > 0) {
      updateData.targetPrice = targetPrice;
    }

    if (Object.keys(updateData).length === 0) {
      return json({ error: "No valid fields to update" }, { status: 400 });
    }

    // Update the alert
    const updatedAlert = await db.priceAlert.update({
      where: { id: alertId },
      data: updateData,
      include: {
        hardware: {
          select: {
            id: true,
            name: true,
            currentPrice: true,
          },
        },
      },
    });

    return json({
      id: updatedAlert.id,
      hardwareId: updatedAlert.hardwareId,
      hardwareName: updatedAlert.hardware.name,
      currentPrice: updatedAlert.hardware.currentPrice || 0,
      targetPrice: updatedAlert.targetPrice,
      isActive: updatedAlert.isActive,
      createdAt: updatedAlert.createdAt.toISOString(),
      lastTriggered: updatedAlert.lastTriggered?.toISOString(),
    });
  } catch (error) {
    logger.error("Failed to update price alert", error as Error);
    return json({ error: "Failed to update price alert" }, { status: 500 });
  }
};

// DELETE /api/price-tracking/alerts/[id] - Delete price alert
export const DELETE: RequestHandler = async ({ params, locals }) => {
  try {
    if (!locals.user?.id) {
      return json({ error: "Unauthorized" }, { status: 401 });
    }

    const alertId = params.id;
    if (!alertId) {
      return json({ error: "Alert ID is required" }, { status: 400 });
    }

    // Verify the alert belongs to the user
    const existingAlert = await db.priceAlert.findFirst({
      where: {
        id: alertId,
        userId: locals.user.id,
      },
    });

    if (!existingAlert) {
      return json({ error: "Alert not found" }, { status: 404 });
    }

    // Delete the alert
    await db.priceAlert.delete({
      where: { id: alertId },
    });

    return json({ success: true, message: "Price alert deleted successfully" });
  } catch (error) {
    logger.error("Failed to delete price alert", error as Error);
    return json({ error: "Failed to delete price alert" }, { status: 500 });
  }
};
