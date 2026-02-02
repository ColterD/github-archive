import { writable } from "svelte/store";
import type { HardwareItem } from "$lib/types/database";

export interface ComparisonItem extends HardwareItem {
  manufacturer?: { name: string };
  priceHistory?: Array<{ price: number; timestamp: Date }>;
  reviews?: Array<{ rating: number }>;
}

interface ComparisonState {
  selectedItems: ComparisonItem[];
  maxItems: number;
  error: string | null;
}

const initialState: ComparisonState = {
  selectedItems: [],
  maxItems: 4,
  error: null,
};

function createComparisonStore() {
  const { subscribe, update } = writable<ComparisonState>(initialState);

  // Save items to localStorage
  const saveItems = () => {
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("comparison-items", JSON.stringify([]));
      } catch {
        // Storage failed - ignore silently
      }
    }
  };

  // Add item to comparison
  const addItem = (item: ComparisonItem) => {
    update((state) => {
      if (state.selectedItems.length >= state.maxItems) {
        return {
          ...state,
          error: `Maximum ${state.maxItems} items can be compared`,
        };
      }

      const existingIndex = state.selectedItems.findIndex(
        (i) => i.id === item.id,
      );
      if (existingIndex !== -1) {
        return {
          ...state,
          error: "Item is already in comparison",
        };
      }

      const newItems = [...state.selectedItems, item];
      saveItems();

      return {
        ...state,
        selectedItems: newItems,
        error: null,
      };
    });
  };

  // Remove item from comparison
  const removeItem = (itemId: string) => {
    update((state) => {
      const newItems = state.selectedItems.filter((item) => item.id !== itemId);
      saveItems();
      return {
        ...state,
        selectedItems: newItems,
        error: null,
      };
    });
  };

  // Clear all items
  const clearItems = () => {
    update(() => {
      try {
        if (typeof window !== "undefined") {
          localStorage.removeItem("comparison-items");
        }
      } catch {
        // Storage failed - ignore silently
      }
      return initialState;
    });
  };

  // Clear error
  const clearError = () => {
    update((state) => ({
      ...state,
      error: null,
    }));
  };

  return {
    subscribe,
    addItem,
    removeItem,
    clearItems,
    clearError,
  };
}

export const comparisonStore = createComparisonStore();
