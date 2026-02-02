// HOMELAB HARDWARE PLATFORM - TYPE DEFINITIONS
// See https://kit.svelte.dev/docs/types#app

import type { DefaultSession } from "@auth/sveltekit";
import type { websocketService } from "$lib/server/websocket.js";

declare global {
  namespace App {
    interface Locals {
      auth: () => Promise<{
        user?: {
          id: string;
          email: string;
          name?: string;
          image?: string;
          username?: string;
          role?: "USER" | "VERIFIED" | "MODERATOR" | "ADMIN";
          status?:
            | "ACTIVE"
            | "SUSPENDED"
            | "PENDING_VERIFICATION"
            | "DEACTIVATED";
        };
        expires?: string;
      } | null>;
      user?: {
        id: string;
        email: string;
        name?: string;
        image?: string;
        username?: string;
        role?: "USER" | "VERIFIED" | "MODERATOR" | "ADMIN";
        status?:
          | "ACTIVE"
          | "SUSPENDED"
          | "PENDING_VERIFICATION"
          | "DEACTIVATED";
      };
      websocket: typeof websocketService;
      nonce?: string;
    }

    interface PageData {
      session: {
        user?: {
          id: string;
          email: string;
          name?: string;
          image?: string;
          username?: string;
          role?: "USER" | "VERIFIED" | "MODERATOR" | "ADMIN";
          status?:
            | "ACTIVE"
            | "SUSPENDED"
            | "PENDING_VERIFICATION"
            | "DEACTIVATED";
        };
        expires?: string;
      } | null;
    }

    interface Error {
      code?: string;
      id?: string;
    }
  }
}

// Extend Auth.js default session type
declare module "@auth/sveltekit" {
  interface Session {
    user?: {
      id: string;
      email: string;
      name?: string;
      image?: string;
      username?: string;
      role?: "USER" | "VERIFIED" | "MODERATOR" | "ADMIN";
      status?: "ACTIVE" | "SUSPENDED" | "PENDING_VERIFICATION" | "DEACTIVATED";
    } & DefaultSession["user"];
  }

  interface User {
    username?: string;
    role?: "USER" | "VERIFIED" | "MODERATOR" | "ADMIN";
    status?: "ACTIVE" | "SUSPENDED" | "PENDING_VERIFICATION" | "DEACTIVATED";
  }
}

export {};
