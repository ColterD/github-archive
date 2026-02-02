// DATABASE TYPES - CLIENT-SAFE TYPE DEFINITIONS
// WARNING: Never import values from @prisma/client in this file!
// Only import types to prevent Prisma client bundling on client-side

import type {
  User,
  HardwareItem,
  Build,
  Manufacturer,
  PriceHistory,
  Review,
  HardwareCategory,
  HardwareCondition,
  BuildDifficulty,
} from "@prisma/client";

// Re-export types needed by client-side code
export type {
  User,
  HardwareItem,
  Build,
  Manufacturer,
  PriceHistory,
  Review,
  HardwareCategory,
  HardwareCondition,
  BuildDifficulty,
} from "@prisma/client";

// Re-export only types to prevent Prisma client from being bundled
export type DatabaseUser = User;
export type DatabaseHardwareItem = HardwareItem;
export type DatabaseBuild = Build;

// Input interfaces for forms and API
export interface HardwareSearch {
  query?: string | null;
}

// Extended interfaces for complex queries - don't extend base types to avoid conflicts
export interface HardwareItemWithRelations {
  id: string;
  name: string;
  model: string;
  slug: string;
  description?: string | null;
  images?: string | null;
  currentPrice?: number | null;
  msrp?: number | null;
  availability?: string | null;
  category?: HardwareCategory | null;
  condition?: HardwareCondition | null;
  manufacturerId?: string | null;
  specifications: Record<string, unknown>; // Parse JSON specifications
  manufacturer?: Manufacturer | null;
  priceHistory?: PriceHistory[];
  reviews?: Review[];
  _count?: {
    reviews: number;
    builds: number;
  };
}

export interface HardwareFilter {
  category?: HardwareCategory | null;
  condition?: HardwareCondition | null;
  manufacturerId?: string;
  minPrice?: number;
  maxPrice?: number;
  search?: string;
  sortBy?: "price" | "name" | "rating" | "created";
  sortOrder?: "asc" | "desc";
}

export interface BuildFilter {
  difficulty?: BuildDifficulty | null;
  category?: HardwareCategory | null;
  userId?: string;
  search?: string;
  sortBy?: "created" | "updated" | "name";
  sortOrder?: "asc" | "desc";
}

export interface HardwareWithDetails {
  id: string;
  name: string;
  model: string;
  slug: string;
  description?: string | null;
  images?: string | null;
  currentPrice?: number | null;
  msrp?: number | null;
  availability?: string | null;
  category?: HardwareCategory | null;
  condition?: HardwareCondition | null;
  manufacturerId?: string | null;
  specifications: Record<string, unknown>; // Parse JSON specifications
  manufacturer?: Manufacturer | null;
  priceHistory?: PriceHistory[];
  reviews?: Review[];
  _count?: {
    reviews: number;
    builds: number;
  };
}

export interface BuildWithDetails extends Build {
  user: User;
  hardware: HardwareItem[];
  _count?: {
    hardware: number;
  };
}

export interface UserWithStats extends User {
  _count: {
    builds: number;
    reviews: number;
  };
}

// Review with user relation for display
export interface ReviewWithUser extends Review {
  user: {
    id: string;
    name: string | null;
    avatar: string | null;
    createdAt: Date;
  };
}

// Chart data types for admin dashboard
export interface ChartDataPoint {
  label: string;
  value: number;
  date?: string;
  change?: number;
}

export interface AdminMetrics {
  totalUsers: number;
  totalHardware: number;
  totalBuilds: number;
  totalReviews: number;
  userGrowth: ChartDataPoint[];
  hardwareActivity: ChartDataPoint[];
  buildActivity: ChartDataPoint[];
  priceChanges: ChartDataPoint[];
}

// WebSocket message types
export interface WebSocketMessage {
  type: string;
  payload: Record<string, unknown>;
  timestamp: number;
  id: string;
}

// API response types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T = unknown> extends ApiResponse<T[]> {
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// Search result types
export interface SearchResult<T = unknown> {
  item: T;
  score: number;
  highlights?: Record<string, string[]>;
}

export interface SearchResponse<T = unknown>
  extends ApiResponse<SearchResult<T>[]> {
  facets?: Record<string, Record<string, number>>;
  query?: string;
  totalHits?: number;
  processingTimeMs?: number;
}
