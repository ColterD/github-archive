import { describe, it, expect, vi, beforeEach } from "vitest";
import { validateUser, hashPassword } from "./auth";

// Mock bcrypt
vi.mock("bcrypt", () => ({
  default: {
    hash: vi.fn(),
    compare: vi.fn(),
    genSalt: vi.fn(),
  },
  hash: vi.fn(),
  compare: vi.fn(),
  genSalt: vi.fn(),
}));

describe("Auth Utils", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("validateUser", () => {
    it("should validate user data correctly", () => {
      const validUser = {
        name: "John Doe",
        email: "john@example.com",
        username: "johndoe",
      };

      const result = validateUser(validUser);
      expect(result.success).toBe(true);
    });

    it("should reject invalid email", () => {
      const invalidUser = {
        name: "John Doe",
        email: "invalid-email",
        username: "johndoe",
      };

      const result = validateUser(invalidUser);
      expect(result.success).toBe(false);
    });

    it("should reject short username", () => {
      const invalidUser = {
        name: "John Doe",
        email: "john@example.com",
        username: "jo",
      };

      const result = validateUser(invalidUser);
      expect(result.success).toBe(false);
    });

    it("should reject empty name", () => {
      const invalidUser = {
        name: "",
        email: "john@example.com",
        username: "johndoe",
      };

      const result = validateUser(invalidUser);
      expect(result.success).toBe(false);
    });
  });

  describe("hashPassword", () => {
    it("should hash password correctly", async () => {
      const bcrypt = await import("bcrypt");
      const mockHash = "hashed-password";

      vi.mocked(bcrypt.default.hash).mockResolvedValue(mockHash as never);
      vi.mocked(bcrypt.default.genSalt).mockResolvedValue("salt" as never);

      const result = await hashPassword("password123");

      expect(result).toBe(mockHash);
      expect(bcrypt.default.genSalt).toHaveBeenCalledWith(12);
      expect(bcrypt.default.hash).toHaveBeenCalledWith("password123", "salt");
    });

    it("should handle hashing errors", async () => {
      const bcrypt = await import("bcrypt");
      vi.mocked(bcrypt.default.genSalt).mockRejectedValue(
        new Error("Hashing failed"),
      );

      await expect(hashPassword("password123")).rejects.toThrow(
        "Hashing failed",
      );
    });
  });
});
