<script lang="ts">
  interface HardwareItem {
    id?: string;
    name?: string;
    specs?: string;
    price?: number;
    category?: string;
    manufacturer?: string;
  }

  export let item: HardwareItem;
</script>

<div class="bg-card rounded-lg shadow-md p-4 flex flex-col gap-2 transition hover:shadow-lg focus-within:ring-2 ring-accent">
  <div class="aspect-w-16 aspect-h-9 bg-gray-100 dark:bg-gray-800 rounded overflow-hidden mb-2">
    <!-- Placeholder for hardware image -->
  </div>
  <h2 class="font-semibold text-lg text-primary truncate">{item?.name ?? 'Hardware Name'}</h2>
  <div class="text-sm text-muted-foreground">{item?.specs ?? 'Specs summary'}</div>
  <div class="font-bold text-accent">{item?.price ? `$${item.price}` : 'Price'}</div>
  <div class="mt-2 flex gap-2">
    <!-- Placeholder for actions (compare, quick view, etc.) -->
  </div>
</div>