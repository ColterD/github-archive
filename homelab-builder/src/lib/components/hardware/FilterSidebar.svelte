<script lang="ts">
  import { filters } from '$lib/stores/hardware';
  import { get } from 'svelte/store';

  // Local bindings for filter controls
  let category = get(filters).category;
  let price = get(filters).price;
  let condition = get(filters).condition;

  // Update store on change
  $: filters.set({ category, price, condition });
</script>

<aside class="w-full sm:w-64 bg-background border-r border-border p-4 flex flex-col gap-4">
  <h3 class="font-semibold text-base mb-2">Filters</h3>
  <!-- Category filter -->
  <div>
    <label for="category-select" class="block text-sm font-medium mb-1">Category</label>
    <select id="category-select" class="w-full rounded border px-2 py-1" bind:value={category}>
      <option>All</option>
      <!-- More options later -->
    </select>
  </div>
  <!-- Price filter -->
  <div>
    <label for="price-range" class="block text-sm font-medium mb-1">Price Range</label>
    <input id="price-range" type="range" min="0" max="10000" class="w-full" bind:value={price[1]} />
    <div class="text-xs mt-1">${price[0]} - ${price[1]}</div>
  </div>
  <!-- Condition filter -->
  <div>
    <label for="condition-select" class="block text-sm font-medium mb-1">Condition</label>
    <select id="condition-select" class="w-full rounded border px-2 py-1" bind:value={condition}>
      <option>All</option>
      <option>New</option>
      <option>Used</option>
      <option>Refurbished</option>
    </select>
  </div>
</aside> 