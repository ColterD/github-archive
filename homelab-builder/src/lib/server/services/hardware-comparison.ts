// Hardware comparison and compatibility checking service
import { db } from "../db";
import { logger } from "../logger";
import type {
  HardwareItem,
  HardwareCategory,
  Manufacturer,
} from "@prisma/client";
import { z } from "zod";

// Enhanced type for hardware items with computed fields
type HardwareItemWithRelations = Omit<
  HardwareItem,
  "specifications" | "features" | "averageRating"
> & {
  manufacturer: Manufacturer;
  specifications: Record<string, unknown>; // Transformed from JSON string
  features: string[]; // Transformed from JSON string
  averageRating?: number | null; // Allow both undefined and null like Prisma
  reviewCount?: number;
  currentPrice: number;
  subcategory?: string | null; // Add missing subcategory field
  reviews?: Array<{ rating: number }>; // Optional for flexibility
  _count?: { reviews: number; favorites: number }; // Optional for flexibility
};

// Specification value type for comparisons
interface SpecificationValue {
  itemId: string;
  value: string | number | null;
  highlight: "best" | "worst" | null;
}

export class HardwareComparisonService {
  private static instance: HardwareComparisonService;

  private constructor() {}

  static getInstance(): HardwareComparisonService {
    if (!HardwareComparisonService.instance) {
      HardwareComparisonService.instance = new HardwareComparisonService();
    }
    return HardwareComparisonService.instance;
  }

