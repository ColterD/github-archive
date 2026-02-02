import { MeiliSearch } from "meilisearch";
import { env } from "$env/dynamic/private";
import type { HardwareCategory, HardwareCondition } from "@prisma/client";
import { db } from "../db.js";
import { logger } from "../logger.js";

// Hardware specification interface for structured data
interface HardwareSpecifications {
  [key: string]: string | number | boolean | undefined;
}

// Meilisearch client configuration
const client = new MeiliSearch({
  host: env.MEILISEARCH_HOST || "http://localhost:7700",
  apiKey: env.MEILISEARCH_API_KEY || "masterKey",
});

// Index names
const HARDWARE_INDEX = "hardware_items";
const MANUFACTURERS_INDEX = "manufacturers";

export interface MeilisearchHardwareItem {
  id: string;
  name: string;
  slug: string;
  model: string;
  description: string;
  category: HardwareCategory;
  subcategory: string;
  condition: HardwareCondition;
  currentPrice: number;
  msrp: number;
  averageRating: number;
  reviewCount: number;
  viewCount: number;
  favoriteCount: number;
  manufacturerName: string;
  manufacturerSlug: string;
  specifications: HardwareSpecifications;
  features: string[];
  createdAt: number;
  updatedAt: number;
}

export interface MeilisearchSearchParams {
  query?: string;
  category?: HardwareCategory;
  manufacturer?: string;
  condition?: HardwareCondition;
  priceMin?: number;
  priceMax?: number;
  sort?: string;
  limit?: number;
  offset?: number;
  facets?: string[];
}

export interface MeilisearchSearchResult {
  hits: MeilisearchHardwareItem[];
  query: string;
  processingTimeMs: number;
  hitsPerPage: number;
  page: number;
  totalPages: number;
  totalHits: number;
  facetDistribution?: Record<string, Record<string, number>>;
  facetStats?: Record<string, { min: number; max: number }>;
}

export class MeilisearchService {
  private hardwareIndex;
  private manufacturersIndex;

  constructor() {
    this.hardwareIndex = client.index(HARDWARE_INDEX);
    this.manufacturersIndex = client.index(MANUFACTURERS_INDEX);
  }

  /**
   * Initialize Meilisearch indexes with proper settings
   */
  async initializeIndexes() {
    try {
      // Create hardware index with settings
      await this.hardwareIndex.updateSettings({
        // Searchable attributes with priority
        searchableAttributes: [
          "name",
          "model",
          "description",
          "manufacturerName",
          "subcategory",
          "specifications",
          "features",
        ],

        // Displayed attributes (all fields we want to return)
        displayedAttributes: [
          "id",
          "name",
          "slug",
          "model",
          "description",
          "category",
          "subcategory",
          "condition",
          "currentPrice",
          "msrp",
          "averageRating",
          "reviewCount",
          "viewCount",
          "favoriteCount",
          "manufacturerName",
          "manufacturerSlug",
          "specifications",
          "features",
          "createdAt",
          "updatedAt",
        ],

        // Filterable attributes for faceted search
        filterableAttributes: [
          "category",
          "subcategory",
          "condition",
          "manufacturerName",
          "manufacturerSlug",
          "currentPrice",
          "msrp",
          "averageRating",
          "reviewCount",
          "createdAt",
        ],

        // Sortable attributes
        sortableAttributes: [
          "name",
          "currentPrice",
          "msrp",
          "averageRating",
          "reviewCount",
          "viewCount",
          "favoriteCount",
          "createdAt",
          "updatedAt",
        ],

        // Ranking rules for relevance
        rankingRules: [
          "words",
          "typo",
          "proximity",
          "attribute",
          "sort",
          "exactness",
          "averageRating:desc",
          "reviewCount:desc",
        ],

        // Synonyms for better search
        synonyms: {
          server: ["servers", "machine", "host"],
          storage: ["disk", "drive", "hdd", "ssd"],
          networking: ["network", "switch", "router"],
          ram: ["memory", "dimm"],
          cpu: ["processor", "chip"],
          gpu: ["graphics", "video card"],
          psu: ["power supply", "power unit"],
          enterprise: ["business", "commercial", "datacenter"],
          homelab: ["home lab", "home server", "self-hosted"],
        },

        // Typo tolerance settings
        typoTolerance: {
          enabled: true,
          minWordSizeForTypos: {
            oneTypo: 4,
            twoTypos: 8,
          },
          disableOnWords: [],
          disableOnAttributes: [],
        },

        // Faceting configuration
        faceting: {
          maxValuesPerFacet: 100,
          sortFacetValuesBy: {
            "*": "count",
          },
        },

        // Pagination settings
        pagination: {
          maxTotalHits: 1000,
        },
      });

      // Create manufacturers index with settings
      await this.manufacturersIndex.updateSettings({
        searchableAttributes: ["name", "description"],
        displayedAttributes: [
          "id",
          "name",
          "slug",
          "logoUrl",
          "website",
          "description",
        ],
        filterableAttributes: ["name", "slug"],
        sortableAttributes: ["name"],
      });

      logger.info("Meilisearch indexes initialized successfully");
    } catch (error) {
      logger.error("Failed to initialize Meilisearch indexes:", error as Error);
      throw error;
    }
  }

