// HOMELAB HARDWARE PLATFORM - ADMIN ANALYTICS STORE
import { writable, derived, get } from "svelte/store";
import { browser } from "$app/environment";
import { logger } from "$lib/client/logger";
import type {
  AdminDashboardMetrics,
  SearchAnalytics,
  UserAnalytics,
  PerformanceMetrics,
  AdminActivity,
  SystemAlert,
  RealTimeMetrics,
} from "$lib/types/admin";

// Dashboard metrics store
export const dashboardMetrics = writable<AdminDashboardMetrics | null>(null);
export const searchAnalytics = writable<SearchAnalytics | null>(null);
export const userAnalytics = writable<UserAnalytics | null>(null);
export const performanceMetrics = writable<PerformanceMetrics | null>(null);

// Real-time metrics
export const realTimeMetrics = writable<RealTimeMetrics | null>(null);

// Activity feeds
export const recentActivity = writable<AdminActivity[]>([]);
export const systemAlerts = writable<SystemAlert[]>([]);

// UI state
export const isLoadingDashboard = writable(false);
export const isLoadingAnalytics = writable(false);
export const selectedTimeframe = writable<"24h" | "7d" | "30d">("24h");
export const autoRefresh = writable(false);
export const lastUpdated = writable<string | null>(null);

// Connection state
export const isConnected = writable(false);
export const connectionError = writable<string | null>(null);

// WebSocket connection
let ws: WebSocket | null = null;
let reconnectTimer: NodeJS.Timeout | null = null;
let refreshInterval: NodeJS.Timeout | null = null;

// Browser-only admin store service
export const adminStore = browser
  ? {
      // Fetch dashboard metrics
      async fetchDashboardMetrics(refresh = false) {
        try {
          isLoadingDashboard.set(true);
          connectionError.set(null);

          const url = `/api/admin/analytics?type=dashboard&refresh=${refresh}`;
          const response = await fetch(url);

          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }

          const data = await response.json();
          dashboardMetrics.set(data);
          lastUpdated.set(new Date().toISOString());
        } catch (error) {
          logger.error(
            "Dashboard metrics error",
            error instanceof Error ? error : new Error(String(error)),
          );
          connectionError.set(
            error instanceof Error
              ? error.message
              : "Failed to fetch dashboard metrics",
          );
        } finally {
          isLoadingDashboard.set(false);
        }
      },

      // Fetch performance metrics
      async fetchPerformanceMetrics() {
        try {
          const response = await fetch("/api/admin/analytics?type=performance");

          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }

          const data = await response.json();
          performanceMetrics.set(data);
        } catch (error) {
          logger.error(
            "Performance metrics error",
            error instanceof Error ? error : new Error(String(error)),
          );
          connectionError.set(
            error instanceof Error
              ? error.message
              : "Failed to fetch performance metrics",
          );
        }
      },

      // Fetch search analytics
      async fetchSearchAnalytics(timeframe: "24h" | "7d" | "30d" = "24h") {
        try {
          isLoadingAnalytics.set(true);

          const response = await fetch(
            `/api/admin/analytics?type=search&timeframe=${timeframe}`,
          );

          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }

          const data = await response.json();
          searchAnalytics.set(data);
        } catch (error) {
          logger.error(
            "Search analytics error",
            error instanceof Error ? error : new Error(String(error)),
          );
          connectionError.set(
            error instanceof Error
              ? error.message
              : "Failed to fetch search analytics",
          );
        } finally {
          isLoadingAnalytics.set(false);
        }
      },

      // Fetch user analytics
      async fetchUserAnalytics(timeframe: "24h" | "7d" | "30d" = "24h") {
        try {
          const response = await fetch(
            `/api/admin/analytics?type=user&timeframe=${timeframe}`,
          );

          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }

          const data = await response.json();
          userAnalytics.set(data);
        } catch (error) {
          logger.error(
            "User analytics error",
            error instanceof Error ? error : new Error(String(error)),
          );
          connectionError.set(
            error instanceof Error
              ? error.message
              : "Failed to fetch user analytics",
          );
        }
      },

      // Fetch all metrics
      async fetchAllMetrics(refresh = false) {
        await Promise.all([
          this.fetchDashboardMetrics(refresh),
          this.fetchPerformanceMetrics(),
        ]);
      },

      // Start auto-refresh
      startAutoRefresh() {
        // Clear existing interval
        if (refreshInterval) {
          clearInterval(refreshInterval);
        }

        // Initial fetch
        this.fetchAllMetrics();

        // Set up interval for auto-refresh (5 minutes to avoid rate limiting)
        refreshInterval = setInterval(() => {
          if (get(autoRefresh)) {
            this.fetchAllMetrics();
          }
        }, 300000); // 5 minutes

        autoRefresh.set(true);
      },

      // Stop auto-refresh
      stopAutoRefresh() {
        if (refreshInterval) {
          clearInterval(refreshInterval);
          refreshInterval = null;
        }

        if (reconnectTimer) {
          clearTimeout(reconnectTimer);
          reconnectTimer = null;
        }

        autoRefresh.set(false);

        // Close WebSocket connection
        if (ws) {
          ws.close();
          ws = null;
        }
      },

      // Track admin action
      trackAdminAction(action: string, metadata: Record<string, unknown> = {}) {
        try {
          // Send tracking data to analytics endpoint
          fetch("/api/admin/analytics", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              action,
              metadata,
              timestamp: new Date().toISOString(),
            }),
          }).catch((error) => {
            logger.warn(
              "Failed to track admin action",
              error instanceof Error ? error : new Error(String(error)),
            );
          });
        } catch (error) {
          logger.warn(
            "Failed to track admin action",
            error instanceof Error ? error : new Error(String(error)),
          );
        }
      },

      // WebSocket connection for real-time updates
      connectWebSocket() {
        try {
          const protocol =
            window.location.protocol === "https:" ? "wss:" : "ws:";
          const wsUrl = `${protocol}//${window.location.host}/api/admin/websocket`;

          ws = new WebSocket(wsUrl);

          ws.onopen = () => {
            isConnected.set(true);
            connectionError.set(null);
          };

          ws.onmessage = (event) => {
            try {
              const data = JSON.parse(event.data);

              switch (data.type) {
                case "realtime_metrics":
                  realTimeMetrics.set(data.payload);
                  break;
                case "recent_activity":
                  recentActivity.set(data.payload);
                  break;
                case "system_alert":
                  systemAlerts.update((alerts) => [
                    data.payload,
                    ...alerts.slice(0, 9),
                  ]);
                  break;
                default:
                  logger.info("Unknown WebSocket message type", {
                    type: data.type,
                  });
              }
            } catch (error) {
              logger.error(
                "Failed to parse WebSocket message",
                error instanceof Error ? error : new Error(String(error)),
              );
            }
          };

          ws.onclose = () => {
            isConnected.set(false);

            // Attempt to reconnect after 5 seconds
            reconnectTimer = setTimeout(() => {
              if (get(autoRefresh)) {
                this.connectWebSocket();
              }
            }, 5000);
          };

          ws.onerror = () => {
            logger.error(
              "Admin WebSocket error",
              new Error("WebSocket connection failed"),
            );
            connectionError.set("WebSocket connection failed");
            isConnected.set(false);
          };
        } catch (error) {
          logger.error(
            "Failed to create WebSocket connection",
            error instanceof Error ? error : new Error(String(error)),
          );
          connectionError.set("Failed to create WebSocket connection");
        }
      },
    }
  : {
      // Server-side placeholder - all methods are no-ops
      fetchDashboardMetrics: () => Promise.resolve(),
      fetchPerformanceMetrics: () => Promise.resolve(),
      fetchSearchAnalytics: () => Promise.resolve(),
      fetchUserAnalytics: () => Promise.resolve(),
      fetchAllMetrics: () => Promise.resolve(),
      startAutoRefresh: () => {},
      stopAutoRefresh: () => {},
      trackAdminAction: () => {},
      connectWebSocket: () => {},
    };

