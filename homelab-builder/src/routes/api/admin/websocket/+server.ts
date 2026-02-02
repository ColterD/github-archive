// HOMELAB HARDWARE PLATFORM - ADMIN WEBSOCKET API
import type { RequestHandler } from "./$types";
import { adminAnalytics } from "$lib/server/services/admin-analytics";
import { requireAdminAuth } from "$lib/server/auth";
import { logger } from "$lib/server/logger";
import { 
  cleanupExpiredTimestampEntries, 
  createPeriodicCleanup,
  type TimestampedEntry 
} from "$lib/server/utils/cleanup";
import { json } from "@sveltejs/kit";
import { error } from "@sveltejs/kit";

// Store admin connection tokens temporarily
interface AdminTokenData extends TimestampedEntry {
  userId: string;
  createdAt: number;
}

const adminTokens = new Map<string, AdminTokenData>();

// Set up periodic cleanup for expired tokens (5 minutes)
const TOKEN_TTL = 5 * 60 * 1000; // 5 minutes
const cleanupTokens = createPeriodicCleanup(
  () => cleanupExpiredTimestampEntries(adminTokens, TOKEN_TTL, 'AdminTokens'),
  TOKEN_TTL,
  'AdminWebSocketTokens'
);

export const GET: RequestHandler = async ({ locals }) => {
  try {
    // Verify admin authentication
    const user = await requireAdminAuth(locals);

    // Generate a connection token for WebSocket authentication
    const connectionToken = `admin_${user.id}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Store token temporarily (expires in 5 minutes)
    adminTokens.set(connectionToken, {
      userId: user.id,
      createdAt: Date.now(),
    });

    logger.info("Admin WebSocket connection token generated", {
      userId: user.id,
      token: connectionToken,
    });

    return json({
      success: true,
      connectionToken,
      wsEndpoint: "/api/admin/websocket/connect",
      userId: user.id,
      expiresIn: 300000, // 5 minutes
    });
  } catch (err) {
    logger.error("Admin WebSocket token generation error", err as Error);

    if (err && typeof err === "object" && "status" in err) {
      throw err;
    }

    throw error(500, "Failed to generate WebSocket token");
  }
};

export const POST: RequestHandler = async ({ request, locals }) => {
  try {
    // Require admin authentication
    const user = await requireAdminAuth(locals);

    const body = await request.json();
    const { action, data } = body;

    logger.info("Admin WebSocket action", {
      userId: user.id,
      action,
      data: data ? Object.keys(data) : [],
    });

    switch (action) {
      case "track_admin_action":
        if (!data.action) {
          throw error(400, "Action required");
        }
        await adminAnalytics.trackUserAction(
          `admin:${data.action}`,
          user.id,
          data.metadata || {},
        );
        break;

      case "get_metrics": {
        const metrics = await adminAnalytics.getDashboardMetrics();
        return json({
          success: true,
          data: metrics,
          timestamp: new Date().toISOString(),
        });
      }

      default:
        throw error(400, "Invalid action");
    }

    return json({
      success: true,
      message: "Action completed successfully",
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    logger.error("Admin WebSocket POST error", err as Error);

    if (err && typeof err === "object" && "status" in err) {
      throw err;
    }

    throw error(500, "Failed to process WebSocket action");
  }
};
