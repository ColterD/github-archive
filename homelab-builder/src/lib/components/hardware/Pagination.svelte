<script lang="ts">
  export let page: number = 1;
  export let totalPages: number = 1;
</script>

<nav class="flex items-center justify-center gap-2 mt-4" aria-label="Pagination">
  <button class="px-2 py-1 rounded border" disabled={page === 1} aria-label="Previous page">&lt;</button>
  <span class="text-sm">Page {page} of {totalPages}</span>
  <button class="px-2 py-1 rounded border" disabled={page === totalPages} aria-label="Next page">&gt;</button>
</nav> 