<script lang="ts">
  export let value: string = '';
  export let placeholder: string = 'Search hardware...';
</script>

<div class="relative w-full">
  <input
    type="search"
    class="w-full rounded border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent bg-background text-foreground"
    bind:value
    placeholder={placeholder}
    aria-label="Search hardware"
    autocomplete="off"
  />
  <!-- Autocomplete dropdown placeholder -->
</div> 