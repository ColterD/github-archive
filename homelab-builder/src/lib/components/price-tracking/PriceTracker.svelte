<!-- HOMELAB HARDWARE PLATFORM - PRICE TRACKER COMPONENT -->
<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import { Button } from "$lib/components/ui/button";
  import { Card, CardContent, CardHeader, CardTitle } from "$lib/components/ui/card";
  import { Badge } from "$lib/components/ui/badge";
  import { TrendingUp, TrendingDown, DollarSign, Calendar, AlertCircle } from "lucide-svelte";
  import { formatDate } from '$lib/utils.js';

  export let hardwareId: string;
  export let currentPrice: number;
  export let priceHistory: Array<{ price: number; date: string; source: string }> = [];
  export let showChart: boolean = true;
  export let compactMode: boolean = false;

  // Price analysis
  $: priceChange = priceHistory.length > 0 ? calculatePriceChange() : { amount: 0, percentage: 0, trend: 'stable' };
  $: lowestPrice = priceHistory.length > 0 ? Math.min(...priceHistory.map(p => p.price)) : currentPrice;
  $: highestPrice = priceHistory.length > 0 ? Math.max(...priceHistory.map(p => p.price)) : currentPrice;
  $: averagePrice = priceHistory.length > 0 ? priceHistory.reduce((sum, p) => sum + p.price, 0) / priceHistory.length : currentPrice;
  $: isGoodDeal = currentPrice <= lowestPrice * 1.1; // Within 10% of lowest price

  onMount(() => {
    // TEMPORARILY DISABLED FOR BUNDLE TESTING
    // if (showChart && priceHistory.length > 0) {
    //   renderChart();
    // }
  });

  onDestroy(() => {
    // TEMPORARILY DISABLED FOR BUNDLE TESTING
    // if (chartInstance) {
    //   chartInstance.destroy();
    // }
  });



  function calculatePriceChange() {
    if (priceHistory.length < 2) return { amount: 0, percentage: 0, trend: 'stable' };
    
    const sortedHistory = [...priceHistory].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const previousPrice = sortedHistory[sortedHistory.length - 2]?.price || currentPrice;
    const amount = currentPrice - previousPrice;
    const percentage = (amount / previousPrice) * 100;
    
    return {
      amount,
      percentage,
      trend: amount > 0 ? 'up' : amount < 0 ? 'down' : 'stable'
    };
  }

  function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  }

  async function trackPrice() {
    try {
      const response = await fetch(`/api/price-tracking`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ hardwareId })
      });

      if (response.ok) {
        // Refresh data after tracking
        window.location.reload();
      }
    } catch {
      // Failed to track price
    }
  }
</script>

