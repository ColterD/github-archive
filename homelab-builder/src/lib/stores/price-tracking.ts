import { writable, derived, get } from "svelte/store";
import { browser } from "$app/environment";
import { websocketClient } from "./websocket.js";

// Types
interface PriceUpdate {
  itemId: string;
  price: number;
  source: string;
  timestamp: Date;
}

interface PriceAlert {
  itemId: string;
  itemName: string;
  currentPrice: number;
  targetPrice: number;
  alertType: "price-drop" | "price-increase" | "target-reached";
}

interface PriceHistory {
  id: string;
  price: number;
  source: string;
  confidence: string;
  recordedAt: Date;
}

interface PriceStats {
  currentPrice: number;
  averagePrice: number;
  lowestPrice: number;
  highestPrice: number;
  priceChange: number;
  priceChangePercent: number;
  dataPoints: number;
}

interface PriceTrackingState {
  priceUpdates: Map<string, PriceUpdate>;
  priceAlerts: PriceAlert[];
  priceHistory: Map<string, PriceHistory[]>;
  priceStats: Map<string, PriceStats>;
  trackedItems: Set<string>;
  loading: boolean;
  error: string | null;
}

// Initial state
const initialState: PriceTrackingState = {
  priceUpdates: new Map(),
  priceAlerts: [],
  priceHistory: new Map(),
  priceStats: new Map(),
  trackedItems: new Set(),
  loading: false,
  error: null,
};

// Create the main store
export const priceTrackingStore = writable<PriceTrackingState>(initialState);

// Derived stores for specific data
export const priceUpdates = derived(
  priceTrackingStore,
  ($store) => $store.priceUpdates,
);
export const priceAlerts = derived(
  priceTrackingStore,
  ($store) => $store.priceAlerts,
);
export const trackedItems = derived(
  priceTrackingStore,
  ($store) => $store.trackedItems,
);
export const priceTrackingLoading = derived(
  priceTrackingStore,
  ($store) => $store.loading,
);
export const priceTrackingError = derived(
  priceTrackingStore,
  ($store) => $store.error,
);

