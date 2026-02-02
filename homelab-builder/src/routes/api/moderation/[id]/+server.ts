import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { db } from "$lib/server/db";
import { logger } from "$lib/server/logger";

// PATCH /api/moderation/[id] - Update moderation report status (admin only)
export const PATCH: RequestHandler = async ({ request, params, locals }) => {
  try {
    const user = locals.user;
    if (!user) {
      return json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin
    const userDetails = await db.user.findUnique({
      where: { id: user.id },
      select: { role: true },
    });

    if (userDetails?.role !== "ADMIN") {
      return json({ error: "Admin access required" }, { status: 403 });
    }

    const reportId = params.id;
    if (!reportId) {
      return json({ error: "Report ID is required" }, { status: 400 });
    }

    const { status, action, moderatorNotes } = await request.json();

    // Validate status
    if (!["PENDING", "APPROVED", "REJECTED", "RESOLVED"].includes(status)) {
      return json(
        {
          error:
            "Invalid status. Must be PENDING, APPROVED, REJECTED, or RESOLVED",
        },
        { status: 400 },
      );
    }

    // Get the report
    const report = await db.moderationReport.findUnique({
      where: { id: reportId },
      include: {
        review: true,
        build: true,
      },
    });

    if (!report) {
      return json({ error: "Report not found" }, { status: 404 });
    }

    // Start transaction for atomic operations
    const result = await db.$transaction(async (tx) => {
      // Update the report
      const updatedReport = await tx.moderationReport.update({
        where: { id: reportId },
        data: {
          status,
          moderatorId: user.id,
          moderatorNotes: moderatorNotes || null,
          resolvedAt: status === "RESOLVED" ? new Date() : null,
        },
        include: {
          moderator: {
            select: { id: true, name: true },
          },
        },
      });

      // Handle moderation actions
      if (status === "APPROVED" && action) {
        switch (action) {
          case "DELETE_CONTENT":
            if (report.type === "REVIEW" && report.reviewId) {
              // Soft delete the review
              await tx.review.update({
                where: { id: report.reviewId },
                data: { isDeleted: true },
              });
            } else if (report.type === "BUILD" && report.buildId) {
              // Soft delete the build
              await tx.build.update({
                where: { id: report.buildId },
                data: { isDeleted: true },
              });
            }
            break;

          case "HIDE_CONTENT":
            if (report.type === "REVIEW" && report.reviewId) {
              // Hide the review
              await tx.review.update({
                where: { id: report.reviewId },
                data: { isHidden: true },
              });
            } else if (report.type === "BUILD" && report.buildId) {
              // Hide the build
              await tx.build.update({
                where: { id: report.buildId },
                data: { isHidden: true },
              });
            }
            break;

          case "WARN_USER": {
            // Create a user warning (you might want to implement a warnings system)
            const targetUserId =
              report.type === "REVIEW"
                ? report.review?.userId
                : report.build?.userId;

            if (targetUserId) {
              // You could implement a warnings table or add warning count to user
              logger.info('Warning issued to user', {
                userId: targetUserId,
                reportId: reportId,
                action: 'WARN_USER'
              });
            }
            break;
          }
        }
      }

      return updatedReport;
    });

    return json({
      id: result.id,
      status: result.status,
      moderatorNotes: result.moderatorNotes,
      resolvedAt: result.resolvedAt?.toISOString(),
      moderator: result.moderator,
      updatedAt: result.updatedAt.toISOString(),
    });
  } catch (error) {
    logger.error("Failed to update moderation report:", error as Error);
    return json(
      { error: "Failed to update moderation report" },
      { status: 500 },
    );
  }
};

// DELETE /api/moderation/[id] - Delete moderation report (admin only)
export const DELETE: RequestHandler = async ({ params, locals }) => {
  try {
    const user = locals.user;
    if (!user) {
      return json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin
    const userDetails = await db.user.findUnique({
      where: { id: user.id },
      select: { role: true },
    });

    if (userDetails?.role !== "ADMIN") {
      return json({ error: "Admin access required" }, { status: 403 });
    }

    const reportId = params.id;
    if (!reportId) {
      return json({ error: "Report ID is required" }, { status: 400 });
    }

    // Check if report exists
    const report = await db.moderationReport.findUnique({
      where: { id: reportId },
    });

    if (!report) {
      return json({ error: "Report not found" }, { status: 404 });
    }

    // Delete the report
    await db.moderationReport.delete({
      where: { id: reportId },
    });

    return json({
      success: true,
      message: "Moderation report deleted successfully",
    });
  } catch (error) {
    logger.error("Failed to delete moderation report:", error as Error);
    return json(
      { error: "Failed to delete moderation report" },
      { status: 500 },
    );
  }
};
