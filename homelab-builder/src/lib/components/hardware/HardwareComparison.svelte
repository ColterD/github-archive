<script lang="ts">
  import { Card, CardContent, CardHeader, CardTitle } from "$lib/components/ui/card";
  import { Button } from "$lib/components/ui/button";
  import { Badge } from "$lib/components/ui/badge";
  import { X, Star, ExternalLink } from "lucide-svelte";
  import type { HardwareItem } from "$lib/types/database";

  export let items: (HardwareItem & {
    manufacturer?: { name: string };
    reviews?: Array<{ rating: number }>;
    priceHistory?: Array<{ price: number; timestamp: Date }>;
  })[] = [];

  export let onRemoveItem: (itemId: string) => void = () => {};
  export let onClearAll: () => void = () => {};

  type ItemWithExtras = HardwareItem & {
    manufacturer?: { name: string };
    reviews?: Array<{ rating: number }>;
    priceHistory?: Array<{ price: number; timestamp: Date }>;
  };

  // Calculate average rating for each item
  function getAverageRating(item: ItemWithExtras) {
    if (!item.reviews || item.reviews.length === 0) return 0;
    const sum = item.reviews.reduce((acc: number, review) => acc + review.rating, 0);
    return sum / item.reviews.length;
  }

  // Get price trend for an item
  function getPriceTrend(item: ItemWithExtras) {
    if (!item.priceHistory || item.priceHistory.length < 2) return "stable";
    const recent = item.priceHistory.slice(-2);
    const current = recent[1].price;
    const previous = recent[0].price;
    
    if (current > previous * 1.05) return "up";
    if (current < previous * 0.95) return "down";
    return "stable";
  }

  // Format specifications for display
  function formatSpecs(specs: string | Record<string, unknown> | null | undefined) {
    if (!specs) return [];
    
    let parsedSpecs: Record<string, unknown>;
    if (typeof specs === 'string') {
      try {
        parsedSpecs = JSON.parse(specs);
      } catch {
        return [];
      }
    } else {
      parsedSpecs = specs;
    }
    
    return Object.entries(parsedSpecs).map(([key, value]) => ({
      label: key.replace(/([A-Z])/g, " $1").replace(/^./, str => str.toUpperCase()),
      value: String(value)
    }));
  }

  // Get performance score (simplified calculation)
  function getPerformanceScore(item: ItemWithExtras) {
    let specs: Record<string, unknown> = {};
    
    if (item.specifications) {
      if (typeof item.specifications === 'string') {
        try {
          specs = JSON.parse(item.specifications);
        } catch {
          specs = {};
        }
      } else {
        specs = item.specifications;
      }
    }
    
    let score = 0;
    
    // Basic scoring based on common specs
    if ('cpuCores' in specs && specs.cpuCores) score += parseInt(String(specs.cpuCores)) * 10;
    if ('ramSize' in specs && specs.ramSize) score += parseInt(String(specs.ramSize)) / 4;
    if ('storageSize' in specs && specs.storageSize) score += parseInt(String(specs.storageSize)) / 100;
    
    return Math.min(Math.round(score), 100);
  }

  // Check if item is best value
  function isBestValue(item: ItemWithExtras, allItems: ItemWithExtras[]) {
    const performancePerDollar = getPerformanceScore(item) / (item.currentPrice || 1);
    return allItems.every(otherItem => 
      otherItem.id === item.id || 
      performancePerDollar >= (getPerformanceScore(otherItem) / (otherItem.currentPrice || 1))
    );
  }

  // Get comparison insights
  function getComparisonInsights() {
    if (items.length < 2) return [];
    
    const insights = [];
    const cheapest = items.reduce((min, item) => 
      (item.currentPrice || 0) < (min.currentPrice || 0) ? item : min
    );
    const mostExpensive = items.reduce((max, item) => 
      (item.currentPrice || 0) > (max.currentPrice || 0) ? item : max
    );
    
    insights.push(`Price range: $${cheapest.currentPrice} - $${mostExpensive.currentPrice}`);
    
    const bestValueItem = items.find(item => isBestValue(item, items));
    if (bestValueItem) {
      insights.push(`Best value: ${bestValueItem.name}`);
    }
    
    return insights;
  }

  $: comparisonInsights = items ? getComparisonInsights() : [];
</script>

