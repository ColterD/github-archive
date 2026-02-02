<!-- HARDWARE CATALOG - SIMPLIFIED VERSION -->
<!-- Modern hardware comparison interface with mock data support -->

<script lang="ts">
  import HardwareGrid from '$lib/components/hardware/HardwareGrid.svelte';
  import HardwareCard from '$lib/components/hardware/HardwareCard.svelte';
  import FilterSidebar from '$lib/components/hardware/FilterSidebar.svelte';
  import SearchBar from '$lib/components/hardware/SearchBar.svelte';
  import SortMenu from '$lib/components/hardware/SortMenu.svelte';
  import Pagination from '$lib/components/hardware/Pagination.svelte';
  import QuickViewModal from '$lib/components/hardware/QuickViewModal.svelte';
  import ComparisonTable from '$lib/components/hardware/ComparisonTable.svelte';
  import Button from '$lib/components/ui/button/button.svelte';
  import { search, sort, page, totalPages, filters, comparison } from '$lib/stores/hardware';
  import { onMount } from 'svelte';
  import { get } from 'svelte/store';

  interface HardwareItem {
    id: string;
    name: string;
    [key: string]: unknown;
  }

  let items: HardwareItem[] = [];
  let loading = false;
  let error = '';
  let showQuickView = false;
  let quickViewItem: HardwareItem | null = null;
  let showComparison = false;

  // Fetch hardware data from API
  async function fetchHardware() {
    loading = true;
    error = '';
    try {
      const params = new URLSearchParams({
        page: get(page).toString(),
        search: get(search),
        sort: get(sort),
        category: get(filters).category,
        priceMin: get(filters).price[0].toString(),
        priceMax: get(filters).price[1].toString(),
        condition: get(filters).condition
      });
      const res = await fetch(`/api/hardware?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch hardware');
      const data = await res.json();
      items = data.items || [];
      totalPages.set(data.totalPages || 1);
    } catch (e: unknown) {
      error = e instanceof Error ? e.message : 'Unknown error';
      items = [];
    } finally {
      loading = false;
    }
  }

  // Fetch on mount
  onMount(fetchHardware);
  // Reactive: refetch when search, sort, page, or filters change
  $: if ($search || $sort || $page || $filters) {
    fetchHardware();
  }

  function handleCardClick(item: HardwareItem) {
    quickViewItem = item;
    showQuickView = true;
  }

  function closeQuickView() {
    showQuickView = false;
    quickViewItem = null;
  }

  function closeComparison() {
    showComparison = false;
  }
</script>

<div class="flex flex-col md:flex-row gap-6">
  <div class="md:w-64 w-full">
    <FilterSidebar />
  </div>
  <div class="flex-1 flex flex-col gap-4">
    <div class="flex flex-col sm:flex-row gap-2 items-stretch sm:items-end">
      <div class="flex-1">
        <SearchBar bind:value={$search} />
      </div>
      <SortMenu bind:sort={$sort} />
    </div>
    {#if loading}
      <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {#each Array(8) as _, i (i)}
          <div class="animate-pulse bg-muted rounded-lg h-48"></div>
        {/each}
      </div>
    {:else if error}
      <div class="text-destructive text-center py-8">{error}</div>
    {:else if items.length === 0}
      <div class="text-muted-foreground text-center py-8">No hardware found. Try adjusting your search or filters.</div>
    {:else}
      <HardwareGrid {items}>
        <HardwareCard slot="card" let:item {item} on:click={() => handleCardClick(item)} />
      </HardwareGrid>
    {/if}
    <Pagination bind:page={$page} bind:totalPages={$totalPages} />
    {#if showQuickView}
      <QuickViewModal open={showQuickView} item={quickViewItem} on:close={closeQuickView} />
    {/if}
    {#if showComparison}
      <ComparisonTable items={get(comparison)} />
      <Button class="mt-2" variant="outline" onclick={closeComparison}>
        Close Comparison
      </Button>
    {/if}
  </div>
</div>