  /**
   * Sync hardware items from database to Meilisearch
   */
  async syncHardwareItems() {
    try {
      const hardwareItems = await db.hardwareItem.findMany({
        include: {
          manufacturer: {
            select: {
              name: true,
              slug: true,
            },
          },
        },
        where: {
          status: "ACTIVE",
        },
      });

      const meilisearchDocuments: MeilisearchHardwareItem[] = hardwareItems.map(
        (item) => ({
          id: item.id,
          name: item.name,
          slug: item.slug,
          model: item.model,
          description: item.description || "",
          category: item.category,
          subcategory: item.subcategory || "",
          condition: item.condition,
          currentPrice: item.currentPrice || 0,
          msrp: item.msrp || 0,
          averageRating: item.averageRating || 0,
          reviewCount: item.reviewCount,
          viewCount: item.viewCount,
          favoriteCount: item.favoriteCount,
          manufacturerName: item.manufacturer.name,
          manufacturerSlug: item.manufacturer.slug,
          specifications: item.specifications
            ? JSON.parse(item.specifications)
            : {},
          features: item.features ? JSON.parse(item.features) : [],
          createdAt: item.createdAt.getTime(),
          updatedAt: item.updatedAt.getTime(),
        }),
      );

      // Add documents to Meilisearch
      const task = await this.hardwareIndex.addDocuments(meilisearchDocuments);

      logger.info(
        `Synced ${meilisearchDocuments.length} hardware items to Meilisearch`,
        {
          taskUid: task.taskUid,
        },
      );

      return task;
    } catch (error) {
      logger.error(
        "Failed to sync hardware items to Meilisearch:",
        error as Error,
      );
      throw error;
    }
  }

  /**
   * Sync manufacturers from database to Meilisearch
   */
  async syncManufacturers() {
    try {
      const manufacturers = await db.manufacturer.findMany();

      const meilisearchDocuments = manufacturers.map((manufacturer) => ({
        id: manufacturer.id,
        name: manufacturer.name,
        slug: manufacturer.slug,
        logoUrl: manufacturer.logoUrl,
        website: manufacturer.website,
        description: manufacturer.description || "",
      }));

      const task =
        await this.manufacturersIndex.addDocuments(meilisearchDocuments);

      logger.info(
        `Synced ${meilisearchDocuments.length} manufacturers to Meilisearch`,
        {
          taskUid: task.taskUid,
        },
      );

      return task;
    } catch (error) {
      logger.error(
        "Failed to sync manufacturers to Meilisearch:",
        error as Error,
      );
      throw error;
    }
  }

