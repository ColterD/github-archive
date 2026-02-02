<script lang="ts">
  import { ChevronDown } from 'lucide-svelte';
  import { cn } from '$lib/utils.js';

  export let className: string = '';

  $: classes = cn(
    'flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
    className
  );
</script>

<button
  type="button"
  class={classes}
  aria-haspopup="listbox"
  {...$$restProps}
>
  <slot />
  <ChevronDown class="h-4 w-4 opacity-50" />
</button> 