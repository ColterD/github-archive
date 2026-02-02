// HOMELAB HARDWARE PLATFORM - REVIEWS API
import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { db } from "$lib/server/db";
import { z } from "zod";
import { logger } from "$lib/server/logger";
import type { Prisma } from "@prisma/client";

// Validation schemas
const CreateReviewSchema = z.object({
  hardwareItemId: z.string().min(1),
  rating: z.number().int().min(1).max(5),
  title: z.string().min(1).max(100),
  content: z.string().min(10).max(2000),
  pros: z.array(z.string().max(100)).max(10).optional(),
  cons: z.array(z.string().max(100)).max(10).optional(),
  wouldRecommend: z.boolean().optional(),
  verified: z.boolean().default(false),
});

const UpdateReviewSchema = CreateReviewSchema.partial();

// GET - Fetch reviews for hardware item
export const GET: RequestHandler = async ({ url }) => {
  try {
    const hardwareItemId = url.searchParams.get("hardwareItemId");
    const page = parseInt(url.searchParams.get("page") || "1");
    const limit = parseInt(url.searchParams.get("limit") || "10");
    const sortBy = url.searchParams.get("sortBy") || "newest";

    if (!hardwareItemId) {
      return json({ error: "Hardware item ID is required" }, { status: 400 });
    }

    const skip = (page - 1) * limit;

    // Build sort order
    let orderBy: Prisma.ReviewOrderByWithRelationInput = { createdAt: "desc" };
    switch (sortBy) {
      case "oldest":
        orderBy = { createdAt: "asc" };
        break;
      case "rating-high":
        orderBy = { rating: "desc" };
        break;
      case "rating-low":
        orderBy = { rating: "asc" };
        break;
      case "helpful":
        orderBy = { helpful: "desc" };
        break;
    }

    const [reviews, totalCount] = await Promise.all([
      db.review.findMany({
        where: { hardwareItemId },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              avatar: true,
              createdAt: true,
            },
          },
        },
        orderBy,
        skip,
        take: limit,
      }),
      db.review.count({ where: { hardwareItemId } }),
    ]);

    // Calculate rating distribution
    const ratingDistribution = await db.review.groupBy({
      by: ["rating"],
      where: { hardwareItemId },
      _count: { rating: true },
    });

    const distribution = Array.from({ length: 5 }, (_, i) => {
      const rating = i + 1;
      const found = ratingDistribution.find((r) => r.rating === rating);
      return {
        rating,
        count: found?._count.rating || 0,
      };
    });

    // Calculate average rating
    const avgRating =
      reviews.length > 0
        ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
        : 0;

    logger.info("Reviews fetched", {
      hardwareItemId,
      count: reviews.length,
      totalCount,
      avgRating,
    });

    return json({
      reviews,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
      stats: {
        averageRating: Number(avgRating.toFixed(1)),
        totalReviews: totalCount,
        distribution,
      },
    });
  } catch (error) {
    logger.error("Failed to fetch reviews", error as Error);
    return json({ error: "Failed to fetch reviews" }, { status: 500 });
  }
};

// POST - Create new review
export const POST: RequestHandler = async ({ request, locals }) => {
  try {
    const user = locals.user;
    if (!user) {
      return json({ error: "Authentication required" }, { status: 401 });
    }

    const data = await request.json();
    const validatedData = CreateReviewSchema.parse(data);

    // Check if user already reviewed this item
    const existingReview = await db.review.findFirst({
      where: {
        hardwareItemId: validatedData.hardwareItemId,
        userId: user.id,
      },
    });

    if (existingReview) {
      return json(
        { error: "You have already reviewed this item" },
        { status: 409 },
      );
    }

    // Verify hardware item exists
    const hardwareItem = await db.hardwareItem.findUnique({
      where: { id: validatedData.hardwareItemId },
    });

    if (!hardwareItem) {
      return json({ error: "Hardware item not found" }, { status: 404 });
    }

    // Create review
    const review = await db.review.create({
      data: {
        ...validatedData,
        userId: user.id,
        pros: validatedData.pros ? JSON.stringify(validatedData.pros) : null,
        cons: validatedData.cons ? JSON.stringify(validatedData.cons) : null,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatar: true,
            createdAt: true,
          },
        },
      },
    });

    // Update hardware item average rating
    const allReviews = await db.review.findMany({
      where: { hardwareItemId: validatedData.hardwareItemId },
      select: { rating: true },
    });

    const averageRating =
      allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;

    await db.hardwareItem.update({
      where: { id: validatedData.hardwareItemId },
      data: { averageRating: Number(averageRating.toFixed(1)) },
    });

    logger.info("Review created", {
      reviewId: review.id,
      hardwareItemId: validatedData.hardwareItemId,
      userId: user.id,
      rating: validatedData.rating,
    });

    return json({ review }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return json(
        { error: "Invalid review data", details: error.issues },
        { status: 400 },
      );
    }

    logger.error("Failed to create review", error as Error);
    return json({ error: "Failed to create review" }, { status: 500 });
  }
};

