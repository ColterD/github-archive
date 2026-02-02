// HOMELAB HARDWARE PLATFORM - ADMIN LAYOUT SERVER
// Restricted admin routes with role verification

import { redirect, error } from "@sveltejs/kit";
import type { RequestEvent } from "@sveltejs/kit";

export const load = async (event: RequestEvent) => {
  const session = await event.locals.auth();

  // Check authentication
  if (!session?.user) {
    // Validate callback URL to prevent open redirect attacks
    const callbackUrl = event.url.pathname;
    const isValidCallback =
      callbackUrl.startsWith("/") && !callbackUrl.startsWith("//");
    const safeCallbackUrl = isValidCallback ? callbackUrl : "/admin";

    throw redirect(
      302,
      "/auth/signin?callbackUrl=" + encodeURIComponent(safeCallbackUrl),
    );
  }

  // Check admin role
  if (session.user.role !== "ADMIN" && session.user.role !== "MODERATOR") {
    throw error(403, "Access denied. Admin privileges required.");
  }

  return {
    session,
  };
};
