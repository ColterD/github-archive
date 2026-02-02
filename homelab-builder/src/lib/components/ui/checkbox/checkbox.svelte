<script lang="ts">
  import { Check } from 'lucide-svelte';
  import { cn } from '$lib/utils.js';
  import { createEventDispatcher } from 'svelte';

  export let checked: boolean = false;
  export let disabled: boolean = false;
  export let id: string = '';
  export let name: string = '';
  export let value: string = '';
  export let className: string = '';
  export let onCheckedChange: ((checked: boolean) => void) | undefined = undefined;

  const dispatch = createEventDispatcher<{
    change: boolean;
  }>();

  function handleChange() {
    if (disabled) return;
    
    checked = !checked;
    dispatch('change', checked);
    
    if (onCheckedChange) {
      onCheckedChange(checked);
    }
  }

  $: classes = cn(
    'peer h-4 w-4 shrink-0 rounded-sm border border-primary ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
    checked ? 'bg-primary text-primary-foreground' : 'bg-background',
    className
  );
</script>

<button
  type="button"
  role="checkbox"
  aria-checked={checked}
  aria-disabled={disabled}
  {id}
  {name}
  {value}
  {disabled}
  class={classes}
  onclick={handleChange}
  onkeydown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleChange();
    }
  }}
  {...$$restProps}
>
  {#if checked}
    <Check class="h-3 w-3" />
  {/if}
</button>