<!-- LAZY LOADING WRAPPER COMPONENT -->
<script lang="ts">
  import { onMount } from 'svelte';
  import { browser } from '$app/environment';
  import type { ComponentType } from 'svelte';

  export let loader: () => Promise<{ default: ComponentType } | ComponentType>;
  export let fallback: string = 'Loading...';
  export let errorMessage: string = 'Failed to load component';
  export let threshold: number = 0.1; // Intersection observer threshold
  export let rootMargin: string = '50px'; // Load when 50px away from viewport

  let component: ComponentType | null = null;
  let loading = false;
  let error = false;
  let containerElement: HTMLElement;
  let observer: IntersectionObserver | null = null;

  const loadComponent = async () => {
    if (loading || component || !browser) return;
    
    loading = true;
    error = false;

    try {
      const module = await loader();
      component = module.default || module;
    } catch (err) {
      console.error('Failed to load component:', err);
      error = true;
    } finally {
      loading = false;
    }
  };

  onMount(() => {
    if (!browser) return;

    // Create intersection observer for lazy loading
    observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            loadComponent();
            observer?.unobserve(entry.target);
          }
        });
      },
      {
        threshold,
        rootMargin
      }
    );

    if (containerElement) {
      observer.observe(containerElement);
    }

    return () => {
      observer?.disconnect();
    };
  });
</script>

<div bind:this={containerElement} class="lazy-loader">
  {#if component}
    <svelte:component this={component} {...$$restProps} />
  {:else if loading}
    <div class="lazy-loader-fallback">
      <div class="animate-pulse flex items-center justify-center p-8">
        <div class="text-muted-foreground">{fallback}</div>
      </div>
    </div>
  {:else if error}
    <div class="lazy-loader-error">
      <div class="text-red-500 text-center p-8">
        {errorMessage}
      </div>
    </div>
  {:else}
    <!-- Placeholder for intersection observer -->
    <div class="lazy-loader-placeholder">
      <div class="h-32 bg-muted/20 rounded animate-pulse"></div>
    </div>
  {/if}
</div>

<style>
  .lazy-loader {
    min-height: 100px;
  }
  
  .lazy-loader-fallback,
  .lazy-loader-error,
  .lazy-loader-placeholder {
    width: 100%;
  }
</style>