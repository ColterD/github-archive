<!-- HOMELAB HARDWARE PLATFORM - HARDWARE ITEM DETAIL -->
<script lang="ts">
  import { Button } from "$lib/components/ui/button";
  import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "$lib/components/ui/card";
  import { Badge } from "$lib/components/ui/badge";
  import { websocketClient } from '$lib/stores/websocket.js';
  import { onMount } from 'svelte';
  import {
    Star,
    Heart,
    Eye,
    ExternalLink,
    Share2,
    ShoppingCart,
    TrendingDown,
    ArrowLeft,
    Server,
    HardDrive,
    Network,
    Cpu,
    Monitor,
    Cable,
  } from "lucide-svelte";

  export let data;

  const item = data.item;
  const priceHistory = data.priceHistory;
  const relatedItems = data.relatedItems;

  // Parse specifications from JSON string
  let specifications: Record<string, Record<string, string | number | boolean>> = {};
  try {
    specifications = item.specifications ? JSON.parse(item.specifications) : {};
  } catch {
    specifications = {};
  }

  // Category icons mapping
  const categoryIcons = {
    SERVER: Server,
    STORAGE: HardDrive,
    NETWORKING: Network,
    VIRTUALIZATION: Cpu,
    COMPONENTS: Monitor,
    ACCESSORIES: Cable,
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(price);
  };

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatCondition = (condition: string) => {
    return condition.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (l) => l.toUpperCase());
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "SERVER":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "STORAGE":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "NETWORKING":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200";
      case "VIRTUALIZATION":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200";
      case "COMPONENTS":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      case "ACCESSORIES":
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
  };

  const calculateSavings = () => {
    if (item.msrp && item.currentPrice && item.msrp > item.currentPrice) {
      const savings = item.msrp - item.currentPrice;
      const percentage = Math.round((savings / item.msrp) * 100);
      return { amount: savings, percentage };
    }
    return null;
  };

  const IconComponent = categoryIcons[item.category];
  const savings = calculateSavings();

  // Track hardware view when component mounts
  onMount(() => {
    if (websocketClient.isConnected()) {
      websocketClient.trackHardwareView(item.id);
    }
  });
</script>

<svelte:head>
  <title>{item.name} - {item.manufacturer.name} | Homelab Hardware Platform</title>
  <meta
    name="description"
    content="{item.description || `${item.manufacturer.name} ${item.name} - ${formatCondition(item.condition)} condition for ${formatPrice(item.currentPrice || 0)}`}"
  />
</svelte:head>

