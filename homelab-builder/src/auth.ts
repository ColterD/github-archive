// HOMELAB HARDWARE PLATFORM - AUTHENTICATION CONFIG
// Auth.js configuration for SvelteKit with GitHub/Google OAuth
// Updated: 2025-01-11 - Environment handling for Railway deployment

import { SvelteKitAuth } from "@auth/sveltekit";
import GitHub from "@auth/sveltekit/providers/github";
import Google from "@auth/sveltekit/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { db } from "$lib/server/db";
import { env } from "$lib/server/env.js";
import { logger } from "$lib/server/logger";

export const { handle, signIn, signOut } = SvelteKitAuth({
  adapter: PrismaAdapter(db),

  providers: [
    GitHub({
      clientId: env.GITHUB_CLIENT_ID,
      clientSecret: env.GITHUB_CLIENT_SECRET,
    }),
    Google({
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
    }),
  ],

  // Session and token configuration
  callbacks: {
    async session({ session, user }) {
      // Add custom fields to session
      if (session?.user && user) {
        session.user.id = user.id;
        session.user.role = user.role || "USER";
        session.user.username = user.username;
        session.user.status = user.status;
      }
      return session;
    },

    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.username = user.username;
        token.status = user.status;
      }
      return token;
    },

    async signIn({ user, account }) {
      logger.info(`User signed in: ${user.email} via ${account?.provider}`);
      return true;
    },
  },

  // Events for analytics and logging
  events: {
    async signOut() {
      logger.info("User signed out");
    },
  },

  pages: {
    signIn: "/auth/signin",
    signOut: "/auth/signout",
    error: "/auth/error",
  },

  trustHost: true,
  secret: env.AUTH_SECRET,
});
