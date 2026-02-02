<script lang="ts">
  import type { PageData } from "./$types";
  import { Button } from "$lib/components/ui/button";
  import { Input } from "$lib/components/ui/input";
  import { Label } from "$lib/components/ui/label";
  import { Card, CardContent, CardHeader, CardTitle } from "$lib/components/ui/card";
  import { Separator } from "$lib/components/ui/separator";
  import { Trash2, Plus } from "lucide-svelte";
  import { formatPrice } from '$lib/utils';
  import { logger } from '$lib/client/logger';

  export let data: PageData;

  interface HardwareItem {
    id: string;
    name: string;
    model: string;
    manufacturerName: string;
    condition: string;
    currentPrice: number | null;
    powerDraw: number;
    specifications: Record<string, Record<string, string | number | boolean>>;
    features: string[];
    images: string[];
  }

  // Local state for build creator
  let buildName = '';
  let buildDescription = '';
  let selectedComponents = new Map();
  let _isLoading = false;
  let _saveStatus = '';
  let _incompatibilityWarnings: string[] = [];
  let categoryTotals: { [key: string]: number } = {};

  // Hardware categories for organization
  const categories = [
    { id: "server", name: "Servers", icon: "🖥️" },
    { id: "storage", name: "Storage", icon: "💾" },
    { id: "networking", name: "Networking", icon: "🌐" },
    { id: "memory", name: "Memory", icon: "🧠" },
  ];

  // Map category keys to hardware data keys
  const getCategoryHardware = (categoryId: string) => {
    return data.hardware?.[categoryId as keyof typeof data.hardware] || [];
  };

  // Category totals for budgeting - optimized to avoid nested loops
  $: categoryTotals = (() => {
    const totals: { [key: string]: number } = {};
    const components = Array.from(selectedComponents.values());
    
    // Initialize all category totals to 0
    categories.forEach(category => {
      totals[category.id] = 0;
    });
    
    // Build category lookup map for O(1) access
    const categoryLookup = new Map<string, string>();
    categories.forEach(category => {
      const categoryHardware = getCategoryHardware(category.id);
      categoryHardware.forEach((hw: HardwareItem) => {
        categoryLookup.set(hw.id, category.id);
      });
    });
    
    // Calculate totals in single pass
    components.forEach((item: HardwareItem & { quantity: number }) => {
      const categoryId = categoryLookup.get(item.id);
      if (categoryId && typeof item.quantity === 'number' && item.quantity > 0) {
        totals[categoryId] += (item.currentPrice || 0) * item.quantity;
      }
    });
    
    return totals;
  })()

  $: buildTotal = Object.values(categoryTotals).reduce((sum: number, total: number) => sum + total, 0);

  // Add hardware to build
  function addHardware(hardware: HardwareItem) {
    if (!selectedComponents.has(hardware.id)) {
      selectedComponents.set(hardware.id, { ...hardware, quantity: 1 });
      selectedComponents = selectedComponents; // Trigger reactivity
    }
  }

  // Remove hardware from build
  function removeHardware(hardwareId: string) {
    selectedComponents.delete(hardwareId);
    selectedComponents = selectedComponents; // Trigger reactivity
  }

  // Update quantity
  function updateQuantity(hardwareId: string, quantity: number) {
    if (quantity > 0) {
      const existingComponent = selectedComponents.get(hardwareId);
      if (existingComponent) {
        selectedComponents.set(hardwareId, { ...existingComponent, quantity });
        selectedComponents = selectedComponents; // Trigger reactivity
      }
    }
  }

  // Input validation helpers
  function validateBuildName(name: string): string | null {
    if (!name.trim()) return "Build name is required";
    if (name.trim().length < 3) return "Build name must be at least 3 characters";
    if (name.trim().length > 100) return "Build name must be less than 100 characters";
    return null;
  }

  function validateBuildDescription(description: string): string | null {
    if (description.length > 1000) return "Description must be less than 1000 characters";
    return null;
  }

  // Save build with improved error handling
  async function saveBuild() {
    // Validate inputs
    const nameError = validateBuildName(buildName);
    if (nameError) {
      alert(nameError);
      return;
    }

    const descError = validateBuildDescription(buildDescription);
    if (descError) {
      alert(descError);
      return;
    }

    if (selectedComponents.size === 0) {
      alert("Please add at least one hardware item");
      return;
    }

    _isLoading = true;
    _saveStatus = '';

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout

      const response = await fetch("/api/builds", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: buildName.trim(),
          description: buildDescription.trim() || undefined,
          items: Array.from(selectedComponents.values()).map((item) => ({
            hardwareItemId: item.id,
            quantity: Math.max(1, Math.floor(item.quantity)), // Ensure positive integer
            notes: item.notes?.trim() || "",
          })),
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const result = await response.json();
        _saveStatus = 'success';
        alert("Build saved successfully!");
        // Reset form
        buildName = "";
        buildDescription = "";
        selectedComponents.clear();
        selectedComponents = selectedComponents; // Trigger reactivity
        
        // Optional: Navigate to the created build
        if (result.build?.url) {
          // window.location.href = result.build.url;
        }
      } else {
        const error = await response.json().catch(() => ({ error: 'Unknown error' }));
        _saveStatus = 'error';
        const errorMessage = error.error || error.message || 'Unknown error';
        alert(`Failed to save build: ${errorMessage}`);
      }
    } catch (err) {
      _saveStatus = 'error';
      console.error('Save build error:', err instanceof Error ? err : new Error(String(err)));
      logger?.error('Save build error', err instanceof Error ? err : new Error(String(err)));
      
      if (err instanceof Error) {
        if (err.name === 'AbortError') {
          alert("Request timed out. Please try again.");
        } else if (err.message.includes('fetch')) {
          alert("Network error. Please check your connection and try again.");
        } else {
          alert(`An error occurred: ${err.message}`);
        }
      } else {
        alert("An unexpected error occurred while saving the build");
      }
    } finally {
      _isLoading = false;
    }
  }
