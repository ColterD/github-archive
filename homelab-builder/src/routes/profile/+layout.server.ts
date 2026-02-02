// HOMELAB HARDWARE PLATFORM - PROFILE LAYOUT SERVER
// Protected routes requiring authentication

import { redirect } from "@sveltejs/kit";
import type { RequestEvent } from "@sveltejs/kit";

export const load = async (event: RequestEvent) => {
  const session = await event.locals.auth();

  // Redirect to sign in if not authenticated
  if (!session?.user) {
    // Validate callback URL to prevent open redirect attacks
    const callbackUrl = event.url.pathname;
    const isValidCallback =
      callbackUrl.startsWith("/") && !callbackUrl.startsWith("//");
    const safeCallbackUrl = isValidCallback ? callbackUrl : "/profile";

    throw redirect(
      302,
      "/auth/signin?callbackUrl=" + encodeURIComponent(safeCallbackUrl),
    );
  }

  return {
    session,
  };
};
