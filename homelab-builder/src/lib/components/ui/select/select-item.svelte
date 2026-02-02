<script lang="ts">
  import { Check } from 'lucide-svelte';
  import { cn } from '$lib/utils.js';

  export let value: string;
  export let disabled: boolean = false;
  export let className: string = '';
  export let handleSelect: (value: string) => void;

  $: classes = cn(
    'relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
    disabled && 'pointer-events-none opacity-50',
    className
  );
</script>

<button
  type="button"
  class={classes}
  {disabled}
  onclick={() => !disabled && handleSelect(value)}
  {...$$restProps}
>
  <span class="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
    <Check class="h-4 w-4" />
  </span>
  <slot />
</button>