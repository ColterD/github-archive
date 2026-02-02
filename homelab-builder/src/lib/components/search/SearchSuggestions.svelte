<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { Card, CardContent } from '$lib/components/ui/card';
  import { Badge } from '$lib/components/ui/badge';
  import { Search, TrendingUp, Clock } from 'lucide-svelte';

  export let suggestions: Array<{
    id: string;
    text: string;
    type: 'recent' | 'popular' | 'category' | 'manufacturer';
    count?: number;
  }> = [];
  export let loading = false;
  export let visible = true;

  const dispatch = createEventDispatcher<{
    select: { suggestion: string; type: string };
    clear: void;
  }>();

  function selectSuggestion(suggestion: { id: string; text: string; type: string; count?: number }) {
    dispatch('select', {
      suggestion: suggestion.text,
      type: suggestion.type
    });
  }

  function clearRecentSearches() {
    dispatch('clear');
  }

  // Group suggestions by type
  $: groupedSuggestions = suggestions.reduce((groups, suggestion) => {
    const type = suggestion.type;
    if (!groups[type]) {
      groups[type] = [];
    }
    groups[type].push(suggestion);
    return groups;
  }, {} as Record<string, typeof suggestions>);

  // Create sections with icons and labels
  $: sections = [
    {
      key: 'recent',
      label: 'Recent Searches',
      icon: Clock,
      items: groupedSuggestions.recent || [],
      clearable: true
    },
    {
      key: 'popular',
      label: 'Popular Searches',
      icon: TrendingUp,
      items: groupedSuggestions.popular || [],
      clearable: false
    },
    {
      key: 'category',
      label: 'Categories',
      icon: Search,
      items: groupedSuggestions.category || [],
      clearable: false
    },
    {
      key: 'manufacturer',
      label: 'Manufacturers',
      icon: Search,
      items: groupedSuggestions.manufacturer || [],
      clearable: false
    }
  ].filter(section => section.items.length > 0);
</script>

{#if visible}
  <Card class="absolute top-full left-0 right-0 z-50 mt-1 max-h-96 overflow-y-auto shadow-lg">
    <CardContent class="p-0">
      {#if loading}
        <div class="p-4 text-center text-gray-500">
          <div class="animate-spin w-5 h-5 border-2 border-gray-300 border-t-blue-600 rounded-full mx-auto"></div>
          <p class="mt-2 text-sm">Loading suggestions...</p>
        </div>
      {:else if sections.length === 0}
        <div class="p-4 text-center text-gray-500">
          <Search class="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p class="text-sm">No suggestions available</p>
        </div>
      {:else}
        {#each sections as section (section.key)}
          <div class="border-b border-gray-100 last:border-b-0">
            <div class="flex items-center justify-between px-4 py-2 bg-gray-50 border-b border-gray-100">
              <div class="flex items-center gap-2">
                <svelte:component this={section.icon} class="w-4 h-4 text-gray-500" />
                <h3 class="text-sm font-medium text-gray-700">{section.label}</h3>
              </div>
              {#if section.clearable}
                <button
                  type="button"
                  onclick={clearRecentSearches}
                  class="text-xs text-blue-600 hover:text-blue-800"
                >
                  Clear
                </button>
              {/if}
            </div>
            
            <div class="py-2">
              {#each section.items as suggestion (suggestion.id)}
                <button
                  type="button"
                  class="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center justify-between group"
                  onclick={() => selectSuggestion(suggestion)}
                >
                  <span class="text-sm text-gray-700 group-hover:text-gray-900">
                    {suggestion.text}
                  </span>
                  {#if suggestion.count !== undefined}
                    <Badge variant="secondary" class="text-xs">
                      {suggestion.count}
                    </Badge>
                  {/if}
                </button>
              {/each}
            </div>
          </div>
        {/each}
      {/if}
    </CardContent>
  </Card>
{/if}