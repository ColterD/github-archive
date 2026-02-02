<script lang="ts">
  import { cn } from '$lib/utils.js';

  export let className: string = '';
  export let htmlFor: string = '';

  $: classes = cn(
    'text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
    className
  );
</script>

<label
  for={htmlFor}
  class={classes}
  {...$$restProps}
>
  <slot />
</label> 