// WEBSOCKET TEST API - Send test notifications for development
import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";

export const POST: RequestHandler = async ({ request, locals }) => {
  try {
    const { type, payload } = await request.json();

    switch (type) {
      case "price_change":
        locals.websocket.notifyHardwarePriceChange(
          payload.hardwareId || "test-hardware-1",
          payload.oldPrice || 100,
          payload.newPrice || 75,
        );
        break;

      case "new_build":
        locals.websocket.notifyNewBuild(
          payload.buildId || "test-build-1",
          payload.authorId || "test-user-1",
          payload.buildTitle || "Test Homelab Build",
        );
        break;

      case "user_activity":
        locals.websocket.notifyUserActivity(
          payload.userId || "test-user-1",
          payload.activity || "test activity",
          payload.metadata,
        );
        break;

      default:
        // Broadcast custom message to global channel
        locals.websocket.broadcastToChannel("global", {
          type: type || "test_message",
          payload: payload || { message: "Test WebSocket message" },
          timestamp: Date.now(),
        });
    }

    return json({
      success: true,
      message: `Test ${type} notification sent`,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return json(
      {
        success: false,
        error: "Failed to send test notification",
        details: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    );
  }
};
