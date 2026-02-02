// HOMELAB HARDWARE PLATFORM - ADMIN TYPES
export interface AdminDashboardMetrics {
  users: UserMetrics;
  hardware: HardwareMetrics;
  builds: BuildMetrics;
  system: SystemHealthMetrics;
  timestamp: string;
}

export interface UserMetrics {
  total: number;
  newToday: number;
  activeNow: number;
  growth: string;
}

export interface HardwareMetrics {
  total: number;
  pending: number;
  active: number;
  archived: number;
}

export interface BuildMetrics {
  total: number;
  totalBuilds: number;
  published: number;
  publishedBuilds: number;
  draft: number;
  draftBuilds: number;
  featured: number;
  buildsGrowth?: number;
}

export interface SystemHealthMetrics {
  uptime: string;
  responseTime: string;
  errorRate: string;
  dbQueries: string;
}

export interface SearchAnalytics {
  totalSearches: number;
  uniqueUsers: number;
  averageResultsPerQuery: number;
  searchSuccessRate: number;
  averageResponseTime: number;
  successRate: number;
  zeroResultsRate: number;
  popularCategories: Array<{ category: string; count: number }>;
  topQueries: Array<{ query: string; count: number }>;
  searchTrends: Array<{ date: string; searches: number }>;
  timeframe: "24h" | "7d" | "30d";
  lastUpdated: string;
}

export interface UserAnalytics {
  newRegistrations: number;
  registrationTrend: number;
  activeUsers: number;
  engagementRate: number;
  avgSessionDuration: string;
  topPages: Array<{ page: string; views: number }>;
  userRetention: {
    day1: number;
    day7: number;
    day30: number;
  };
  timeframe: "24h" | "7d" | "30d";
  lastUpdated: string;
}

export interface PerformanceMetrics {
  database: DatabaseMetrics;
  api: APIMetrics;
  search: SearchPerformanceMetrics;
  timestamp: string;
}

export interface DatabaseMetrics {
  connectionPool: {
    active: number;
    idle: number;
    waiting: number;
  };
  queryPerformance: {
    average: number;
    slowQueries: number;
  };
  storage: {
    used: string;
    available: string;
  };
}

export interface APIMetrics {
  requestsPerMinute: number;
  averageResponseTime: number;
  errorRate: number;
  topEndpoints: Array<{
    endpoint: string;
    requests: number;
    avgTime: number;
  }>;
}

export interface SearchPerformanceMetrics {
  indexSize: number;
  documentsCount: number;
  averageSearchTime: number;
  searchesPerMinute: number;
}

export interface RealTimeMetrics {
  activeUsers: number;
  requestsPerSecond: number;
  responseTime: number;
  errorCount: number;
  timestamp: string;
}

export interface AdminActivity {
  id: string;
  type: "user" | "hardware" | "system" | "error" | "security";
  message: string;
  severity: "info" | "success" | "warning" | "error";
  timestamp: string;
  metadata?: Record<string, unknown>;
}

export interface SystemAlert {
  id: string;
  title: string;
  message: string;
  severity: "low" | "medium" | "high" | "critical";
  category: "performance" | "security" | "system" | "business";
  timestamp: string;
  resolved: boolean;
  resolvedAt?: string;
  resolvedBy?: string;
}

export interface AdminConfig {
  alertThresholds: {
    responseTime: number;
    errorRate: number;
    activeUsers: number;
    diskUsage: number;
  };
  maintenanceMode: boolean;
  featureFlags: Record<string, boolean>;
  rateLimits: Record<string, number>;
}

export interface ChartDataPoint {
  label: string;
  value: number;
  timestamp?: string;
}

export interface TimeSeriesData {
  labels: string[];
  datasets: Array<{
    label: string;
    data: number[];
    borderColor?: string;
    backgroundColor?: string;
    fill?: boolean;
  }>;
}

export interface DashboardCard {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: {
    value: number;
    isPositive: boolean;
    period: string;
  };
  icon?: string;
  color?: "blue" | "green" | "yellow" | "red" | "purple";
}

export interface AdminNotification {
  id: string;
  title: string;
  message: string;
  type: "info" | "success" | "warning" | "error";
  timestamp: string;
  read: boolean;
  actionUrl?: string;
}

export interface UserReport {
  id: string;
  reportedUserId: string;
  reportedUser: {
    id: string;
    name: string;
    email: string;
  };
  reporterId: string;
  reporter: {
    id: string;
    name: string;
    email: string;
  };
  reason: string;
  description: string;
  status: "pending" | "reviewing" | "resolved" | "dismissed";
  createdAt: string;
  resolvedAt?: string;
  resolvedBy?: string;
  notes?: string;
}

export interface ContentReport {
  id: string;
  contentType: "hardware" | "build" | "review" | "comment";
  contentId: string;
  content: {
    title: string;
    excerpt: string;
    author: string;
  };
  reporterId: string;
  reporter: {
    id: string;
    name: string;
    email: string;
  };
  reason: string;
  description: string;
  status: "pending" | "reviewing" | "resolved" | "dismissed";
  createdAt: string;
  resolvedAt?: string;
  resolvedBy?: string;
  moderatorNotes?: string;
}

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "MODERATOR";
  permissions: string[];
  lastLogin: string;
  isActive: boolean;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  userId: string;
  user: {
    name: string;
    email: string;
  };
  action: string;
  resource: string;
  resourceId?: string;
  details: Record<string, unknown>;
  ipAddress: string;
  userAgent: string;
  timestamp: string;
}

export type MetricTimeframe = "1h" | "24h" | "7d" | "30d" | "90d";
export type AlertSeverity = "low" | "medium" | "high" | "critical";
export type AdminRole = "ADMIN" | "MODERATOR";
export type ReportStatus = "pending" | "reviewing" | "resolved" | "dismissed";
