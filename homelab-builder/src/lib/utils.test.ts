import { describe, it, expect } from "vitest";
import { cn, slugify, formatPrice, formatDate } from "./utils";

describe("Utils", () => {
  describe("cn", () => {
    it("should merge class names correctly", () => {
      const result = cn("base-class", "additional-class");
      expect(result).toContain("base-class");
      expect(result).toContain("additional-class");
    });

    it("should handle conditional classes", () => {
      const showConditional = true;
      const showHidden = false;
      const result = cn(
        "base-class",
        showConditional && "conditional-class",
        showHidden && "hidden-class",
      );
      expect(result).toContain("base-class");
      expect(result).toContain("conditional-class");
      expect(result).not.toContain("hidden-class");
    });

    it("should handle empty inputs", () => {
      const result = cn("", null, undefined);
      expect(result).toBe("");
    });
  });

  describe("slugify", () => {
    it("should create URL-friendly slugs", () => {
      expect(slugify("Hello World")).toBe("hello-world");
      expect(slugify("Test with Numbers 123")).toBe("test-with-numbers-123");
      expect(slugify("Special Characters !@#$%")).toBe("special-characters");
    });

    it("should handle empty strings", () => {
      expect(slugify("")).toBe("");
    });

    it("should handle strings with multiple spaces", () => {
      expect(slugify("Multiple   Spaces   Here")).toBe("multiple-spaces-here");
    });

    it("should handle unicode characters", () => {
      expect(slugify("Café & Restaurant")).toBe("cafe-restaurant");
    });
  });

  describe("formatPrice", () => {
    it("should format prices correctly", () => {
      expect(formatPrice(1000)).toBe("$1,000.00");
      expect(formatPrice(99.99)).toBe("$99.99");
      expect(formatPrice(0)).toBe("$0.00");
    });

    it("should handle negative prices", () => {
      expect(formatPrice(-50)).toBe("-$50.00");
    });

    it("should handle large numbers", () => {
      expect(formatPrice(1000000)).toBe("$1,000,000.00");
    });
  });

  describe("formatDate", () => {
    it("should format dates correctly", () => {
      const date = new Date("2024-01-15T10:30:00Z");
      const result = formatDate(date);
      expect(result).toMatch(/^\w{3} \d{1,2}, \d{4}$/); // Format: "Jan 15, 2024"
    });

    it("should handle date strings", () => {
      const result = formatDate("2024-01-15");
      expect(result).toMatch(/^\w{3} \d{1,2}, \d{4}$/); // Format: "Jan 15, 2024"
    });

    it("should handle invalid dates", () => {
      const result = formatDate("invalid-date");
      expect(result).toBe("Invalid Date");
    });
  });
});