  // Compare multiple hardware items with detailed analysis
  async compareHardware(itemIds: string[]): Promise<HardwareComparisonResult> {
    try {
      if (itemIds.length < 2) {
        throw new Error("At least 2 items required for comparison");
      }

      // Fetch items with all related data using correct schema fields
      const rawItems = await db.hardwareItem.findMany({
        where: { id: { in: itemIds } },
        include: {
          manufacturer: true,
          reviews: {
            select: { rating: true },
          },
          priceHistory: {
            orderBy: { timestamp: "desc" }, // Use timestamp as per schema
            take: 1,
          },
          _count: { select: { reviews: true, favorites: true } },
        },
      });

      if (rawItems.length === 0) {
        throw new Error("No hardware items found for comparison");
      }

      // Transform to enhanced format with proper type handling
      const enhancedItems: HardwareItemWithRelations[] = rawItems.map(
        (item) => {
          // Calculate average rating safely
          const avgRating =
            item.reviews.length > 0
              ? item.reviews.reduce((sum, r) => sum + r.rating, 0) /
                item.reviews.length
              : null;

          // Create the transformed item
          const enhancedItem: HardwareItemWithRelations = {
            // Include all original HardwareItem fields except specifications, features, averageRating
            id: item.id,
            name: item.name,
            slug: item.slug,
            model: item.model,
            description: item.description,
            images: item.images,
            category: item.category,
            subcategory: item.subcategory,
            manufacturerId: item.manufacturerId,
            manufacturerName: item.manufacturerName,
            modelNumber: item.modelNumber,
            condition: item.condition,
            rackUnits: item.rackUnits,
            currentPrice: item.currentPrice || 0,
            msrp: item.msrp,
            lowestPrice: item.lowestPrice,
            highestPrice: item.highestPrice,
            priceLastUpdated: item.priceLastUpdated,
            priceTrackingEnabled: item.priceTrackingEnabled,
            reviewCount: item._count.reviews,
            viewCount: item.viewCount,
            favoriteCount: item.favoriteCount,
            status: item.status,
            isActive: item.isActive,
            createdAt: item.createdAt,
            updatedAt: item.updatedAt,
            publishedAt: item.publishedAt,

            // Add computed and transformed fields
            manufacturer: item.manufacturer,
            specifications: this.parseSpecifications(item.specifications),
            features: this.parseFeatures(item.features),
            averageRating: avgRating,
          };

          return enhancedItem;
        },
      );

      // Perform analysis
      const comparison = this.analyzeComparison(enhancedItems);
      const compatibility = await this.calculateCompatibility(enhancedItems);
      const recommendations = this.generateRecommendations(
        enhancedItems,
        comparison,
      );

      return {
        items: enhancedItems,
        comparison,
        compatibility,
        recommendations,
        metadata: {
          comparedAt: new Date(),
          itemCount: enhancedItems.length,
          categories: [...new Set(enhancedItems.map((item) => item.category))],
        },
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      throw new Error(`Hardware comparison failed: ${errorMessage}`);
    }
  }

  // Find similar hardware items for comparison suggestions
  async findSimilarItems(
    itemId: string,
    limit: number = 5,
  ): Promise<HardwareItem[]> {
    try {
      const item = await db.hardwareItem.findUnique({
        where: { id: itemId },
        include: { manufacturer: true },
      });

      if (!item) {
        throw new Error("Hardware item not found");
      }

      // Find similar items based on category and specifications
      const similarItems = await db.hardwareItem.findMany({
        where: {
          AND: [
            { id: { not: itemId } },
            { status: "ACTIVE" },
            {
              OR: [
                { category: item.category },
                { manufacturerId: item.manufacturerId },
              ],
            },
          ],
        },
        include: { manufacturer: true },
        take: limit,
      });

      // Calculate similarity scores and sort
      const baseSpecs = this.parseSpecifications(item.specifications);
      const scoredItems = similarItems.map((similar) => {
        // Create a minimal HardwareItemWithRelations-like object for similarity calculation
        const baseItemForComparison: HardwareItemWithRelations = {
          ...item,
          specifications: baseSpecs,
          features: this.parseFeatures(item.features),
          currentPrice: item.currentPrice || 0,
        };

        const similarItemForComparison: HardwareItemWithRelations = {
          ...similar,
          specifications: this.parseSpecifications(similar.specifications),
          features: this.parseFeatures(similar.features),
          currentPrice: similar.currentPrice || 0,
        };

        return {
          ...similar,
          similarityScore: this.calculateSimilarityScore(
            baseItemForComparison,
            similarItemForComparison,
            baseSpecs,
          ),
        };
      });

      return scoredItems
        .sort((a, b) => b.similarityScore - a.similarityScore)
        .slice(0, limit);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      throw new Error(`Failed to find similar items: ${errorMessage}`);
    }
  }

  // Generate compatibility matrix between hardware items
  async checkCompatibility(itemIds: string[]): Promise<CompatibilityMatrix> {
    try {
      const items = await db.hardwareItem.findMany({
        where: { id: { in: itemIds } },
        include: { manufacturer: true },
      });

      const matrix: CompatibilityMatrix = {
        items: items.map((item) => ({
          id: item.id,
          name: item.name,
          category: item.category,
        })),
        compatibility: [],
      };

      // Check compatibility between each pair of items
      for (let i = 0; i < items.length; i++) {
        for (let j = i + 1; j < items.length; j++) {
          // Transform items to enhanced format for compatibility checking
          const enhancedItem1: HardwareItemWithRelations = {
            ...items[i],
            specifications: this.parseSpecifications(items[i].specifications),
            features: this.parseFeatures(items[i].features),
            currentPrice: items[i].currentPrice || 0,
          };
          const enhancedItem2: HardwareItemWithRelations = {
            ...items[j],
            specifications: this.parseSpecifications(items[j].specifications),
            features: this.parseFeatures(items[j].features),
            currentPrice: items[j].currentPrice || 0,
          };
          const compatibility = this.checkPairCompatibility(
            enhancedItem1,
            enhancedItem2,
          );
          matrix.compatibility.push(compatibility);
        }
      }

      return matrix;
    } catch (error) {
      logger.error("Compatibility check error:", error as Error);
      throw new Error("Failed to check compatibility");
    }
  }

  // Parse specifications JSON string into structured object
  private parseSpecifications(
    specificationsJson: string | null,
  ): Record<string, unknown> {
    try {
      return specificationsJson ? JSON.parse(specificationsJson) : {};
    } catch {
      return {};
    }
  }

  // Parse features JSON string into array
  private parseFeatures(featuresJson: string | null): string[] {
    try {
      return featuresJson ? JSON.parse(featuresJson) : [];
    } catch {
      return [];
    }
  }

  // Analyze comparison between hardware items
  private analyzeComparison(
    items: HardwareItemWithRelations[],
  ): ComparisonAnalysis {
    const allSpecs = this.getAllSpecificationKeys(items);
    const specComparison: Record<string, SpecificationComparison> = {};

    allSpecs.forEach((specKey) => {
      const values = items.map((item) => {
        const rawValue = item.specifications[specKey];
        // Convert to string|number|null format expected by SpecificationValue
        if (rawValue === undefined || rawValue === null) {
          return null;
        }
        if (typeof rawValue === "string" || typeof rawValue === "number") {
          return rawValue;
        }
        return String(rawValue);
      });

      const numericValues = values
        .filter((v) => v !== null && !isNaN(parseFloat(String(v))))
        .map((v) => parseFloat(String(v)));

      specComparison[specKey] = {
        key: specKey,
        values: values.map((value, index) => ({
          itemId: items[index].id,
          value: value,
          highlight: this.shouldHighlightValue(value, values, numericValues),
        })),
        isNumeric: numericValues.length > 0,
        winner: this.findWinner(values, numericValues, specKey),
      };
    });

    // Price comparison
    const prices = items
      .map((item) => item.currentPrice)
      .filter((p) => p !== null && p !== undefined);
    const priceComparison = {
      lowest: Math.min(...prices),
      highest: Math.max(...prices),
      average: prices.reduce((a, b) => a + b, 0) / prices.length,
      winner:
        items.find((item) => item.currentPrice === Math.min(...prices))?.id ||
        null,
    };

    // Rating comparison
    const ratingComparison = items.map((item) => ({
      itemId: item.id,
      rating: item.averageRating || 0,
      reviewCount: item.reviewCount || 0,
    }));

    return {
      specifications: specComparison,
      pricing: priceComparison,
      ratings: ratingComparison,
      pros: this.generatePros(items),
      cons: this.generateCons(items),
    };
  }

  // Get all unique specification keys from items
  private getAllSpecificationKeys(
    items: HardwareItemWithRelations[],
  ): string[] {
    const allKeys = new Set<string>();
    items.forEach((item) => {
      Object.keys(item.specifications).forEach((key) => allKeys.add(key));
    });
    return Array.from(allKeys).sort();
  }

  // Determine if a specification value should be highlighted
  private shouldHighlightValue(
    value: string | number | null,
    allValues: (string | number | null)[],
    numericValues: number[],
  ): "best" | "worst" | null {
    if (!value || value === "N/A") return null;

    if (numericValues.length > 1) {
      const numValue = parseFloat(String(value));
      if (!isNaN(numValue)) {
        const max = Math.max(...numericValues);
        const min = Math.min(...numericValues);

        if (numValue === max && max !== min) return "best";
        if (numValue === min && max !== min) return "worst";
      }
    }

    return null;
  }

  // Find the winner for a specification
  private findWinner(
    values: (string | number | null)[],
    numericValues: number[],
    specKey: string,
  ): string | null {
    if (numericValues.length < 2) return null;

    const isHigherBetter = this.isHigherBetterForSpec(specKey);
    const targetValue = isHigherBetter
      ? Math.max(...numericValues)
      : Math.min(...numericValues);

    const winnerIndex = values.findIndex(
      (v) => parseFloat(String(v)) === targetValue,
    );
    return winnerIndex >= 0 ? `item-${winnerIndex}` : null;
  }

  // Determine if higher values are better for a specification
  private isHigherBetterForSpec(specKey: string): boolean {
    const lowerIsBetter = [
      "power_consumption",
      "noise_level",
      "latency",
      "weight",
      "price",
    ];
    const higherIsBetter = [
      "performance",
      "speed",
      "capacity",
      "bandwidth",
      "cores",
      "memory",
      "storage",
    ];

    const keyLower = specKey.toLowerCase();
    if (lowerIsBetter.some((term) => keyLower.includes(term))) return false;
    if (higherIsBetter.some((term) => keyLower.includes(term))) return true;

    return true; // Default to higher is better
  }

  // Calculate compatibility between hardware items
  private async calculateCompatibility(
    items: HardwareItemWithRelations[],
  ): Promise<CompatibilityAnalysis> {
    const compatibilityIssues: CompatibilityIssue[] = [];
    const recommendations: string[] = [];

    // Check for obvious compatibility issues
    for (let i = 0; i < items.length; i++) {
      for (let j = i + 1; j < items.length; j++) {
        const issues = this.checkPairCompatibility(items[i], items[j]);
        if (issues.issues.length > 0) {
          compatibilityIssues.push(...issues.issues);
        }
      }
    }

    // Generate compatibility recommendations
    if (compatibilityIssues.length === 0) {
      recommendations.push("All items appear to be compatible");
    } else {
      recommendations.push("Consider compatibility issues before building");
      recommendations.push("Verify power requirements and connections");
    }

    return {
      overallScore: Math.max(0, 100 - compatibilityIssues.length * 20),
      issues: compatibilityIssues,
      recommendations,
    };
  }

  // Check pair compatibility for form factors, power, and connections
  private checkPairCompatibility(
    item1: HardwareItemWithRelations,
    item2: HardwareItemWithRelations,
  ): PairCompatibility {
    const issues: CompatibilityIssue[] = [];

    // Check power compatibility
    const power1 = String(item1.specifications.power || "");
    const power2 = String(item2.specifications.power || "");

    if (power1 && power2) {
      const totalPower = parseFloat(power1) + parseFloat(power2);
      if (totalPower > 1000) {
        // Arbitrary threshold
        issues.push({
          type: "power",
          severity: "warning",
          description: `Combined power consumption (${totalPower}W) may exceed PSU capacity`,
          items: [item1.id, item2.id],
        });
      }
    }

    // Check form factor compatibility
    const formFactor1 = String(item1.specifications.formFactor || "");
    const formFactor2 = String(item2.specifications.formFactor || "");

    if (
      formFactor1 &&
      formFactor2 &&
      this.areFormFactorsIncompatible(formFactor1, formFactor2)
    ) {
      issues.push({
        type: "form_factor",
        severity: "error",
        description: `Form factors ${formFactor1} and ${formFactor2} are incompatible`,
        items: [item1.id, item2.id],
      });
    }

    return {
      item1: item1.id,
      item2: item2.id,
      compatible: issues.every((issue) => issue.severity !== "error"),
      issues,
    };
  }

  // Check if form factors are incompatible
  private areFormFactorsIncompatible(ff1: string, ff2: string): boolean {
    const incompatiblePairs = [
      ["ATX", "Mini-ITX"],
      ["E-ATX", "Micro-ATX"],
      ["Server", "Desktop"],
    ];

    return incompatiblePairs.some(
      (pair) => pair.includes(ff1) && pair.includes(ff2) && ff1 !== ff2,
    );
  }

  // Calculate similarity score between two hardware items
  private calculateSimilarityScore(
    baseItem: HardwareItemWithRelations,
    compareItem: HardwareItemWithRelations,
    baseSpecs: Record<string, unknown>,
  ): number {
    let score = 0;
    let factors = 0;

    // Category match (high weight)
    if (baseItem.category === compareItem.category) {
      score += 40;
    }
    factors += 40;

    // Manufacturer match (medium weight)
    if (baseItem.manufacturerId === compareItem.manufacturerId) {
      score += 20;
    }
    factors += 20;

    // Specification similarity (medium weight)
    const compareSpecs = compareItem.specifications;
    const commonSpecs = Object.keys(baseSpecs).filter(
      (key) => compareSpecs[key] !== undefined && compareSpecs[key] !== null,
    );

    if (commonSpecs.length > 0) {
      const specMatches = commonSpecs.filter(
        (key) => String(baseSpecs[key]) === String(compareSpecs[key]),
      ).length;
      score += (specMatches / commonSpecs.length) * 25;
    }
    factors += 25;

    // Price similarity (low weight)
    const priceDiff = Math.abs(
      (baseItem.currentPrice || 0) - (compareItem.currentPrice || 0),
    );
    const maxPrice = Math.max(
      baseItem.currentPrice || 0,
      compareItem.currentPrice || 0,
    );
    if (maxPrice > 0) {
      const priceSimilarity = Math.max(0, 1 - priceDiff / maxPrice);
      score += priceSimilarity * 15;
    }
    factors += 15;

    return factors > 0 ? (score / factors) * 100 : 0;
  }

  // Generate pros for each item based on specifications and features
  private generatePros(
    items: HardwareItemWithRelations[],
  ): Record<string, string[]> {
    const pros: Record<string, string[]> = {};

    items.forEach((item) => {
      const itemPros: string[] = [];

      // Feature-based pros - features are already parsed
      if (item.features && item.features.length > 0) {
        item.features.slice(0, 3).forEach((feature) => {
          itemPros.push(`${feature}`);
        });
      }

      // Specification-based pros - specifications are already parsed
      const specs = item.specifications;

      // High performance indicators
      if (specs.cores && parseInt(String(specs.cores)) >= 8) {
        itemPros.push("High core count for multitasking");
      }

      if (specs.memory && parseInt(String(specs.memory)) >= 32) {
        itemPros.push("Generous memory capacity");
      }

      if (
        specs.storage &&
        String(specs.storage).toLowerCase().includes("ssd")
      ) {
        itemPros.push("Fast SSD storage");
      }

      // Rating-based pros
      if (item.averageRating && item.averageRating >= 4.0) {
        itemPros.push("Highly rated by users");
      }

      // Price-based pros
      const avgPrice =
        items.reduce((sum, i) => sum + (i.currentPrice || 0), 0) / items.length;
      if ((item.currentPrice || 0) < avgPrice * 0.8) {
        itemPros.push("Great value for money");
      }

      pros[item.id] = itemPros;
    });

    return pros;
  }

  // Generate cons for each item
  private generateCons(
    items: HardwareItemWithRelations[],
  ): Record<string, string[]> {
    const cons: Record<string, string[]> = {};

    items.forEach((item) => {
      const itemCons: string[] = [];

      // Specification-based cons - specifications are already parsed
      const specs = item.specifications;

      if (specs.power && parseInt(String(specs.power)) > 300) {
        itemCons.push("High power consumption");
      }

      if (specs.noise && parseInt(String(specs.noise)) > 40) {
        itemCons.push("May be noisy under load");
      }

      // Age-based cons
      if (specs.releaseYear && parseInt(String(specs.releaseYear)) < 2020) {
        itemCons.push("Older generation technology");
      }

      // Condition-based cons
      if (item.condition === "USED_FAIR" || item.condition === "FOR_PARTS") {
        itemCons.push("May have cosmetic or functional issues");
      }

      // Rating-based cons
      if (item.averageRating && item.averageRating < 3.0) {
        itemCons.push("Below average user ratings");
      }

      // Review count-based cons
      if ((item.reviewCount || 0) < 5) {
        itemCons.push("Limited user feedback available");
      }

      cons[item.id] = itemCons;
    });

    return cons;
  }

  // Generate recommendations based on comparison
  private generateRecommendations(
    items: HardwareItemWithRelations[],
    comparison: ComparisonAnalysis,
  ): string[] {
    const recommendations: string[] = [];

    // Price recommendation
    if (comparison.pricing.winner) {
      const winner = items.find(
        (item) => item.id === comparison.pricing.winner,
      );
      if (winner) {
        recommendations.push(
          `Best value: ${winner.name} offers the lowest price`,
        );
      }
    }

    // Performance recommendation
    const performanceSpecs = ["performance", "speed", "cores", "memory"];
    const perfWinners = performanceSpecs
      .map((spec) => comparison.specifications[spec]?.winner)
      .filter(
        (winner): winner is string => winner !== null && winner !== undefined,
      );

    if (perfWinners.length > 0) {
      // Find most common winner
      const winnerCounts = perfWinners.reduce(
        (acc: Record<string, number>, winner) => {
          acc[winner] = (acc[winner] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>,
      );

      const topPerformer = Object.entries(winnerCounts).sort(
        ([, a], [, b]) => b - a,
      )[0]?.[0];
      if (topPerformer) {
        recommendations.push(
          `Best performance: Item with superior specifications`,
        );
      }
    }

    // General recommendations
    recommendations.push(
      "Compare specifications carefully before making a decision",
    );
    recommendations.push("Consider your specific use case and requirements");

    return recommendations;
  }
}

// Export singleton instance
export const hardwareComparisonService =
  HardwareComparisonService.getInstance();

// Types and interfaces
export interface HardwareComparisonResult {
  items: HardwareItemWithRelations[];
  comparison: ComparisonAnalysis;
  compatibility: CompatibilityAnalysis;
  recommendations: string[];
  metadata: {
    comparedAt: Date;
    itemCount: number;
    categories: HardwareCategory[];
  };
}

export interface ComparisonAnalysis {
  specifications: Record<string, SpecificationComparison>;
  pricing: PriceComparison;
  ratings: RatingComparison[];
  pros: Record<string, string[]>;
  cons: Record<string, string[]>;
}

export interface SpecificationComparison {
  key: string;
  values: SpecificationValue[];
  isNumeric: boolean;
  winner: string | null;
}

export interface PriceComparison {
  lowest: number;
  highest: number;
  average: number;
  winner: string | null;
}

export interface RatingComparison {
  itemId: string;
  rating: number;
  reviewCount: number;
}

export interface CompatibilityAnalysis {
  overallScore: number;
  issues: CompatibilityIssue[];
  recommendations: string[];
}

export interface CompatibilityIssue {
  type: "power" | "form_factor" | "connection" | "software";
  severity: "error" | "warning" | "info";
  description: string;
  items: string[];
}

export interface CompatibilityMatrix {
  items: { id: string; name: string; category: HardwareCategory }[];
  compatibility: PairCompatibility[];
}

export interface PairCompatibility {
  item1: string;
  item2: string;
  compatible: boolean;
  issues: CompatibilityIssue[];
}

// Validation schemas
export const ComparisonRequestSchema = z.object({
  itemIds: z.array(z.string()).min(2).max(5),
});

export const SimilarItemsRequestSchema = z.object({
  itemId: z.string(),
  limit: z.number().min(1).max(20).default(5),
});
