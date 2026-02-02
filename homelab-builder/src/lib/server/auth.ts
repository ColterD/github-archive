import bcrypt from "bcrypt";
import { z } from "zod";
import { error } from "@sveltejs/kit";
import type { RequestEvent } from "@sveltejs/kit";
import { db } from "./db.js";
import { logger } from "./logger.js";

const userSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  username: z.string().min(3, "Username must be at least 3 characters"),
});

export type ValidatedUser = z.infer<typeof userSchema>;

export function validateUser(user: unknown) {
  return userSchema.safeParse(user);
}

export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 12;
  const salt = await bcrypt.genSalt(saltRounds);
  return bcrypt.hash(password, salt);
}

export async function verifyPassword(
  password: string,
  hash: string,
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function requireAdminAuth(locals: RequestEvent["locals"]) {
  const session = await locals.auth();

  if (!session?.user?.id) {
    throw new Error("Authentication required");
  }

  // Get user role from database
  try {
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (!user || user.role !== "ADMIN") {
      throw error(403, "Forbidden - Admin access required");
    }

    return session.user;
  } catch (err) {
    logger.error("Error checking user role:", err as Error);
    throw error(500, "Internal server error");
  }
}