  /**
   * Advanced search with typo tolerance and faceted search
   */
  async search(
    params: MeilisearchSearchParams,
  ): Promise<MeilisearchSearchResult> {
    try {
      const {
        query = "",
        category,
        manufacturer,
        condition,
        priceMin,
        priceMax,
        sort = "relevance",
        limit = 20,
        offset = 0,
        facets = [],
      } = params;

      // Build filter array
      const filters: string[] = [];

      if (category) {
        filters.push(`category = "${category}"`);
      }

      if (manufacturer) {
        filters.push(`manufacturerName = "${manufacturer}"`);
      }

      if (condition) {
        filters.push(`condition = "${condition}"`);
      }

      if (priceMin !== undefined) {
        filters.push(`currentPrice >= ${priceMin}`);
      }

      if (priceMax !== undefined) {
        filters.push(`currentPrice <= ${priceMax}`);
      }

      // Build sort array
      const sortArray: string[] = [];
      switch (sort) {
        case "price-asc":
          sortArray.push("currentPrice:asc");
          break;
        case "price-desc":
          sortArray.push("currentPrice:desc");
          break;
        case "rating":
          sortArray.push("averageRating:desc");
          break;
        case "newest":
          sortArray.push("createdAt:desc");
          break;
        case "popular":
          sortArray.push("viewCount:desc");
          break;
        default:
          // Use default ranking rules for relevance
          break;
      }

      // Execute search
      const searchResult = await this.hardwareIndex.search(query, {
        filter: filters.length > 0 ? filters : undefined,
        sort: sortArray.length > 0 ? sortArray : undefined,
        limit,
        offset,
        facets: facets.length > 0 ? facets : undefined,
        attributesToHighlight: ["name", "description", "model"],
        highlightPreTag: "<mark>",
        highlightPostTag: "</mark>",
        attributesToCrop: ["description"],
        cropLength: 200,
        cropMarker: "...",
      });

      return {
        hits: searchResult.hits as MeilisearchHardwareItem[],
        query: searchResult.query,
        processingTimeMs: searchResult.processingTimeMs,
        hitsPerPage: searchResult.limit || 20,
        page:
          Math.floor((searchResult.offset || 0) / (searchResult.limit || 20)) +
          1,
        totalPages: Math.ceil(
          (searchResult.estimatedTotalHits || 0) / (searchResult.limit || 20),
        ),
        totalHits: searchResult.estimatedTotalHits || 0,
        facetDistribution: searchResult.facetDistribution,
        facetStats: searchResult.facetStats,
      };
    } catch (error) {
      logger.error("Meilisearch search error:", error as Error);
      throw error;
    }
  }

  /**
   * Get search suggestions for autocomplete
   */
  async getSuggestions(query: string, limit: number = 5): Promise<string[]> {
    try {
      const searchResult = await this.hardwareIndex.search(query, {
        limit,
        attributesToRetrieve: ["name", "model", "manufacturerName"],
        attributesToHighlight: [],
      });

      // Extract unique suggestions from results
      const suggestions = new Set<string>();

      searchResult.hits.forEach((hit) => {
        const hardwareHit = hit as MeilisearchHardwareItem;
        suggestions.add(hardwareHit.name);
        suggestions.add(hardwareHit.model);
        suggestions.add(hardwareHit.manufacturerName);
      });

      return Array.from(suggestions).slice(0, limit);
    } catch (error) {
      logger.error("Meilisearch suggestions error:", error as Error);
      return [];
    }
  }

  /**
   * Get facet values for a specific attribute
   */
  async getFacetValues(
    attribute: string,
    query?: string,
  ): Promise<Record<string, number>> {
    try {
      const searchResult = await this.hardwareIndex.search(query || "", {
        facets: [attribute],
        limit: 0, // We only want facet data
      });

      return searchResult.facetDistribution?.[attribute] || {};
    } catch (error) {
      logger.error("Meilisearch facet values error:", error as Error);
      return {};
    }
  }