// Price tracking actions
export const priceTrackingActions = {
  // Enable price tracking for an item
  async enableTracking(itemId: string): Promise<void> {
    try {
      priceTrackingStore.update((state) => ({
        ...state,
        loading: true,
        error: null,
      }));

      const response = await fetch("/api/price-tracking", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          itemId,
          enabled: true,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to enable price tracking");
      }

      priceTrackingStore.update((state) => ({
        ...state,
        trackedItems: new Set([...state.trackedItems, itemId]),
        loading: false,
      }));
    } catch (error) {
      priceTrackingStore.update((state) => ({
        ...state,
        loading: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }));
      throw error;
    }
  },

  // Disable price tracking for an item
  async disableTracking(itemId: string): Promise<void> {
    try {
      priceTrackingStore.update((state) => ({
        ...state,
        loading: true,
        error: null,
      }));

      const response = await fetch("/api/price-tracking", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          itemId,
          enabled: false,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to disable price tracking");
      }

      priceTrackingStore.update((state) => {
        const newTrackedItems = new Set(state.trackedItems);
        newTrackedItems.delete(itemId);
        return {
          ...state,
          trackedItems: newTrackedItems,
          loading: false,
        };
      });
    } catch (error) {
      priceTrackingStore.update((state) => ({
        ...state,
        loading: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }));
      throw error;
    }
  },

  // Trigger immediate price update for an item
  async updatePrice(itemId: string): Promise<void> {
    try {
      priceTrackingStore.update((state) => ({
        ...state,
        loading: true,
        error: null,
      }));

      const response = await fetch("/api/price-tracking", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          itemId,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to update price");
      }

      priceTrackingStore.update((state) => ({
        ...state,
        loading: false,
      }));
    } catch (error) {
      priceTrackingStore.update((state) => ({
        ...state,
        loading: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }));
      throw error;
    }
  },

  // Get price history for an item
  async getPriceHistory(
    itemId: string,
    days: number = 30,
  ): Promise<PriceHistory[]> {
    try {
      priceTrackingStore.update((state) => ({
        ...state,
        loading: true,
        error: null,
      }));

      const response = await fetch(
        `/api/price-tracking/history/${itemId}?days=${days}`,
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to get price history");
      }

      const data = await response.json();
      const history = data.data.history;
      const stats = data.data.statistics;

      priceTrackingStore.update((state) => ({
        ...state,
        priceHistory: new Map(state.priceHistory.set(itemId, history)),
        priceStats: new Map(state.priceStats.set(itemId, stats)),
        loading: false,
      }));

      return history;
    } catch (error) {
      priceTrackingStore.update((state) => ({
        ...state,
        loading: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }));
      throw error;
    }
  },

  // Get price statistics for an item
  getPriceStats(itemId: string): PriceStats | null {
    const state = get(priceTrackingStore);
    return state.priceStats.get(itemId) || null;
  },

  // Clear error state
  clearError(): void {
    priceTrackingStore.update((state) => ({
      ...state,
      error: null,
    }));
  },

  // Handle WebSocket price update
  handlePriceUpdate(update: PriceUpdate): void {
    priceTrackingStore.update((state) => ({
      ...state,
      priceUpdates: new Map(state.priceUpdates.set(update.itemId, update)),
    }));
  },

  // Handle WebSocket price alert
  handlePriceAlert(alert: PriceAlert): void {
    priceTrackingStore.update((state) => ({
      ...state,
      priceAlerts: [...state.priceAlerts, alert],
    }));
  },

  // Dismiss price alert
  dismissAlert(index: number): void {
    priceTrackingStore.update((state) => ({
      ...state,
      priceAlerts: state.priceAlerts.filter((_, i) => i !== index),
    }));
  },

  // Clear all alerts
  clearAlerts(): void {
    priceTrackingStore.update((state) => ({
      ...state,
      priceAlerts: [],
    }));
  },
};

// WebSocket integration for real-time updates
if (browser) {
  websocketClient.connectionState.subscribe(($ws) => {
    if ($ws.connected) {
      // Subscribe to price tracking events
      websocketClient.messages.subscribe((messages) => {
        const latestMessage = messages[messages.length - 1];
        if (latestMessage) {
          switch (latestMessage.type) {
            case "price-update":
              priceTrackingActions.handlePriceUpdate({
                itemId: latestMessage.payload.itemId as string,
                price: latestMessage.payload.price as number,
                source: latestMessage.payload.source as string,
                timestamp: new Date(latestMessage.payload.timestamp as string),
              });
              break;

            case "price_alert":
              if (
                latestMessage.payload &&
                typeof latestMessage.payload === "object"
              ) {
                const payload = latestMessage.payload as Record<
                  string,
                  unknown
                >;
                // Validate that the payload has the required PriceAlert properties
                if (
                  payload.itemId &&
                  payload.itemName &&
                  payload.currentPrice !== undefined &&
                  payload.targetPrice !== undefined &&
                  payload.alertType
                ) {
                  // Only handle if all required fields are present
                  const priceAlert: PriceAlert = {
                    itemId: payload.itemId as string,
                    itemName: payload.itemName as string,
                    currentPrice: payload.currentPrice as number,
                    targetPrice: payload.targetPrice as number,
                    alertType: payload.alertType as
                      | "price-drop"
                      | "price-increase"
                      | "target-reached",
                  };
                  priceTrackingActions.handlePriceAlert(priceAlert);
                } else {
                  console.warn(
                    "Invalid price alert payload received:",
                    payload,
                  );
                }
              }
              break;
          }
        }
      });
    }
  });
}

// Export types for use in components
export type { PriceUpdate, PriceAlert, PriceHistory, PriceStats };
