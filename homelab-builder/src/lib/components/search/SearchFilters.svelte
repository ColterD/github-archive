<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { ChevronDown, ChevronUp } from 'lucide-svelte';
  import { Card } from '$lib/components/ui/card/index.js';
  import { Button } from '$lib/components/ui/button/index.js';
  import { Badge } from '$lib/components/ui/badge/index.js';
  import { Separator } from '$lib/components/ui/separator/index.js';
  import { Checkbox } from '$lib/components/ui/checkbox/index.js';
  import { Label } from '$lib/components/ui/label/index.js';
  import { Slider } from '$lib/components/ui/slider/index.js';
  import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '$lib/components/ui/select/index.js';
  import type { HardwareCategory, HardwareCondition } from '$lib/types/database';

  export let selectedCategory: HardwareCategory | undefined = undefined;
  export let selectedCondition: HardwareCondition | undefined = undefined;
  export let selectedManufacturer: string | undefined = undefined;
  export let priceRange: [number, number] = [0, 10000];
  export let categories: { value: string; label: string }[] = [];
  export let conditions: { value: string; label: string }[] = [];
  export let manufacturerOptions: { value: string; label: string }[] = [];
  export let facets: Record<string, Record<string, number>> = {};

  const dispatch = createEventDispatcher<{
    change: void;
  }>();

  // Collapsible sections state
  let expandedSections = {
    category: true,
    condition: true,
    manufacturer: true,
    price: true
  };

  function toggleSection(section: keyof typeof expandedSections) {
    expandedSections[section] = !expandedSections[section];
  }

  function handleCategoryChange(category: HardwareCategory | undefined) {
    selectedCategory = category;
    dispatch('change');
  }

  function handleConditionChange(condition: HardwareCondition | undefined) {
    selectedCondition = condition;
    dispatch('change');
  }

  function handleManufacturerChange(manufacturer: string | undefined) {
    selectedManufacturer = manufacturer;
    dispatch('change');
  }

  function handleManufacturerSelect(value: string) {
    selectedManufacturer = value === 'undefined' ? undefined : value;
    dispatch('change');
  }

  function handlePriceChange() {
    dispatch('change');
  }

  function formatPrice(price: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price);
  }

  // Get category options with counts from facets
  $: categoryOptions = categories.map(cat => ({
    ...cat,
    count: facets.category?.[cat.value] || 0
  }));

  // Get condition options with counts from facets
  $: conditionOptions = conditions.map(cond => ({
    ...cond,
    count: facets.condition?.[cond.value] || 0
  }));
</script>