  /**
   * Get similar items based on an item ID
   */
  async getSimilarItems(
    itemId: string,
    limit: number = 5,
  ): Promise<MeilisearchHardwareItem[]> {
    try {
      // Get the original item first
      const originalItem = (await this.hardwareIndex.getDocument(
        itemId,
      )) as MeilisearchHardwareItem;

      if (!originalItem) {
        return [];
      }

      // Search for similar items based on category and manufacturer
      const searchResult = await this.hardwareIndex.search("", {
        filter: [`category = "${originalItem.category}"`, `id != "${itemId}"`],
        sort: ["averageRating:desc"],
        limit,
      });

      return searchResult.hits as MeilisearchHardwareItem[];
    } catch (error) {
      logger.error("Meilisearch similar items error:", error as Error);
      return [];
    }
  }

  /**
   * Update a single hardware item in Meilisearch
   */
  async updateHardwareItem(itemId: string) {
    try {
      const item = await db.hardwareItem.findUnique({
        where: { id: itemId },
        include: {
          manufacturer: {
            select: {
              name: true,
              slug: true,
            },
          },
        },
      });

      if (!item) {
        logger.warn(`Hardware item ${itemId} not found for Meilisearch update`);
        return;
      }

      const meilisearchDocument: MeilisearchHardwareItem = {
        id: item.id,
        name: item.name,
        slug: item.slug,
        model: item.model,
        description: item.description || "",
        category: item.category,
        subcategory: item.subcategory || "",
        condition: item.condition,
        currentPrice: item.currentPrice || 0,
        msrp: item.msrp || 0,
        averageRating: item.averageRating || 0,
        reviewCount: item.reviewCount,
        viewCount: item.viewCount,
        favoriteCount: item.favoriteCount,
        manufacturerName: item.manufacturer.name,
        manufacturerSlug: item.manufacturer.slug,
        specifications: item.specifications
          ? JSON.parse(item.specifications)
          : {},
        features: item.features ? JSON.parse(item.features) : [],
        createdAt: item.createdAt.getTime(),
        updatedAt: item.updatedAt.getTime(),
      };

      const task = await this.hardwareIndex.addDocuments([meilisearchDocument]);

      logger.info(`Updated hardware item ${itemId} in Meilisearch`, {
        taskUid: task.taskUid,
      });

      return task;
    } catch (error) {
      logger.error(
        `Failed to update hardware item ${itemId} in Meilisearch:`,
        error as Error,
      );
      throw error;
    }
  }

  /**
   * Delete a hardware item from Meilisearch
   */
  async deleteHardwareItem(itemId: string) {
    try {
      const task = await this.hardwareIndex.deleteDocument(itemId);

      logger.info(`Deleted hardware item ${itemId} from Meilisearch`, {
        taskUid: task.taskUid,
      });

      return task;
    } catch (error) {
      logger.error(
        `Failed to delete hardware item ${itemId} from Meilisearch:`,
        error as Error,
      );
      throw error;
    }
  }

  /**
   * Get index stats
   */
  async getStats() {
    try {
      const [hardwareStats, manufacturersStats] = await Promise.all([
        this.hardwareIndex.getStats(),
        this.manufacturersIndex.getStats(),
      ]);

      return {
        hardware: hardwareStats,
        manufacturers: manufacturersStats,
      };
    } catch (error) {
      logger.error("Failed to get Meilisearch stats:", error as Error);
      throw error;
    }
  }

  /**
   * Health check for Meilisearch
   */
  async healthCheck(): Promise<boolean> {
    try {
      const health = await client.health();
      return health.status === "available";
    } catch (error) {
      logger.error("Meilisearch health check failed:", error as Error);
      return false;
    }
  }
}

// Export singleton instance
export const meilisearchService = new MeilisearchService();
