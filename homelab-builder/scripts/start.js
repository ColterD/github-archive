#!/usr/bin/env node

import { spawn } from "child_process";
import { existsSync } from "fs";

const NODE_ENV = process.env.NODE_ENV || "development";
const DATABASE_URL = process.env.DATABASE_URL;
const PORT = process.env.PORT || 3000;

console.log("🚀 Starting Hardware Platform...");
console.log(`📦 Environment: ${NODE_ENV}`);
console.log(`🔌 Port: ${PORT}`);

// Check if build directory exists
if (!existsSync("./build/index.js")) {
  console.error('❌ Build directory not found. Run "pnpm run build" first.');
  process.exit(1);
}

// Check for DATABASE_URL
if (!DATABASE_URL) {
  console.error("❌ DATABASE_URL environment variable is missing!");
  console.error("");
  console.error("🔧 For Railway deployment:");
  console.error("   1. Add PostgreSQL add-on in Railway dashboard");
  console.error("   2. Verify environment variables are set");
  console.error("   3. Check Railway project settings");
  console.error("");
  console.error("💻 For local development:");
  console.error("   1. Create .env file with DATABASE_URL");
  console.error("   2. Start local PostgreSQL database");
  console.error("   3. Run: pnpm run start:dev");
  console.error("");
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

async function start() {
  try {
    // Run database migrations in production
    if (NODE_ENV === "production") {
      await runCommand(
        "npx",
        ["prisma", "migrate", "deploy"],
        "Database migration",
      );
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
    process.exit(1);
  }
}

start();
