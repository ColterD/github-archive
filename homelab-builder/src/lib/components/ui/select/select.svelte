<script lang="ts">
  import { ChevronDown } from 'lucide-svelte';
  import { cn } from '$lib/utils.js';
  import { createEventDispatcher } from 'svelte';

  export let value: string | undefined = undefined;
  export let placeholder: string = 'Select...';
  export let disabled: boolean = false;
  export let className: string = '';
  export let onValueChange: ((value: string | undefined) => void) | undefined = undefined;

  let isOpen = false;
  let selectRef: HTMLDivElement;

  const dispatch = createEventDispatcher<{
    change: string | undefined;
  }>();

  function handleSelect(newValue: string | undefined) {
    value = newValue;
    isOpen = false;
    dispatch('change', value);
    
    if (onValueChange) {
      onValueChange(value);
    }
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      isOpen = !isOpen;
    } else if (event.key === 'Escape') {
      isOpen = false;
    }
  }

  function handleClickOutside(event: MouseEvent) {
    if (selectRef && !selectRef.contains(event.target as Node)) {
      isOpen = false;
    }
  }

  $: if (typeof window !== 'undefined') {
    if (isOpen) {
      document.addEventListener('click', handleClickOutside);
    } else {
      document.removeEventListener('click', handleClickOutside);
    }
  }

  $: triggerClasses = cn(
    'flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
    className
  );
</script>

<div bind:this={selectRef} class="relative">
  <button
    type="button"
    class={triggerClasses}
    {disabled}
    aria-expanded={isOpen}
    aria-haspopup="listbox"
    onclick={() => !disabled && (isOpen = !isOpen)}
    onkeydown={handleKeydown}
    {...$$restProps}
  >
    <span class="truncate">
      {value || placeholder}
    </span>
    <ChevronDown class="h-4 w-4 opacity-50" />
  </button>

  {#if isOpen}
    <div class="absolute top-full left-0 right-0 z-50 mt-1 max-h-60 overflow-auto rounded-md border bg-popover text-popover-foreground shadow-md">
      <slot {handleSelect} />
    </div>
  {/if}
</div>