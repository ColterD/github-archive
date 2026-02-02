import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Mock Prisma client
const mockPrismaClient = {
  $connect: vi.fn(),
  $disconnect: vi.fn(),
  $use: vi.fn(),
  $queryRaw: vi.fn(),
  user: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  hardwareItem: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  build: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  manufacturer: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
};

vi.mock("@prisma/client", () => ({
  PrismaClient: vi.fn().mockImplementation(() => mockPrismaClient),
}));

describe("Database Connection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("should have a database instance", async () => {
    const { db } = await import("./db");
    expect(db).toBeDefined();
  });

  it("should have user model", async () => {
    const { db } = await import("./db");
    expect(db.user).toBeDefined();
  });

  it("should have hardwareItem model", async () => {
    const { db } = await import("./db");
    expect(db.hardwareItem).toBeDefined();
  });

  it("should have build model", async () => {
    const { db } = await import("./db");
    expect(db.build).toBeDefined();
  });

  it("should have manufacturer model", async () => {
    const { db } = await import("./db");
    expect(db.manufacturer).toBeDefined();
  });
});
