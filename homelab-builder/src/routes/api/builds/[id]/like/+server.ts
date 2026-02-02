import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { db } from "$lib/server/db";
import { logger } from "$lib/server/logger";

export const POST: RequestHandler = async ({ params, locals }) => {
  try {
    const { id: buildId } = params;
    const user = locals.user;

    if (!user) {
      return json({ error: "Authentication required" }, { status: 401 });
    }

    if (!buildId) {
      return json({ error: "Build ID is required" }, { status: 400 });
    }

    // Check if build exists
    const build = await db.build.findUnique({
      where: { id: buildId },
      select: { id: true },
    });

    if (!build) {
      return json({ error: "Build not found" }, { status: 404 });
    }

    // Check if user already liked this build
    const existingLike = await db.buildLike.findUnique({
      where: {
        userId_buildId: {
          userId: user.id,
          buildId: buildId,
        },
      },
    });

    let isLiked: boolean;

    if (existingLike) {
      // Unlike the build
      await db.buildLike.delete({
        where: {
          userId_buildId: {
            userId: user.id,
            buildId: buildId,
          },
        },
      });
      isLiked = false;
    } else {
      // Like the build
      await db.buildLike.create({
        data: {
          userId: user.id,
          buildId: buildId,
        },
      });
      isLiked = true;
    }

    // Get updated like count
    const likeCount = await db.buildLike.count({
      where: { buildId: buildId },
    });

    // Update the build's like count cache
    await db.build.update({
      where: { id: buildId },
      data: { likeCount: likeCount },
    });

    return json({
      success: true,
      isLiked,
      likeCount,
    });
  } catch (error) {
    logger.error("Error toggling build like:", error as Error);
    return json({ error: "Failed to toggle like" }, { status: 500 });
  }
};