</script>

<div class="container mx-auto p-6 max-w-6xl">
  <div class="mb-8">
    <h1 class="text-3xl font-bold text-gray-900 dark:text-gray-100" id="page-title">Build Creator</h1>
    <p class="text-gray-600 dark:text-gray-400 mt-2">
      Create and customize your homelab hardware build
    </p>
  </div>

  <div class="grid lg:grid-cols-3 gap-6">
    <!-- Hardware Selection Panel -->
    <div class="lg:col-span-2 space-y-6">
      <!-- Hardware Search -->
      <Card>
        <CardHeader>
          <CardTitle id="available-hardware-title">Available Hardware</CardTitle>
        </CardHeader>
        <CardContent>
          <div class="space-y-4">
            <!-- Hardware by Categories -->
            {#each categories as category (category.id)}
              <section class="space-y-2" aria-labelledby="category-{category.id}">
                <h3 class="text-lg font-semibold flex items-center gap-2" id="category-{category.id}">
                  <span>{category.icon}</span>
                  {category.name}
                </h3>
                <div class="grid gap-2" role="list" aria-label="{category.name} hardware items">
                  {#each getCategoryHardware(category.id) as hardware (hardware.id)}
                    <div
                      class="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
                      role="listitem"
                    >
                      <div class="flex-1">
                        <h4 class="font-medium" id="hardware-{hardware.id}">{hardware.name}</h4>
                        <p class="text-sm text-gray-600 dark:text-gray-400">
                          {hardware.manufacturerName || "Unknown"}
                        </p>
                        <p class="text-sm font-semibold text-green-600" aria-label="Price: {hardware.currentPrice ? `$${formatPrice(hardware.currentPrice)}` : 'Price unavailable'}">
                          {hardware.currentPrice ? `$${formatPrice(hardware.currentPrice)}` : 'Price unavailable'}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        onclick={() => addHardware(hardware)}
                        disabled={selectedComponents.has(hardware.id)}
                        aria-describedby="hardware-{hardware.id}"
                        aria-label="Add {hardware.name} to build"
                      >
                        <Plus class="w-4 h-4 mr-1" />
                        Add
                      </Button>
                    </div>
                  {/each}
                </div>
              </section>
            {/each}
          </div>
        </CardContent>
      </Card>
    </div>

    <!-- Build Summary Panel -->
    <div class="space-y-6">
      <!-- Build Info -->
      <Card>
        <CardHeader>
          <CardTitle id="build-details-title">Build Details</CardTitle>
        </CardHeader>
        <CardContent class="space-y-4" aria-labelledby="build-details-title">
          <div>
            <Label for="build-name">Build Name *</Label>
            <Input 
              id="build-name" 
              bind:value={buildName} 
              placeholder="My Homelab Build" 
              required
              aria-required="true"
              aria-describedby="build-name-help"
            />
            <p id="build-name-help" class="text-xs text-gray-500 mt-1">3-100 characters required</p>
          </div>
          <div>
            <Label for="build-description">Description</Label>
            <Input
              id="build-description"
              bind:value={buildDescription}
              placeholder="Brief description of your build"
              maxlength="1000"
              aria-describedby="build-description-help"
            />
            <p id="build-description-help" class="text-xs text-gray-500 mt-1">Optional, max 1000 characters</p>
          </div>
        </CardContent>
      </Card>

      <!-- Selected Hardware -->
      <Card>
        <CardHeader>
          <CardTitle id="selected-hardware-title">Selected Hardware ({selectedComponents.size})</CardTitle>
        </CardHeader>
        <CardContent>
          {#if selectedComponents.size === 0}
            <p class="text-gray-500 text-center py-4" role="status" aria-live="polite">No hardware selected</p>
          {:else}
            <div class="space-y-3" role="list" aria-labelledby="selected-hardware-title">
              {#each Array.from(selectedComponents.values()) as hardware (hardware.id)}
                <div class="p-3 border rounded-lg space-y-2" role="listitem">
                  <div class="flex items-start justify-between">
                    <div class="flex-1 min-w-0">
                      <h5 class="font-medium truncate" id="selected-{hardware.id}">{hardware.name}</h5>
                      <p class="text-sm text-gray-600">{hardware.manufacturerName || "Unknown"}</p>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onclick={() => removeHardware(hardware.id)}
                      aria-describedby="selected-{hardware.id}"
                      aria-label="Remove {hardware.name} from build"
                    >
                      <Trash2 class="w-4 h-4" />
                    </Button>
                  </div>

                  <div class="grid grid-cols-2 gap-2">
                    <div>
                      <Label for={`quantity-${hardware.id}`}>Qty</Label>
                      <Input
                        id={`quantity-${hardware.id}`}
                        type="number"
                        min="1"
                        max="100"
                        value={hardware.quantity}
                        aria-label={`Quantity for ${hardware.name}`}
                        oninput={(e) => {
                          const value = parseInt(e.currentTarget.value);
                          if (!isNaN(value) && value > 0 && value <= 100) {
                            updateQuantity(hardware.id, value);
                          }
                        }}
                        onblur={(e) => {
                          // Ensure valid value on blur
                          const value = parseInt(e.currentTarget.value);
                          if (isNaN(value) || value < 1) {
                            e.currentTarget.value = "1";
                            updateQuantity(hardware.id, 1);
                          } else if (value > 100) {
                            e.currentTarget.value = "100";
                            updateQuantity(hardware.id, 100);
                          }
                        }}
                      />
                    </div>
                    <div>
                      <Label>Price</Label>
                      <p class="text-sm font-semibold px-3 py-2 bg-gray-50 dark:bg-gray-800 rounded">
                        ${formatPrice((hardware.currentPrice || 0) * hardware.quantity)}
                      </p>
                    </div>
                  </div>

                  <div>
                    <Label for={`notes-${hardware.id}`}>Notes</Label>
                    <Input
                      id={`notes-${hardware.id}`}
                      bind:value={hardware.notes}
                      placeholder="Optional notes..."
                      maxlength="500"
                      aria-label={`Notes for ${hardware.name}`}
                    />
                  </div>
                </div>
              {/each}
            </div>
          {/if}
        </CardContent>
      </Card>

      <!-- Build Summary -->
      <Card>
        <CardHeader>
          <CardTitle id="build-summary-title">Build Summary</CardTitle>
        </CardHeader>
        <CardContent aria-labelledby="build-summary-title">
          <div class="space-y-3" role="table" aria-label="Build cost breakdown">
            {#each categories as category (category.id)}
              {#if categoryTotals[category.id] > 0}
                <div class="flex justify-between text-sm" role="row">
                  <span role="cell">{category.name}</span>
                  <span class="font-medium" role="cell" aria-label="{category.name} total: ${categoryTotals[category.id].toFixed(2)}">${categoryTotals[category.id].toFixed(2)}</span>
                </div>
              {/if}
            {/each}
            <Separator role="separator" />
            <div class="flex justify-between font-semibold text-lg" role="row">
              <span role="cell">Total</span>
              <span role="cell" aria-label="Grand total: ${buildTotal.toFixed(2)}">${buildTotal.toFixed(2)}</span>
            </div>
          </div>

          <Button 
            class="w-full mt-4" 
            onclick={saveBuild} 
            disabled={selectedComponents.size === 0 || _isLoading}
            aria-describedby="save-button-help"
            aria-label="Save build with {selectedComponents.size} items totaling ${buildTotal.toFixed(2)}"
          >
            {#if _isLoading}
              <span aria-live="polite">Saving...</span>
            {:else}
              Save Build
            {/if}
          </Button>
          <p id="save-button-help" class="text-xs text-gray-500 mt-2 text-center">
            {selectedComponents.size === 0 ? 'Add hardware items to enable saving' : `Ready to save ${selectedComponents.size} item${selectedComponents.size === 1 ? '' : 's'}`}
          </p>
        </CardContent>
      </Card>
    </div>
  </div>
</div>