<div class="space-y-6">
  <!-- Header -->
  <div class="flex items-center justify-between">
    <h2 class="text-2xl font-bold">Hardware Comparison ({items.length})</h2>
    {#if items.length > 0}
      <Button variant="outline" size="sm" onclick={onClearAll}>
        <X class="w-4 h-4 mr-2" />
        Clear All
      </Button>
    {/if}
  </div>

  {#if items.length === 0}
    <Card>
      <CardContent class="py-12 text-center">
        <p class="text-muted-foreground">No items to compare yet.</p>
        <p class="text-sm text-muted-foreground mt-2">
          Add hardware items to start comparing features, prices, and specifications.
        </p>
      </CardContent>
    </Card>
  {:else}
    <!-- Comparison Table -->
    <div class="overflow-x-auto">
      <div class="min-w-full">
        <!-- Items Row -->
        <div class="grid gap-4" style="grid-template-columns: repeat({items.length}, minmax(300px, 1fr));">
          {#each items as item (item.id)}
            <Card class="relative">
              <CardHeader class="pb-2">
                <div class="flex items-start justify-between">
                  <div class="flex-1 min-w-0">
                    <CardTitle class="text-lg leading-tight">{item.name}</CardTitle>
                    <p class="text-sm text-muted-foreground mt-1">
                      {item.manufacturer?.name || "Unknown Manufacturer"}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onclick={() => onRemoveItem(item.id)}
                    class="shrink-0 -mt-2 -mr-2"
                  >
                    <X class="w-4 h-4" />
                  </Button>
                </div>
                
                <!-- Price and Value Indicators -->
                <div class="flex items-center gap-2 mt-3">
                  <div class="text-2xl font-bold text-primary">
                    ${item.currentPrice || 0}
                  </div>
                  {#if isBestValue(item, items)}
                    <Badge variant="secondary">Best Value</Badge>
                  {/if}
                </div>
                
                <!-- Rating -->
                <div class="flex items-center gap-2 mt-2">
                  {#if getAverageRating(item) > 0}
                    <div class="flex items-center">
                      <Star class="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      <span class="text-sm ml-1">{getAverageRating(item).toFixed(1)}</span>
                      <span class="text-xs text-muted-foreground ml-1">
                        ({item.reviews?.length || 0} reviews)
                      </span>
                    </div>
                  {:else}
                    <span class="text-sm text-muted-foreground">No reviews</span>
                  {/if}
                </div>
              </CardHeader>
              
              <CardContent class="space-y-4">
                <!-- Key Specifications -->
                <div>
                  <h4 class="font-medium mb-2">Specifications</h4>
                  <div class="space-y-1">
                    {#each formatSpecs(item.specifications).slice(0, 6) as spec (spec.label)}
                      <div class="flex justify-between text-sm">
                        <span class="text-muted-foreground">{spec.label}:</span>
                        <span class="font-medium">{spec.value}</span>
                      </div>
                    {/each}
                  </div>
                </div>

                <!-- Performance Score -->
                <div>
                  <h4 class="font-medium mb-2">Performance Score</h4>
                  <div class="flex items-center gap-2">
                    <div class="flex-1 bg-secondary rounded-full h-2">
                      <div 
                        class="bg-primary h-2 rounded-full transition-all"
                        style="width: {getPerformanceScore(item)}%"
                      ></div>
                    </div>
                    <span class="text-sm font-medium">{getPerformanceScore(item)}/100</span>
                  </div>
                </div>

                <!-- Price Trend -->
                <div>
                  <h4 class="font-medium mb-2">Price Trend</h4>
                  <div class="flex items-center gap-2">
                    {#if getPriceTrend(item) === "up"}
                      <Badge variant="destructive">↗ Rising</Badge>
                    {:else if getPriceTrend(item) === "down"}
                      <Badge variant="default">↘ Falling</Badge>
                    {:else}
                      <Badge variant="secondary">→ Stable</Badge>
                    {/if}
                  </div>
                </div>

                <!-- Condition and Category -->
                <div class="flex flex-wrap gap-2">
                  <Badge variant="outline">{item.condition}</Badge>
                  <Badge variant="outline">{item.category}</Badge>
                </div>

                <!-- View Details Link -->
                <Button variant="outline" size="sm" class="w-full">
                  <ExternalLink class="w-4 h-4 mr-2" />
                  View Details
                </Button>
              </CardContent>
            </Card>
          {/each}
        </div>
      </div>
    </div>

    <!-- Comparison Insights -->
    {#if comparisonInsights.length > 0}
      <Card>
        <CardHeader>
          <CardTitle>Comparison Insights</CardTitle>
        </CardHeader>
        <CardContent>
          <div class="grid gap-2">
            {#each comparisonInsights as insight (insight)}
              <div class="flex items-center gap-2 text-sm">
                <div class="w-2 h-2 bg-primary rounded-full"></div>
                <span>{insight}</span>
              </div>
            {/each}
          </div>
        </CardContent>
      </Card>
    {/if}

    <!-- Detailed Comparison Table -->
    <Card>
      <CardHeader>
        <CardTitle>Detailed Specifications</CardTitle>
      </CardHeader>
      <CardContent>
        <div class="overflow-x-auto">
          <table class="w-full border-collapse">
            <thead>
              <tr class="border-b">
                <th class="text-left py-2 font-medium">Specification</th>
                {#each items as item (item.id)}
                  <th class="text-left py-2 px-4 font-medium truncate max-w-40">
                    {item.name}
                  </th>
                {/each}
              </tr>
            </thead>
            <tbody>
              <!-- Generate rows for all unique specifications -->
              {#each Array.from(new Set(items.flatMap(item => formatSpecs(item.specifications).map(spec => spec.label)))) as specLabel (specLabel)}
                <tr class="border-b border-border/50">
                  <td class="py-3 font-medium text-sm">{specLabel}</td>
                  {#each items as item (item.id)}
                    <td class="py-3 px-4 text-sm">
                      {formatSpecs(item.specifications).find(spec => spec.label === specLabel)?.value || "-"}
                    </td>
                  {/each}
                </tr>
              {/each}
              
              <!-- Price Row -->
              <tr class="border-b border-border bg-muted/50">
                <td class="py-3 font-semibold">Price</td>
                {#each items as item (item.id)}
                  <td class="py-3 px-4 font-semibold text-primary">
                    ${item.currentPrice || 0}
                  </td>
                {/each}
              </tr>
              
              <!-- Rating Row -->
              <tr class="border-b border-border">
                <td class="py-3 font-medium">Rating</td>
                {#each items as item (item.id)}
                  <td class="py-3 px-4">
                    {#if getAverageRating(item) > 0}
                      <div class="flex items-center gap-1">
                        <Star class="w-3 h-3 fill-yellow-400 text-yellow-400" />
                        <span class="text-sm">{getAverageRating(item).toFixed(1)}</span>
                      </div>
                    {:else}
                      <span class="text-muted-foreground text-sm">No ratings</span>
                    {/if}
                  </td>
                {/each}
              </tr>
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  {/if}
</div>