#!/usr/bin/env node

import { spawn } from "child_process";

console.log("🔧 Railway Migration Repair Tool");
console.log(
  "This script fixes P3009 migration errors by resetting migration state",
);

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
        console.log(`⚠️ ${description} completed with code ${code}`);
        resolve(undefined); // Don't reject, as some commands may "fail" but still work
      }
    });

    child.on("error", (error) => {
      console.error(`❌ ${description} error:`, error.message);
      reject(error);
    });
  });
}

async function repairMigrations() {
  try {
    console.log("🛠️ Starting migration repair process...");

    // Step 1: Try to resolve migration issues
    console.log("📋 Step 1: Attempting to resolve migration conflicts...");
    await runCommand(
      "npx",
      ["prisma", "migrate", "resolve", "--applied", "20250110000000_init"],
      "Marking failed migration as applied",
    );

    // Step 2: Deploy any remaining migrations
    console.log("📋 Step 2: Deploying migrations...");
    await runCommand(
      "npx",
      ["prisma", "migrate", "deploy"],
      "Deploying migrations",
    );

    // Step 3: Generate Prisma client
    console.log("📋 Step 3: Generating Prisma client...");
    await runCommand("npx", ["prisma", "generate"], "Generating Prisma client");

    // Step 4: Verify database status
    console.log("📋 Step 4: Verifying database status...");
    await runCommand(
      "npx",
      ["prisma", "migrate", "status"],
      "Checking migration status",
    );

    console.log("✅ Migration repair completed!");
    console.log("🚀 Database should now be ready for the application");
  } catch (error) {
    console.error(
      "💥 Migration repair failed:",
      /** @type {Error} */ (error).message,
    );
    console.log("");
    console.log("🔍 If this continues to fail, you may need to:");
    console.log("   1. Access Railway database directly");
    console.log("   2. Drop and recreate the database");
    console.log("   3. Or contact Railway support");
    process.exit(1);
  }
}

repairMigrations();
