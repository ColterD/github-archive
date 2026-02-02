// WEBSOCKET STATS API - Real-time WebSocket server statistics
import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";

export const GET: RequestHandler = async ({ locals }) => {
  try {
    const stats = locals.websocket.getStats();

    return json({
      success: true,
      data: stats,
      timestamp: new Date().toISOString(),
    });
  } catch {
    return json(
      {
        success: false,
        error: "Failed to get WebSocket stats",
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    );
  }
};
