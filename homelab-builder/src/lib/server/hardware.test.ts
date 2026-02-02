import { describe, it, expect, vi, beforeEach } from "vitest";
import type { HardwareCategory } from "@prisma/client";

// Mock database
const mockDb = {
  hardwareItem: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
    count: vi.fn(),
    findFirst: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    groupBy: vi.fn(),
  },
  manufacturer: {
    findMany: vi.fn(),
  },
  priceHistory: {
    findMany: vi.fn(),
    create: vi.fn(),
  },
};

vi.mock("./db", () => ({
  db: mockDb,
}));

// Mock Redis
vi.mock("./redis", () => ({
  redis: null,
}));

describe("Hardware Service", () => {
  let HardwareService: typeof import("./services/hardware").HardwareService;
  let hardwareService: InstanceType<
    typeof import("./services/hardware").HardwareService
  >;

  beforeEach(async () => {
    vi.clearAllMocks();
    // Import after mock
    const module = await import("./services/hardware");
    HardwareService = module.HardwareService;
    hardwareService = new HardwareService();
  });

  describe("search", () => {
    it("should return hardware items with pagination", async () => {
      const mockItems = [
        {
          id: "1",
          name: "Test GPU",
          description: "Test GPU description",
          category: "GPU" as HardwareCategory,
          condition: "EXCELLENT",
          currentPrice: 500,
          manufacturer: { name: "NVIDIA", logoUrl: null },
          averageRating: 4.5,
          _count: { reviews: 10 },
        },
      ];

      mockDb.hardwareItem.findMany.mockResolvedValue(mockItems);
      mockDb.hardwareItem.count.mockResolvedValue(1);
      mockDb.hardwareItem.groupBy.mockResolvedValue([]);
      mockDb.manufacturer.findMany.mockResolvedValue([]);

      const result = await hardwareService.search({
        query: "GPU",
        page: 1,
        limit: 10,
      });

      expect(result.items).toHaveLength(1);
      expect(result.totalCount).toBe(1);
      expect(result.currentPage).toBe(1);
      expect(result.totalPages).toBe(1);
    });

    it("should handle empty search results", async () => {
      mockDb.hardwareItem.findMany.mockResolvedValue([]);
      mockDb.hardwareItem.count.mockResolvedValue(0);
      mockDb.hardwareItem.groupBy.mockResolvedValue([]);
      mockDb.manufacturer.findMany.mockResolvedValue([]);

      const result = await hardwareService.search({
        query: "nonexistent",
        page: 1,
        limit: 10,
      });

      expect(result.items).toHaveLength(0);
      expect(result.totalCount).toBe(0);
      expect(result.currentPage).toBe(1);
      expect(result.totalPages).toBe(0);
    });
  });

  describe("getByCategory", () => {
    it("should return items by category", async () => {
      const mockItems = [
        {
          id: "1",
          name: "Test GPU",
          category: "GPU" as HardwareCategory,
          currentPrice: 500,
          manufacturer: { name: "NVIDIA" },
          _count: { reviews: 5 },
        },
      ];

      mockDb.hardwareItem.findMany.mockResolvedValue(mockItems);
      mockDb.hardwareItem.count.mockResolvedValue(1);

      const result = await hardwareService.getByCategory(
        "GPU" as HardwareCategory,
        1,
        10,
      );

      expect(result.items).toHaveLength(1);
      expect(result.totalCount).toBe(1);
      expect(result.currentPage).toBe(1);
      expect(result.totalPages).toBe(1);
    });
  });

  describe("getPriceHistory", () => {
    it("should return price history for an item", async () => {
      const mockHistory = [
        {
          id: "1",
          price: 500,
          timestamp: new Date("2024-01-01"),
          source: "Amazon",
        },
      ];

      mockDb.priceHistory.findMany.mockResolvedValue(mockHistory);

      const result = await hardwareService.getPriceHistory("item-id");

      expect(result).toEqual(mockHistory);
      expect(mockDb.priceHistory.findMany).toHaveBeenCalledWith({
        where: { hardwareId: "item-id" },
        orderBy: { timestamp: "desc" },
        take: 30,
      });
    });
  });

  describe("getById", () => {
    it("should return a hardware item by ID", async () => {
      const mockItem = {
        id: "1",
        name: "Test GPU",
        manufacturer: { name: "NVIDIA" },
        category: "GPU",
        currentPrice: 500,
      };

      mockDb.hardwareItem.findUnique.mockResolvedValue(mockItem);

      const result = await hardwareService.getById("1");

      expect(result).toEqual(mockItem);
      expect(mockDb.hardwareItem.findUnique).toHaveBeenCalledWith({
        where: { id: "1" },
        include: {
          manufacturer: {
            select: {
              name: true,
              logoUrl: true,
              website: true,
            },
          },
        },
      });
    });

    it("should return null for non-existent item", async () => {
      mockDb.hardwareItem.findUnique.mockResolvedValue(null);

      const result = await hardwareService.getById("nonexistent");

      expect(result).toBeNull();
    });
  });
});
