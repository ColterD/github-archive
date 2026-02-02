<script lang="ts">
  import type { HardwareItem } from '$lib/types/database';
  
  export let items: HardwareItem[] = [];
</script>

<div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
  {#each items as item (item.id)}
    <slot name="card" {item} />
  {/each}
</div>