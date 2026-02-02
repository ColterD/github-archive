<script lang="ts">
  import { cn } from '$lib/utils.js';

  export let className: string = '';

  $: classes = cn(
    'relative z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md',
    className
  );
</script>

<div class={classes} {...$$restProps}>
  <slot />
</div> 