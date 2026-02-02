<script lang="ts">
  import { cn } from '$lib/utils.js';

  export let placeholder: string = 'Select...';
  export let className: string = '';

  $: classes = cn('block truncate', className);
</script>

<span class={classes} {...$$restProps}>
  <slot>
    {placeholder}
  </slot>
</span> 