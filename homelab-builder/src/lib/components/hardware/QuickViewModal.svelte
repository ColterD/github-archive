<script lang="ts">
  interface HardwareItem {
    id?: string;
    name?: string;
    specs?: string;
    price?: number;
    category?: string;
    manufacturer?: string;
  }

  export let open: boolean = false;
  export let item: HardwareItem | null = null;
</script>

{#if open}
  <div class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
    <div class="bg-background rounded-lg shadow-lg p-6 w-full max-w-lg relative">
      <button class="absolute top-2 right-2 text-xl" aria-label="Close">×</button>
      <h2 class="font-semibold text-lg mb-2">{item?.name ?? 'Hardware Name'}</h2>
      <div class="mb-4">{item?.specs ?? 'Specs summary'}</div>
      <!-- More details placeholder -->
    </div>
  </div>
{/if}