// PUT - Update review
export const PUT: RequestHandler = async ({ request, locals }) => {
  try {
    const user = locals.user;
    if (!user) {
      return json({ error: "Authentication required" }, { status: 401 });
    }

    const data = await request.json();
    const { reviewId, ...updateData } = data;

    if (!reviewId) {
      return json({ error: "Review ID is required" }, { status: 400 });
    }

    const validatedData = UpdateReviewSchema.parse(updateData);

    // Check if review exists and belongs to user
    const existingReview = await db.review.findFirst({
      where: {
        id: reviewId,
        userId: user.id,
      },
    });

    if (!existingReview) {
      return json(
        { error: "Review not found or unauthorized" },
        { status: 404 },
      );
    }

    // Update review
    const review = await db.review.update({
      where: { id: reviewId },
      data: {
        ...validatedData,
        pros: validatedData.pros
          ? JSON.stringify(validatedData.pros)
          : undefined,
        cons: validatedData.cons
          ? JSON.stringify(validatedData.cons)
          : undefined,
        updatedAt: new Date(),
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatar: true,
            createdAt: true,
          },
        },
      },
    });

    // Recalculate average rating if rating changed
    if (
      validatedData.rating !== undefined &&
      existingReview &&
      existingReview.hardwareItemId
    ) {
      const allReviews = await db.review.findMany({
        where: { hardwareItemId: existingReview.hardwareItemId },
        select: { rating: true },
      });

      const averageRating =
        allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;

      await db.hardwareItem.update({
        where: { id: existingReview.hardwareItemId },
        data: { averageRating: Number(averageRating.toFixed(1)) },
      });
    }

    logger.info("Review updated", {
      reviewId,
      userId: user.id,
    });

    return json({ review });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return json(
        { error: "Invalid review data", details: error.issues },
        { status: 400 },
      );
    }

    logger.error("Failed to update review", error as Error);
    return json({ error: "Failed to update review" }, { status: 500 });
  }
};

// DELETE - Delete review
export const DELETE: RequestHandler = async ({ request, locals }) => {
  try {
    const user = locals.user;
    if (!user) {
      return json({ error: "Authentication required" }, { status: 401 });
    }

    const { reviewId } = await request.json();

    if (!reviewId) {
      return json({ error: "Review ID is required" }, { status: 400 });
    }

    // Check if review exists and belongs to user
    const existingReview = await db.review.findFirst({
      where: {
        id: reviewId,
        userId: user.id,
      },
    });

    // If not found, check if user is admin and can delete any review
    if (!existingReview) {
      const currentUser = await db.user.findUnique({
        where: { id: user.id },
        select: { role: true },
      });

      if (currentUser?.role !== "ADMIN") {
        return json(
          { error: "Review not found or unauthorized" },
          { status: 404 },
        );
      }

      // Admin can delete any review - verify review exists
      const reviewToDelete = await db.review.findUnique({
        where: { id: reviewId },
      });

      if (!reviewToDelete) {
        return json({ error: "Review not found" }, { status: 404 });
      }
    }

    // Delete review
    await db.review.delete({
      where: { id: reviewId },
    });

    // Recalculate average rating
    if (existingReview && existingReview.hardwareItemId) {
      const remainingReviews = await db.review.findMany({
        where: { hardwareItemId: existingReview.hardwareItemId },
        select: { rating: true },
      });

      const averageRating =
        remainingReviews.length > 0
          ? remainingReviews.reduce((sum, r) => sum + r.rating, 0) /
            remainingReviews.length
          : 0;

      await db.hardwareItem.update({
        where: { id: existingReview.hardwareItemId },
        data: { averageRating: Number(averageRating.toFixed(1)) },
      });
    }

    logger.info("Review deleted", {
      reviewId,
      userId: user.id,
    });

    return json({ success: true });
  } catch (error) {
    logger.error("Failed to delete review", error as Error);
    return json({ error: "Failed to delete review" }, { status: 500 });
  }
};