<div class="container mx-auto px-4 py-8 max-w-7xl">
  <!-- Breadcrumb -->
  <div class="flex items-center gap-2 text-sm text-muted-foreground mb-6">
    <a href="/hardware" class="hover:text-primary transition-colors">Hardware</a>
    <span>/</span>
    <span class="text-foreground font-medium">{item.name}</span>
  </div>

  <!-- Back Button -->
  <Button variant="ghost" class="mb-6" onclick={() => window.history.back()}>
    <ArrowLeft class="w-4 h-4 mr-2" />
    Back to Hardware
  </Button>

  <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
    <!-- Main Content -->
    <div class="lg:col-span-2 space-y-8">
      <!-- Header -->
      <div>
        <div class="flex items-start justify-between mb-4">
          <div class="flex-1">
            <h1 class="text-3xl font-bold mb-2">{item.name}</h1>
            <p class="text-xl text-muted-foreground">{item.manufacturer.name} • {item.model}</p>
          </div>
          <div class="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <Heart class="w-4 h-4 mr-2" />
              Save
            </Button>
            <Button variant="outline" size="sm">
              <Share2 class="w-4 h-4 mr-2" />
              Share
            </Button>
          </div>
        </div>

        <div class="flex items-center gap-3 mb-6">
          <Badge class={getCategoryColor(item.category)}>
            {item.category.replace(/_/g, " ")}
          </Badge>
          <Badge variant="outline">
            {formatCondition(item.condition)}
          </Badge>
          {#if item.subcategory}
            <Badge variant="outline">{item.subcategory}</Badge>
          {/if}
        </div>

        <div class="flex items-center gap-6 text-sm text-muted-foreground">
          <div class="flex items-center gap-1">
            <Eye class="w-4 h-4" />
            <span>{item.viewCount} views</span>
          </div>
          <div class="flex items-center gap-1">
            <Heart class="w-4 h-4" />
            <span>{item._count?.favorites || 0} favorites</span>
          </div>
          <div class="flex items-center gap-1">
            <Star class="w-4 h-4" />
            <span>{item._count.reviews} reviews</span>
          </div>
        </div>
      </div>

      <!-- Image Placeholder -->
      <Card>
        <CardContent class="p-8">
          <div class="aspect-video bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 rounded-lg flex items-center justify-center">
            <IconComponent class="w-20 h-20 text-muted-foreground" />
          </div>
        </CardContent>
      </Card>

      <!-- Description -->
      {#if item.description}
        <Card>
          <CardHeader>
            <CardTitle>Description</CardTitle>
          </CardHeader>
          <CardContent>
            <p class="text-muted-foreground leading-relaxed">{item.description}</p>
          </CardContent>
        </Card>
      {/if}

      <!-- Specifications -->
      {#if Object.keys(specifications).length > 0}
        <Card>
          <CardHeader>
            <CardTitle>Technical Specifications</CardTitle>
          </CardHeader>
          <CardContent>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              {#each Object.entries(specifications) as [category, specs] (category)}
                <div>
                  <h4 class="font-semibold mb-3 text-sm uppercase tracking-wide text-muted-foreground">
                    {category}
                  </h4>
                  <div class="space-y-2">
                    {#each Object.entries(specs) as [key, value] (key)}
                      <div class="flex justify-between">
                        <span class="text-sm text-muted-foreground capitalize">
                          {key.replace(/([A-Z])/g, " $1").toLowerCase()}:
                        </span>
                        <span class="text-sm font-medium">
                          {Array.isArray(value) ? value.join(", ") : value}
                        </span>
                      </div>
                    {/each}
                  </div>
                </div>
              {/each}
            </div>
          </CardContent>
        </Card>
      {/if}

      <!-- Features -->
      {#if item.features && item.features.length > 0}
        <Card>
          <CardHeader>
            <CardTitle>Key Features</CardTitle>
          </CardHeader>
          <CardContent>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
              {#each item.features as feature (feature)}
                <div class="flex items-center gap-2">
                  <div class="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span class="text-sm">{feature}</span>
                </div>
              {/each}
            </div>
          </CardContent>
        </Card>
      {/if}

      <!-- Price History -->
      {#if priceHistory.length > 0}
        <Card>
          <CardHeader>
            <CardTitle>Price History</CardTitle>
            <CardDescription>Recent pricing data from various sources</CardDescription>
          </CardHeader>
          <CardContent>
            <div class="space-y-3">
              {#each priceHistory.slice(0, 5) as price (price.id || `${price.price}-${price.timestamp}`)}
                <div class="flex items-center justify-between p-3 border rounded-lg">
                  <div class="flex items-center gap-3">
                    <Badge variant="outline">{price.vendor}</Badge>
                  </div>
                  <div class="flex items-center gap-2">
                    <span class="font-semibold">{formatPrice(price.price)}</span>
                    <span class="text-xs text-muted-foreground">
                      {formatDate(price.timestamp)}
                    </span>
                  </div>
                </div>
              {/each}
            </div>
          </CardContent>
        </Card>
      {/if}
    </div>

    <!-- Sidebar -->
    <div class="space-y-6">
      <!-- Pricing Card -->
      <Card>
        <CardHeader>
          <CardTitle>Pricing</CardTitle>
        </CardHeader>
        <CardContent class="space-y-4">
          <div class="text-center">
            <div class="text-3xl font-bold text-green-600 mb-2">
              {formatPrice(item.currentPrice || 0)}
            </div>
            
            {#if savings}
              <div class="space-y-1">
                <div class="text-sm text-muted-foreground line-through">
                  MSRP: {formatPrice(item.msrp || 0)}
                </div>
                <div class="flex items-center justify-center gap-2 text-sm">
                  <TrendingDown class="w-4 h-4 text-green-600" />
                  <span class="text-green-600 font-medium">
                    Save {formatPrice(savings.amount)} ({savings.percentage}% off)
                  </span>
                </div>
              </div>
            {/if}
          </div>

          <div class="space-y-2">
            <Button class="w-full">
              <ShoppingCart class="w-4 h-4 mr-2" />
              Find on eBay
            </Button>
            <Button variant="outline" class="w-full">
              <ExternalLink class="w-4 h-4 mr-2" />
              Compare Prices
            </Button>
          </div>
        </CardContent>
      </Card>

      <!-- Quick Stats -->
      <Card>
        <CardHeader>
          <CardTitle>Quick Stats</CardTitle>
        </CardHeader>
        <CardContent class="space-y-3">
          {#if specifications?.formFactor || specifications?.form_factor}
            <div class="flex justify-between">
              <span class="text-sm text-muted-foreground">Form Factor:</span>
              <span class="text-sm font-medium">{specifications?.formFactor || specifications?.form_factor}</span>
            </div>
          {/if}
          {#if specifications?.power || specifications?.powerDraw || specifications?.power_consumption}
            <div class="flex justify-between">
              <span class="text-sm text-muted-foreground">Power:</span>
              <span class="text-sm font-medium">{specifications?.power || specifications?.powerDraw || specifications?.power_consumption}W</span>
            </div>
          {/if}

          {#if specifications?.rackUnits || specifications?.rack_units}
            <div class="flex justify-between">
              <span class="text-sm text-muted-foreground">Rack Units:</span>
              <span class="text-sm font-medium">{specifications?.rackUnits || specifications?.rack_units}U</span>
            </div>
          {/if}
        </CardContent>
      </Card>

      <!-- Reviews Preview -->
      {#if item.reviews && item.reviews.length > 0}
        <Card>
          <CardHeader>
            <CardTitle>Recent Reviews</CardTitle>
          </CardHeader>
          <CardContent class="space-y-4">
            {#each item.reviews.slice(0, 2) as review (review.id)}
              <div class="border-l-4 border-yellow-400 pl-3">
                <div class="flex items-center gap-1 mb-1">
                  {#each Array(5).fill(0).map((_, idx) => idx) as i (i)}
                    <Star class="w-3 h-3 {i < review.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}" />
                  {/each}
                  <span class="text-xs text-muted-foreground ml-2">
                    by {review.user.name}
                  </span>
                </div>
                <p class="text-sm text-muted-foreground line-clamp-3">{review.content}</p>
              </div>
            {/each}
            
            {#if item._count.reviews > 2}
              <Button variant="outline" class="w-full" size="sm">
                View All {item._count.reviews} Reviews
              </Button>
            {/if}
          </CardContent>
        </Card>
      {/if}
    </div>
  </div>

  <!-- Related Items -->
  {#if relatedItems.length > 0}
    <section class="mt-12">
      <h2 class="text-2xl font-bold mb-6">Related Hardware</h2>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {#each relatedItems as relatedItem (relatedItem.id)}
          {@const RelatedIcon = categoryIcons[relatedItem.category]}
          <Card class="hover:shadow-lg transition-shadow cursor-pointer">
            <div class="aspect-square bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 rounded-t-lg flex items-center justify-center">
              <RelatedIcon class="w-8 h-8 text-muted-foreground" />
            </div>
            <CardHeader class="pb-2">
              <CardTitle class="text-sm leading-tight">{relatedItem.name}</CardTitle>
              <CardDescription class="text-xs">{relatedItem.manufacturer.name}</CardDescription>
            </CardHeader>
            <CardContent class="pt-0">
              <div class="flex items-center justify-between">
                <span class="font-semibold text-green-600 text-sm">
                  {formatPrice(relatedItem.currentPrice || 0)}
                </span>
                <Badge variant="outline" class="text-xs">
                  {relatedItem.category}
                </Badge>
              </div>
            </CardContent>
          </Card>
        {/each}
      </div>
    </section>
  {/if}
</div>

<style>
  .line-clamp-3 {
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
    line-clamp: 3;
    overflow: hidden;
  }
</style>