<Card class="p-4 space-y-6">
  <div class="flex items-center justify-between">
    <h3 class="font-semibold text-lg">Filters</h3>
    <Button
      variant="ghost"
      size="sm"
      onclick={() => {
        selectedCategory = undefined;
        selectedCondition = undefined;
        selectedManufacturer = undefined;
        priceRange = [0, 10000];
        dispatch('change');
      }}
    >
      Clear All
    </Button>
  </div>

  <!-- Category Filter -->
  <div class="space-y-3">
    <button
      class="flex items-center justify-between w-full text-left"
      onclick={() => toggleSection('category')}
    >
      <div class="flex items-center space-x-2">
        <h4 class="font-medium">Category</h4>
        {#if selectedCategory}
          <Badge variant="secondary" class="text-xs">
            {categories.find(c => c.value === selectedCategory)?.label}
          </Badge>
        {/if}
      </div>
      {#if expandedSections.category}
        <ChevronUp class="h-4 w-4" />
      {:else}
        <ChevronDown class="h-4 w-4" />
      {/if}
    </button>

    {#if expandedSections.category}
      <div class="space-y-2 pl-4">
        <div class="flex items-center space-x-2">
          <Checkbox
            id="category-all"
            checked={!selectedCategory}
            onCheckedChange={() => handleCategoryChange(undefined)}
          />
          <Label for="category-all" class="text-sm">All Categories</Label>
        </div>
        {#each categoryOptions as category (category.value)}
          <div class="flex items-center space-x-2">
            <Checkbox
              id="category-{category.value}"
              checked={selectedCategory === category.value}
              onCheckedChange={() => handleCategoryChange(selectedCategory === category.value ? undefined : category.value as HardwareCategory)}
            />
            <Label for="category-{category.value}" class="text-sm flex-1">
              {category.label}
              {#if category.count > 0}
                <span class="text-muted-foreground">({category.count})</span>
              {/if}
            </Label>
          </div>
        {/each}
      </div>
    {/if}
  </div>

  <Separator />

  <!-- Condition Filter -->
  <div class="space-y-3">
    <button
      class="flex items-center justify-between w-full text-left"
      onclick={() => toggleSection('condition')}
    >
      <div class="flex items-center space-x-2">
        <h4 class="font-medium">Condition</h4>
        {#if selectedCondition}
          <Badge variant="secondary" class="text-xs">
            {conditions.find(c => c.value === selectedCondition)?.label}
          </Badge>
        {/if}
      </div>
      {#if expandedSections.condition}
        <ChevronUp class="h-4 w-4" />
      {:else}
        <ChevronDown class="h-4 w-4" />
      {/if}
    </button>

    {#if expandedSections.condition}
      <div class="space-y-2 pl-4">
        <div class="flex items-center space-x-2">
          <Checkbox
            id="condition-all"
            checked={!selectedCondition}
            onCheckedChange={() => handleConditionChange(undefined)}
          />
          <Label for="condition-all" class="text-sm">All Conditions</Label>
        </div>
        {#each conditionOptions as condition (condition.value)}
          <div class="flex items-center space-x-2">
            <Checkbox
              id="condition-{condition.value}"
              checked={selectedCondition === condition.value}
              onCheckedChange={() => handleConditionChange(selectedCondition === condition.value ? undefined : condition.value as HardwareCondition)}
            />
            <Label for="condition-{condition.value}" class="text-sm flex-1">
              {condition.label}
              {#if condition.count > 0}
                <span class="text-muted-foreground">({condition.count})</span>
              {/if}
            </Label>
          </div>
        {/each}
      </div>
    {/if}
  </div>

  <Separator />

  <!-- Manufacturer Filter -->
  <div class="space-y-3">
    <button
      class="flex items-center justify-between w-full text-left"
      onclick={() => toggleSection('manufacturer')}
    >
      <div class="flex items-center space-x-2">
        <h4 class="font-medium">Manufacturer</h4>
        {#if selectedManufacturer}
          <Badge variant="secondary" class="text-xs">
            {selectedManufacturer}
          </Badge>
        {/if}
      </div>
      {#if expandedSections.manufacturer}
        <ChevronUp class="h-4 w-4" />
      {:else}
        <ChevronDown class="h-4 w-4" />
      {/if}
    </button>

    {#if expandedSections.manufacturer}
      <div class="pl-4">
        <Select bind:value={selectedManufacturer} onValueChange={handleManufacturerChange}>
          <SelectTrigger>
            <SelectValue placeholder="Select manufacturer" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="undefined" handleSelect={handleManufacturerSelect}>All Manufacturers</SelectItem>
            {#each manufacturerOptions as manufacturer (manufacturer.value)}
              <SelectItem value={manufacturer.value} handleSelect={handleManufacturerSelect}>{manufacturer.label}</SelectItem>
            {/each}
          </SelectContent>
        </Select>
      </div>
    {/if}
  </div>

  <Separator />

  <!-- Price Range Filter -->
  <div class="space-y-3">
    <button
      class="flex items-center justify-between w-full text-left"
      onclick={() => toggleSection('price')}
    >
      <div class="flex items-center space-x-2">
        <h4 class="font-medium">Price Range</h4>
        {#if priceRange[0] > 0 || priceRange[1] < 10000}
          <Badge variant="secondary" class="text-xs">
            {formatPrice(priceRange[0])} - {formatPrice(priceRange[1])}
          </Badge>
        {/if}
      </div>
      {#if expandedSections.price}
        <ChevronUp class="h-4 w-4" />
      {:else}
        <ChevronDown class="h-4 w-4" />
      {/if}
    </button>

    {#if expandedSections.price}
      <div class="space-y-4 pl-4">
        <div class="space-y-2">
          <div class="flex items-center justify-between text-sm">
            <span>{formatPrice(priceRange[0])}</span>
            <span>{formatPrice(priceRange[1])}</span>
          </div>
          <Slider
            bind:value={priceRange}
            min={0}
            max={10000}
            step={100}
            class="w-full"
            onValueChange={handlePriceChange}
          />
        </div>

        <!-- Quick Price Filters -->
        <div class="grid grid-cols-2 gap-2">
          <Button
            variant="outline"
            size="sm"
            class="text-xs"
            onclick={() => {
              priceRange = [0, 500];
              handlePriceChange();
            }}
          >
            Under $500
          </Button>
          <Button
            variant="outline"
            size="sm"
            class="text-xs"
            onclick={() => {
              priceRange = [500, 1000];
              handlePriceChange();
            }}
          >
            $500 - $1K
          </Button>
          <Button
            variant="outline"
            size="sm"
            class="text-xs"
            onclick={() => {
              priceRange = [1000, 2500];
              handlePriceChange();
            }}
          >
            $1K - $2.5K
          </Button>
          <Button
            variant="outline"
            size="sm"
            class="text-xs"
            onclick={() => {
              priceRange = [2500, 10000];
              handlePriceChange();
            }}
          >
            $2.5K+
          </Button>
        </div>
      </div>
    {/if}
  </div>
</Card>