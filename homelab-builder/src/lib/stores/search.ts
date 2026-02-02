import { writable, derived } from "svelte/store";
import type { HardwareItem, Manufacturer } from "$lib/types/database";

// Search state interface
interface SearchState {
  query: string;
  category: string;
  manufacturer: string;
  condition: string;
  priceRange: [number, number];
  sortBy: string;
  sortOrder: "asc" | "desc";
  results: (HardwareItem & {
    manufacturer?: Manufacturer;
    averageRating?: number;
    reviewCount?: number;
  })[];
  isLoading: boolean;
  totalResults: number;
  currentPage: number;
  error: string | null;
}

// Initial search state
const initialSearchState: SearchState = {
  query: "",
  category: "all",
  manufacturer: "all",
  condition: "all",
  priceRange: [0, 10000],
  sortBy: "relevance",
  sortOrder: "desc",
  results: [],
  isLoading: false,
  totalResults: 0,
  currentPage: 1,
  error: null,
};

// Create search store
function createSearchStore() {
  const { subscribe, set, update } = writable<SearchState>(initialSearchState);

  return {
    subscribe,
    // Update search query
    setQuery: (query: string) =>
      update((state) => ({ ...state, query, currentPage: 1 })),

    // Update filters
    setFilters: (filters: Partial<SearchState>) =>
      update((state) => ({ ...state, ...filters, currentPage: 1 })),

    // Set search results
    setResults: (
      results: SearchState["results"],
      totalResults: number,
      currentPage: number = 1,
    ) =>
      update((state) => ({
        ...state,
        results,
        totalResults,
        currentPage,
        isLoading: false,
        error: null,
      })),

    // Set loading state
    setLoading: (isLoading: boolean) =>
      update((state) => ({ ...state, isLoading })),

    // Set error
    setError: (error: string) =>
      update((state) => ({ ...state, error, isLoading: false })),

    // Clear search
    clear: () => set(initialSearchState),

    // Load more results (pagination)
    loadMore: async (page: number) => {
      update((state) => ({ ...state, currentPage: page, isLoading: true }));
      // This would trigger a search with the new page
    },
  };
}

// Export the search store
export const searchStore = createSearchStore();

// Derived stores for easy component access
export const searchQuery = derived(searchStore, ($store) => $store.query);
export const searchResults = derived(searchStore, ($store) => $store.results);
export const searchLoading = derived(searchStore, ($store) => $store.isLoading);
export const searchError = derived(searchStore, ($store) => $store.error);
export const searchFilters = derived(searchStore, ($store) => ({
  category: $store.category,
  manufacturer: $store.manufacturer,
  condition: $store.condition,
  priceRange: $store.priceRange,
  sortBy: $store.sortBy,
  sortOrder: $store.sortOrder,
}));

// Search helper functions
export async function performSearch(
  searchParams: Partial<SearchState>,
): Promise<void> {
  searchStore.setLoading(true);

  try {
    const params = new URLSearchParams();

    if (searchParams.query) params.set("q", searchParams.query);
    if (searchParams.category && searchParams.category !== "all")
      params.set("category", searchParams.category);
    if (searchParams.manufacturer && searchParams.manufacturer !== "all")
      params.set("manufacturer", searchParams.manufacturer);
    if (searchParams.condition && searchParams.condition !== "all")
      params.set("condition", searchParams.condition);
    if (searchParams.priceRange) {
      params.set("minPrice", searchParams.priceRange[0].toString());
      params.set("maxPrice", searchParams.priceRange[1].toString());
    }
    if (searchParams.sortBy) params.set("sortBy", searchParams.sortBy);
    if (searchParams.sortOrder) params.set("sortOrder", searchParams.sortOrder);
    if (searchParams.currentPage)
      params.set("page", searchParams.currentPage.toString());

    const response = await fetch(`/api/search?${params.toString()}`);

    if (!response.ok) {
      throw new Error(`Search failed: ${response.statusText}`);
    }

    const data = await response.json();

    if (data.success) {
      searchStore.setResults(
        data.results,
        data.totalResults,
        searchParams.currentPage,
      );
    } else {
      throw new Error(data.error || "Search failed");
    }
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Search failed";
    searchStore.setError(errorMessage);
  }
}

// Search suggestions helper
export async function getSearchSuggestions(query: string): Promise<string[]> {
  if (!query.trim()) return [];

  try {
    const response = await fetch(
      `/api/search/suggestions?q=${encodeURIComponent(query)}`,
    );

    if (!response.ok) {
      throw new Error("Failed to fetch suggestions");
    }

    const data = await response.json();
    return data.suggestions || [];
  } catch (error) {
    console.error("Failed to fetch search suggestions:", error);
    return [];
  }
}
