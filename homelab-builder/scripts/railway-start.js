#!/usr/bin/env node

import { spawn } from "child_process";
import { existsSync } from "fs";

const DATABASE_URL = process.env.DATABASE_URL;
const PORT = process.env.PORT || 8080;

console.log("🚀 Starting Hardware Platform (Railway)...");
console.log(`📦 Environment: ${process.env.NODE_ENV || "production"}`);
console.log(`🔌 Port: ${PORT}`);

// Check for DATABASE_URL
if (!DATABASE_URL) {
  console.error("❌ DATABASE_URL environment variable is missing!");
  console.error("🔧 Please add PostgreSQL service in Railway dashboard");
  process.exit(1);
}

// Check if build directory exists
if (!existsSync("./build/index.js")) {
  console.error("❌ Build directory not found.");
  process.exit(1);
}

// Function to run command with better error handling
/**
 * @param {string} command
 * @param {string[]} args
 * @param {string} description
 * @returns {Promise<void>}
 */
function runCommand(command, args, description) {
  return new Promise((resolve, reject) => {
    console.log(`⚡ ${description}...`);

    const child = spawn(command, args, {
      stdio: "inherit",
      shell: true,
      env: { ...process.env },
    });

    child.on("close", (code) => {
      if (code === 0) {
        console.log(`✅ ${description} completed successfully`);
        resolve(undefined);
      } else {
        console.error(`❌ ${description} failed with exit code ${code}`);
        reject(new Error(`${description} failed`));
      }
    });

    child.on("error", (error) => {
      console.error(`❌ ${description} error:`, error.message);
      reject(error);
    });
  });
}

async function tryMigrations() {
  try {
    // First try standard migration deploy
    console.log("🔄 Attempting standard migration deployment...");
    await runCommand(
      "npx",
      ["prisma", "migrate", "deploy"],
      "Database migration (standard)",
    );
    return true;
  } catch {
    console.log("⚠️ Standard migration failed, trying repair process...");

    try {
      // Enhanced repair process with multiple approaches
      console.log("🛠️ Starting enhanced migration repair...");

      // Method 1: Try to resolve specific migration
      try {
        await runCommand(
          "npx",
          ["prisma", "migrate", "resolve", "--applied", "20250110000000_init"],
          "Resolving specific failed migration",
        );
      } catch {
        console.log("⚠️ Specific resolve failed, trying general reset...");
      }

      // Method 2: Try to reset and redeploy
      try {
        await runCommand(
          "npx",
          ["prisma", "migrate", "reset", "--force", "--skip-seed"],
          "Resetting migration state",
        );

        await runCommand(
          "npx",
          ["prisma", "migrate", "deploy"],
          "Redeploying migrations after reset",
        );
      } catch {
        console.log("⚠️ Reset approach failed, trying db push...");

        // Method 3: Force schema sync with db push
        await runCommand(
          "npx",
          ["prisma", "db", "push", "--force-reset"],
          "Force pushing schema to database",
        );
      }

      // Always regenerate client after any migration changes
      await runCommand(
        "npx",
        ["prisma", "generate"],
        "Regenerating Prisma client",
      );

      return true;
    } catch (repairError) {
      console.error("💥 All migration repair methods failed!");
      console.error("🔍 This may require manual database intervention");
      throw repairError;
    }
  }
}

async function start() {
  try {
    // Handle database migrations with enhanced fallback
    await tryMigrations();

    // Verify database connection before starting app
    console.log("🔍 Verifying database connection...");
    try {
      await runCommand(
        "npx",
        ["prisma", "db", "execute", "--stdin"],
        "Testing database connection",
      );
    } catch {
      console.log("⚠️ Database connection test failed, but continuing...");
    }

    // Start the application
    console.log("🌟 Starting application server...");
    const child = spawn("node", ["build/index.js"], {
      stdio: "inherit",
      shell: true,
      env: { ...process.env },
    });

    child.on("close", (code) => {
      console.log(`Application exited with code ${code}`);
      process.exit(code);
    });

    child.on("error", (error) => {
      console.error("Application error:", error.message);
      process.exit(1);
    });

    // Handle graceful shutdown
    process.on("SIGTERM", () => {
      console.log("🛑 Received SIGTERM, shutting down gracefully...");
      child.kill("SIGTERM");
    });

    process.on("SIGINT", () => {
      console.log("🛑 Received SIGINT, shutting down gracefully...");
      child.kill("SIGINT");
    });
  } catch (error) {
    console.error("💥 Startup failed:", /** @type {Error} */ (error).message);
    console.error("🔧 Check Railway logs for detailed error information");
    process.exit(1);
  }
}

start();