// Cleanup on page unload
if (browser) {
  window.addEventListener("beforeunload", () => {
    adminStore.stopAutoRefresh();
  });
}

// Derived stores for computed values
export const systemHealth = derived(
  [dashboardMetrics, performanceMetrics],
  ([$dashboard, $performance]) => {
    if (!$dashboard || !$performance) return null;

    const responseTime = parseInt($dashboard.system.responseTime);
    const errorRate = parseFloat($dashboard.system.errorRate);

    let status: "healthy" | "warning" | "critical" = "healthy";

    if (responseTime > 200 || errorRate > 1) {
      status = "warning";
    }
    if (responseTime > 500 || errorRate > 5) {
      status = "critical";
    }

    return {
      status,
      responseTime,
      errorRate,
      uptime: $dashboard.system.uptime,
      lastCheck: new Date().toISOString(),
    };
  },
);

export const alertCount = derived(
  [systemAlerts],
  ([$alerts]) => $alerts.filter((alert) => !alert.resolved).length,
);

export const topSearchQueries = derived(
  [searchAnalytics],
  ([$search]) => $search?.topQueries.slice(0, 5) || [],
);

export const userGrowthRate = derived([userAnalytics], ([$users]) => {
  if (!$users) return 0;
  return $users.registrationTrend;
});

// Auto-refresh management
autoRefresh.subscribe((enabled) => {
  if (enabled) {
    adminStore.startAutoRefresh();
  } else {
    adminStore.stopAutoRefresh();
  }
});

// Initialize with mock data for development
recentActivity.set([
  {
    id: "activity_1",
    type: "user",
    message: "New user registered: john.doe@example.com",
    severity: "info",
    timestamp: new Date(Date.now() - 120000).toISOString(),
  },
  {
    id: "activity_2",
    type: "hardware",
    message: "Hardware item approved: Dell PowerEdge R730",
    severity: "success",
    timestamp: new Date(Date.now() - 300000).toISOString(),
  },
  {
    id: "activity_3",
    type: "system",
    message: "Database backup completed successfully",
    severity: "success",
    timestamp: new Date(Date.now() - 900000).toISOString(),
  },
]);