{#if compactMode}
  <!-- Compact Mode - Price Summary Only -->
  <div class="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
    <div class="flex items-center gap-2">
      <DollarSign class="w-4 h-4 text-green-600" />
      <span class="font-medium">{formatCurrency(currentPrice)}</span>
      {#if priceChange.trend !== 'stable'}
        <Badge variant={priceChange.trend === 'down' ? 'default' : 'destructive'} class="text-xs">
          {#if priceChange.trend === 'down'}
            <TrendingDown class="w-3 h-3 mr-1" />
          {:else}
            <TrendingUp class="w-3 h-3 mr-1" />
          {/if}
          {Math.abs(priceChange.percentage).toFixed(1)}%
        </Badge>
      {/if}
    </div>
    {#if isGoodDeal}
      <Badge variant="default" class="text-xs">Good Deal!</Badge>
    {/if}
  </div>
{:else}
  <!-- Full Mode - Complete Price Tracking -->
  <Card class="w-full">
    <CardHeader class="pb-4">
      <CardTitle class="flex items-center justify-between">
        <span class="flex items-center gap-2">
          <DollarSign class="w-5 h-5 text-green-600" />
          Price Tracking
        </span>
        <Button onclick={trackPrice} variant="outline" size="sm">
          Track Price
        </Button>
      </CardTitle>
    </CardHeader>

    <CardContent class="space-y-6">
      <!-- Current Price & Stats -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div class="text-center p-3 bg-muted/50 rounded-lg">
          <div class="text-2xl font-bold text-green-600">{formatCurrency(currentPrice)}</div>
          <div class="text-sm text-muted-foreground">Current Price</div>
        </div>
        
        <div class="text-center p-3 bg-muted/50 rounded-lg">
          <div class="text-xl font-semibold">{formatCurrency(lowestPrice)}</div>
          <div class="text-sm text-muted-foreground">Lowest</div>
        </div>
        
        <div class="text-center p-3 bg-muted/50 rounded-lg">
          <div class="text-xl font-semibold">{formatCurrency(averagePrice)}</div>
          <div class="text-sm text-muted-foreground">Average</div>
        </div>
        
        <div class="text-center p-3 bg-muted/50 rounded-lg">
          <div class="text-xl font-semibold">{formatCurrency(highestPrice)}</div>
          <div class="text-sm text-muted-foreground">Highest</div>
        </div>
      </div>

      <!-- Price Change Indicator -->
      {#if priceChange.trend !== 'stable'}
        <div class="flex items-center justify-center gap-2 p-3 rounded-lg {priceChange.trend === 'down' ? 'bg-green-50 dark:bg-green-900/20' : 'bg-red-50 dark:bg-red-900/20'}">
          {#if priceChange.trend === 'down'}
            <TrendingDown class="w-5 h-5 text-green-600" />
            <span class="text-green-600 font-medium">
              Price dropped by {formatCurrency(Math.abs(priceChange.amount))} ({Math.abs(priceChange.percentage).toFixed(1)}%)
            </span>
          {:else}
            <TrendingUp class="w-5 h-5 text-red-600" />
            <span class="text-red-600 font-medium">
              Price increased by {formatCurrency(priceChange.amount)} ({priceChange.percentage.toFixed(1)}%)
            </span>
          {/if}
        </div>
      {/if}

      <!-- Deal Alert -->
      {#if isGoodDeal}
        <div class="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <AlertCircle class="w-5 h-5 text-blue-600" />
          <span class="text-blue-600 font-medium">Great Deal! This price is near the historical low.</span>
        </div>
      {/if}

      <!-- Price Chart - TEMPORARILY DISABLED FOR BUNDLE TESTING -->
      {#if showChart && priceHistory.length > 0}
        <div class="space-y-2">
          <h4 class="font-medium flex items-center gap-2">
            <Calendar class="w-4 h-4" />
            Price History
          </h4>
          <div class="chart-container bg-muted/30 rounded-lg p-4" style="height: 250px;">
            <!-- TEMPORARY PLACEHOLDER FOR BUNDLE TESTING -->
            <div class="w-full h-full flex items-center justify-center">
              <div class="text-center">
                <div class="text-lg font-medium text-muted-foreground">
                  📈 Price Chart
                </div>
                <div class="text-sm text-muted-foreground mt-2">
                  Chart disabled for bundle testing
                </div>
                <div class="text-xs text-muted-foreground mt-1">
                  {priceHistory.length} price points available
                </div>
              </div>
            </div>
          </div>
        </div>
      {/if}

      <!-- Price History Table -->
      {#if priceHistory.length > 0}
        <div class="space-y-2">
          <h4 class="font-medium">Recent Price Changes</h4>
          <div class="space-y-2 max-h-32 overflow-y-auto">
            {#each priceHistory.slice(-5).reverse() as entry (entry.date)}
               <div class="flex justify-between items-center text-sm py-2 px-3 bg-muted/30 rounded">
                 <span class="text-muted-foreground">{formatDate(entry.date)}</span>
                 <div class="flex items-center gap-2">
                   <span class="font-medium">{formatCurrency(entry.price)}</span>
                   <Badge variant="outline" class="text-xs">{entry.source}</Badge>
                 </div>
               </div>
             {/each}
          </div>
        </div>
      {/if}
    </CardContent>
  </Card>
{/if}

<style>
  :global(.chart-container) {
    position: relative;
  }
</style>