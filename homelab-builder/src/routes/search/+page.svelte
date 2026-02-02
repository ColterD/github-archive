<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { Button } from '$lib/components/ui/button';
  import { Input } from '$lib/components/ui/input';
  import { Card } from '$lib/components/ui/card';
  import { Badge } from '$lib/components/ui/badge';
  import { Skeleton } from '$lib/components/ui/skeleton';
  import { searchResults, searchLoading, searchError, performSearch, searchStore } from '$lib/stores/search';
  import { Search, Filter, Grid, List, X } from 'lucide-svelte';
  import type { HardwareCategory, HardwareCondition } from '$lib/types/database';
  
  let localSearchQuery = '';
  let showFilters = false;
  let viewMode: 'grid' | 'list' = 'grid';
  
  // Filter states
  let selectedCategory: HardwareCategory | undefined = undefined;
  let selectedCondition: HardwareCondition | undefined = undefined;
  let selectedManufacturer = '';
  let priceMin = 0;
  let priceMax = 10000;
  let sortBy = 'relevance';
  
  // Get initial search query from URL
  onMount(() => {
    const urlParams = new URLSearchParams($page.url.search);
    localSearchQuery = urlParams.get('q') || '';
    
    if (localSearchQuery) {
      handleSearch();
    }
  });
  
  function handleSearch() {
    if (!localSearchQuery.trim()) return;
    
    performSearch({
      query: localSearchQuery,
      category: selectedCategory || 'all',
      condition: selectedCondition || 'all',
      manufacturer: selectedManufacturer || 'all',
      priceRange: [priceMin, priceMax],
      sortBy: sortBy,
      currentPage: 1
    });
  }
  
  function clearFilters() {
    selectedCategory = undefined;
    selectedCondition = undefined;
    selectedManufacturer = '';
    priceMin = 0;
    priceMax = 10000;
    sortBy = 'relevance';
    handleSearch();
  }
  
  function handleKeyPress(event: KeyboardEvent) {
    if (event.key === 'Enter') {
      handleSearch();
    }
  }
  
  $: activeFiltersCount = [
    selectedCategory,
    selectedCondition, 
    selectedManufacturer,
    priceMin > 0,
    priceMax < 10000
  ].filter(Boolean).length;
</script>

<svelte:head>
  <title>Search Hardware - Homelab Builder</title>
  <meta name="description" content="Search for used and refurbished enterprise hardware for your homelab." />
</svelte:head>

