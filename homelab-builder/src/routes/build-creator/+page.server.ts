// HOMELAB HARDWARE PLATFORM - BUILD CREATOR SERVER
import type { PageServerLoad } from "./$types";
import { db } from "$lib/server/db";
import { redirect } from "@sveltejs/kit";
import { logger } from "$lib/server/logger";

// Interface for hardware specifications object
interface HardwareSpecifications {
  power?: string | number;
  powerDraw?: string | number;
  power_consumption?: string | number;
  wattage?: string | number;
  watts?: string | number;
  category?: string;
  [key: string]: unknown;
}

export const load: PageServerLoad = async ({ locals, url }) => {
  // Require authentication
  if (!locals.user) {
    throw redirect(302, "/auth/signin");
  }

  const editBuildId = url.searchParams.get("edit");

  try {
    // Load hardware by category for build creator
    const [servers, storage, networking, memory, existingBuild] =
      await Promise.all([
        // Servers
        db.hardwareItem.findMany({
          where: {
            category: "SERVER",
            isActive: true,
            status: "ACTIVE",
          },
          select: {
            id: true,
            name: true,
            model: true,
            manufacturerName: true,
            currentPrice: true,
            specifications: true,
            features: true,
            condition: true,
            images: true,
          },
          orderBy: { name: "asc" },
          take: 50,
        }),

        // Storage
        db.hardwareItem.findMany({
          where: {
            category: "STORAGE",
            isActive: true,
            status: "ACTIVE",
          },
          select: {
            id: true,
            name: true,
            model: true,
            manufacturerName: true,
            currentPrice: true,
            specifications: true,
            features: true,
            condition: true,
            images: true,
          },
          orderBy: { name: "asc" },
          take: 50,
        }),

        // Networking
        db.hardwareItem.findMany({
          where: {
            category: "NETWORKING",
            isActive: true,
            status: "ACTIVE",
          },
          select: {
            id: true,
            name: true,
            model: true,
            manufacturerName: true,
            currentPrice: true,
            specifications: true,
            features: true,
            condition: true,
            images: true,
          },
          orderBy: { name: "asc" },
          take: 30,
        }),

        // Memory/Components
        db.hardwareItem.findMany({
          where: {
            category: "COMPONENTS",
            isActive: true,
            status: "ACTIVE",
          },
          select: {
            id: true,
            name: true,
            model: true,
            manufacturerName: true,
            currentPrice: true,
            specifications: true,
            features: true,
            condition: true,
            images: true,
          },
          orderBy: { name: "asc" },
          take: 100,
        }),

        // Load existing build if editing
        editBuildId
          ? db.build.findUnique({
              where: {
                id: editBuildId,
                userId: locals.user.id, // Ensure user owns the build
              },
              include: {
                buildItems: {
                  include: {
                    hardwareItem: true,
                  },
                },
              },
            })
          : null,
      ]);

    // Parse specifications and features for frontend
    const parseJsonField = (field: string | null) => {
      try {
        return field ? JSON.parse(field) : null;
      } catch {
        return null;
      }
    };

    const hardware = {
      server: servers.map((item) => ({
        ...item,
        specifications: parseJsonField(item.specifications),
        features: parseJsonField(item.features),
        images: parseJsonField(item.images),
        powerDraw: extractPowerDraw(parseJsonField(item.specifications)),
      })),
      storage: storage.map((item) => ({
        ...item,
        specifications: parseJsonField(item.specifications),
        features: parseJsonField(item.features),
        images: parseJsonField(item.images),
        powerDraw: extractPowerDraw(parseJsonField(item.specifications)),
      })),
      networking: networking.map((item) => ({
        ...item,
        specifications: parseJsonField(item.specifications),
        features: parseJsonField(item.features),
        images: parseJsonField(item.images),
        powerDraw: extractPowerDraw(parseJsonField(item.specifications)),
      })),
      memory: memory.map((item) => ({
        ...item,
        specifications: parseJsonField(item.specifications),
        features: parseJsonField(item.features),
        images: parseJsonField(item.images),
        powerDraw: extractPowerDraw(parseJsonField(item.specifications)),
      })),
    };

    return {
      hardware,
      existingBuild: existingBuild
        ? {
            ...existingBuild,
            items: existingBuild.buildItems.map((item) => ({
              id: item.id,
              hardwareItemId: item.hardwareItemId,
              quantity: item.quantity,
              notes: item.notes,
              hardwareItem: {
                ...item.hardwareItem,
                specifications: parseJsonField(
                  item.hardwareItem.specifications,
                ),
                features: parseJsonField(item.hardwareItem.features),
                images: parseJsonField(item.hardwareItem.images),
              },
            })),
          }
        : null,
      isEditing: !!editBuildId,
    };
  } catch (error) {
    logger.error("Failed to load build creator data", error as Error);
    return {
      hardware: {
        server: [],
        storage: [],
        networking: [],
        memory: [],
      },
      existingBuild: null,
      isEditing: false,
    };
  }
};

// Helper function to extract power draw from specifications
function extractPowerDraw(specs: HardwareSpecifications | null): number {
  if (!specs || typeof specs !== "object") return 0;

  // Look for common power specification fields
  const powerFields = [
    "power",
    "powerDraw",
    "power_consumption",
    "wattage",
    "watts",
  ];

  for (const field of powerFields) {
    if (specs[field]) {
      const power = parseInt(String(specs[field]).replace(/\D/g, ""));
      if (!isNaN(power) && power > 0) return power;
    }
  }

  // Default estimates by category if no power spec found
  if (specs.category === "SERVER") return 400;
  if (specs.category === "STORAGE") return 300;
  if (specs.category === "NETWORKING") return 50;
  if (specs.category === "COMPONENTS") return 20;

  return 0;
}
