import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { db } from "$lib/server/db";
import { logger } from "$lib/server/logger";
import type { Prisma } from "@prisma/client";

// GET /api/moderation - Get moderation queue (admin only)
export const GET: RequestHandler = async ({ locals, url }) => {
  try {
    if (!locals.user) {
      return json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin (you may need to adjust this based on your user model)
    const user = await db.user.findUnique({
      where: { id: locals.user.id },
      select: { role: true },
    });

    if (user?.role !== "ADMIN") {
      return json({ error: "Admin access required" }, { status: 403 });
    }

    const status = url.searchParams.get("status") || "PENDING";
    const type = url.searchParams.get("type"); // 'review' or 'build'
    const limit = parseInt(url.searchParams.get("limit") || "20");
    const offset = parseInt(url.searchParams.get("offset") || "0");

    // Get moderation reports
    const whereClause: Prisma.ModerationReportWhereInput = {
      status: status as Prisma.EnumModerationStatusFilter,
    };
    if (type) {
      whereClause.type = type.toUpperCase() as Prisma.EnumReportTypeFilter;
    }

    const reports = await db.moderationReport.findMany({
      where: whereClause,
      include: {
        reporter: {
          select: { id: true, name: true, email: true },
        },
        moderator: {
          select: { id: true, name: true },
        },
        review: {
          select: {
            id: true,
            title: true,
            content: true,
            rating: true,
            user: { select: { name: true } },
          },
        },
        build: {
          select: {
            id: true,
            name: true,
            description: true,
            user: { select: { name: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      skip: offset,
      take: limit,
    });

    const totalCount = await db.moderationReport.count({ where: whereClause });

    return json({
      reports: reports.map((report) => ({
        id: report.id,
        type: report.type,
        reason: report.reason,
        description: report.description,
        status: report.status,
        createdAt: report.createdAt.toISOString(),
        updatedAt: report.updatedAt.toISOString(),
        reporter: report.reporter,
        moderator: report.moderator,
        review: report.review,
        build: report.build,
      })),
      totalCount,
      hasMore: offset + limit < totalCount,
    });
  } catch (error) {
    logger.error("Failed to fetch moderation queue", error as Error);
    return json({ error: "Failed to fetch moderation queue" }, { status: 500 });
  }
};

// POST /api/moderation - Create moderation report
export const POST: RequestHandler = async ({ request, locals }) => {
  try {
    if (!locals.user) {
      return json({ error: "Unauthorized" }, { status: 401 });
    }

    const { type, targetId, reason, description } = await request.json();

    // Validate input
    if (!type || !targetId || !reason) {
      return json(
        { error: "Type, target ID, and reason are required" },
        { status: 400 },
      );
    }

    if (!["REVIEW", "BUILD"].includes(type.toUpperCase())) {
      return json(
        { error: "Type must be either REVIEW or BUILD" },
        { status: 400 },
      );
    }

    // Verify target exists
    if (type.toUpperCase() === "REVIEW") {
      const review = await db.review.findUnique({
        where: { id: targetId },
      });
      if (!review) {
        return json({ error: "Review not found" }, { status: 404 });
      }
    } else if (type.toUpperCase() === "BUILD") {
      const build = await db.build.findUnique({
        where: { id: targetId },
      });
      if (!build) {
        return json({ error: "Build not found" }, { status: 404 });
      }
    }

    // Check if user already reported this content
    const existingReport = await db.moderationReport.findFirst({
      where: {
        reporterId: locals.user.id,
        type: type.toUpperCase(),
        ...(type.toUpperCase() === "REVIEW"
          ? { review: { id: targetId } }
          : { build: { id: targetId } }),
      },
    });

    if (existingReport) {
      return json(
        { error: "You have already reported this content" },
        { status: 409 },
      );
    }

    // Create moderation report
    const reportData: Prisma.ModerationReportCreateInput = {
      type: type.toUpperCase(),
      reason,
      description: description || "",
      reporter: { connect: { id: locals.user.id } },
      status: "PENDING",
    };

    if (type.toUpperCase() === "REVIEW") {
      reportData.review = { connect: { id: targetId } };
    } else {
      reportData.build = { connect: { id: targetId } };
    }

    const report = await db.moderationReport.create({
      data: reportData,
      include: {
        reporter: {
          select: { id: true, name: true },
        },
      },
    });

    return json(
      {
        id: report.id,
        type: report.type,
        reason: report.reason,
        description: report.description,
        status: report.status,
        createdAt: report.createdAt.toISOString(),
        reporter: report.reporter,
      },
      { status: 201 },
    );
  } catch (error) {
    logger.error("Failed to create moderation report", error as Error);
    return json(
      { error: "Failed to create moderation report" },
      { status: 500 },
    );
  }
};