<div class="container mx-auto px-4 py-8">
  <!-- Search Header -->
  <div class="mb-8">
    <h1 class="text-3xl font-bold mb-2">Search Hardware</h1>
    <p class="text-muted-foreground">Find the perfect hardware for your homelab</p>
  </div>
  
  <!-- Search Bar -->
  <div class="mb-6">
    <div class="relative">
      <Search class="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <Input
        bind:value={localSearchQuery}
        placeholder="Search for servers, networking equipment, storage..."
        class="pl-10 pr-4 py-3 text-lg"
        onkeypress={handleKeyPress}
      />
      <Button
        onclick={handleSearch}
        class="absolute right-2 top-1/2 transform -translate-y-1/2"
        size="sm"
      >
        Search
      </Button>
    </div>
  </div>
  
  <!-- Filters and View Controls -->
  <div class="flex flex-col sm:flex-row gap-4 mb-6">
    <!-- Filter Toggle -->
    <Button
      variant="outline"
      onclick={() => showFilters = !showFilters}
      class="flex items-center gap-2"
    >
      <Filter class="h-4 w-4" />
      Filters
      {#if activeFiltersCount > 0}
        <Badge variant="secondary" class="ml-1">
          {activeFiltersCount}
        </Badge>
      {/if}
    </Button>
    
    <!-- Sort -->
    <select
      bind:value={sortBy}
      onchange={handleSearch}
      class="px-3 py-2 border rounded-md bg-background"
    >
      <option value="relevance">Most Relevant</option>
      <option value="price-asc">Price: Low to High</option>
      <option value="price-desc">Price: High to Low</option>
      <option value="newest">Newest First</option>
      <option value="popular">Most Popular</option>
    </select>
    
    <!-- View Mode -->
    <div class="flex gap-1 ml-auto">
      <Button
        variant={viewMode === 'grid' ? 'default' : 'outline'}
        size="sm"
        onclick={() => viewMode = 'grid'}
      >
        <Grid class="h-4 w-4" />
      </Button>
      <Button
        variant={viewMode === 'list' ? 'default' : 'outline'}
        size="sm"
        onclick={() => viewMode = 'list'}
      >
        <List class="h-4 w-4" />
      </Button>
    </div>
  </div>
  
  <!-- Filters Panel -->
  {#if showFilters}
    <Card class="p-4 mb-6">
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <!-- Category Filter -->
        <div>
          <label for="category-select" class="block text-sm font-medium mb-2">Category</label>
          <select
            id="category-select"
            bind:value={selectedCategory}
            onchange={handleSearch}
            class="w-full px-3 py-2 border rounded-md bg-background"
          >
            <option value={undefined}>All Categories</option>
            <option value="SERVER">Servers</option>
            <option value="NETWORKING">Networking</option>
            <option value="STORAGE">Storage</option>
            <option value="COMPUTE">Compute</option>
            <option value="MEMORY">Memory</option>
            <option value="OTHER">Other</option>
          </select>
        </div>
        
        <!-- Condition Filter -->
        <div>
          <label for="condition-select" class="block text-sm font-medium mb-2">Condition</label>
          <select
            id="condition-select"
            bind:value={selectedCondition}
            onchange={handleSearch}
            class="w-full px-3 py-2 border rounded-md bg-background"
          >
            <option value={undefined}>All Conditions</option>
            <option value="NEW">New</option>
            <option value="REFURBISHED">Refurbished</option>
            <option value="USED">Used</option>
            <option value="FOR_PARTS">For Parts</option>
          </select>
        </div>
        
        <!-- Manufacturer Filter -->
        <div>
          <label for="manufacturer-input" class="block text-sm font-medium mb-2">Manufacturer</label>
          <Input
            id="manufacturer-input"
            bind:value={selectedManufacturer}
            placeholder="e.g., Dell, HP, Cisco"
            onblur={handleSearch}
          />
        </div>
        
        <!-- Price Range -->
        <div>
          <label for="price-min" class="block text-sm font-medium mb-2">Price Range</label>
          <div class="flex gap-2">
            <Input
              id="price-min"
              type="number"
              bind:value={priceMin}
              placeholder="Min"
              min="0"
              class="w-20"
              onblur={handleSearch}
              aria-label="Minimum price"
            />
            <span class="self-center">-</span>
            <Input
              id="price-max"
              type="number"
              bind:value={priceMax}
              placeholder="Max"
              min="0"
              class="w-20"
              onblur={handleSearch}
              aria-label="Maximum price"
            />
          </div>
        </div>
      </div>
      
      <!-- Clear Filters -->
      {#if activeFiltersCount > 0}
        <div class="mt-4 pt-4 border-t">
          <Button variant="outline" size="sm" onclick={clearFilters}>
            <X class="h-4 w-4 mr-2" />
            Clear Filters
          </Button>
        </div>
      {/if}
    </Card>
  {/if}
  
  <!-- Search Results -->
  <div class="space-y-6">
    {#if $searchLoading}
      <!-- Loading Skeletons -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {#each Array.from({length: 6}, (_, i) => i) as i (i)}
          <Card class="p-4">
            <Skeleton class="h-48 w-full mb-4" />
            <Skeleton class="h-4 w-3/4 mb-2" />
            <Skeleton class="h-4 w-1/2 mb-2" />
            <Skeleton class="h-4 w-1/4" />
          </Card>
        {/each}
      </div>
    {:else if $searchError}
      <!-- Error State -->
      <Card class="p-8 text-center">
        <h3 class="text-lg font-semibold mb-2">Search Error</h3>
        <p class="text-muted-foreground mb-4">{$searchError}</p>
        <Button onclick={handleSearch}>
          Try Again
        </Button>
      </Card>
    {:else if $searchResults?.length === 0}
      <!-- No Results -->
      <Card class="p-8 text-center">
        <h3 class="text-lg font-semibold mb-2">No Results Found</h3>
        <p class="text-muted-foreground mb-4">
          Try adjusting your search terms or filters
        </p>
        <Button variant="outline" onclick={clearFilters}>
          Clear Filters
        </Button>
      </Card>
    {:else if $searchResults?.length > 0}
      <!-- Results Header -->
      <div class="flex justify-between items-center">
        <p class="text-sm text-muted-foreground">
          Showing {$searchResults.length} of {$searchStore.totalResults} results
        </p>
      </div>
      
      <!-- Results Grid/List -->
      <div class="grid {viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'} gap-6">
        {#each $searchResults as item (item.id || item.slug)}
          <Card class="overflow-hidden hover:shadow-lg transition-shadow">
            <div class="aspect-video bg-muted relative">
              {#if item.images}
                <img 
                  src={item.images} 
                  alt={item.name}
                  class="w-full h-full object-cover"
                />
              {:else}
                <div class="w-full h-full flex items-center justify-center text-muted-foreground">
                  No Image
                </div>
              {/if}
              <Badge class="absolute top-2 right-2" variant="secondary">
                {item.condition}
              </Badge>
            </div>
            
            <div class="p-4">
              <h3 class="font-semibold mb-2 line-clamp-2">
                <a href="/hardware/{item.slug}" class="hover:underline">
                  {item.name}
                </a>
              </h3>
              
              <p class="text-sm text-muted-foreground mb-2">{item.manufacturer}</p>
              
              {#if item.description}
                <p class="text-sm text-muted-foreground mb-3 line-clamp-2">
                  {item.description}
                </p>
              {/if}
              
              <div class="flex justify-between items-center">
                <div class="text-lg font-bold">
                  ${item.currentPrice?.toLocaleString() || 'N/A'}
                </div>
                
                <div class="flex items-center gap-2">
                  {#if item.averageRating}
                    <div class="flex items-center text-sm">
                      <span class="text-yellow-500">★</span>
                      <span>{item.averageRating.toFixed(1)}</span>
                    </div>
                  {/if}
                  
                  <Badge variant="outline" class="text-xs">
                    {item.category}
                  </Badge>
                </div>
              </div>
            </div>
          </Card>
        {/each}
      </div>
      
      <!-- Pagination -->
      {#if Math.ceil($searchStore.totalResults / 20) > 1}
        <div class="flex justify-center mt-8">
          <div class="flex gap-2">
            {#if $searchStore.currentPage > 1}
              <Button variant="outline" onclick={() => {
                performSearch({
                  query: localSearchQuery,
                  category: selectedCategory || 'all',
                  condition: selectedCondition || 'all',
                  manufacturer: selectedManufacturer || 'all',
                  priceRange: [priceMin, priceMax],
                  sortBy: sortBy,
                  currentPage: $searchStore.currentPage - 1
                });
              }}>
                Previous
              </Button>
            {/if}
            
            <span class="flex items-center px-4 py-2 text-sm">
              Page {$searchStore.currentPage} of {Math.ceil($searchStore.totalResults / 20)}
            </span>
            
            {#if $searchStore.currentPage < Math.ceil($searchStore.totalResults / 20)}
              <Button variant="outline" onclick={() => {
                performSearch({
                  query: localSearchQuery,
                  category: selectedCategory || 'all',
                  condition: selectedCondition || 'all',
                  manufacturer: selectedManufacturer || 'all',
                  priceRange: [priceMin, priceMax],
                  sortBy: sortBy,
                  currentPage: $searchStore.currentPage + 1
                });
              }}>
                Next
              </Button>
            {/if}
          </div>
        </div>
      {/if}
    {/if}
  </div>
</div>

<style>
  .line-clamp-2 {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    line-clamp: 2;
    overflow: hidden;
  }
</style>