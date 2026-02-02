<script lang="ts">
  export let sort: string = 'relevance';
</script>

<div class="inline-block">
  <label class="sr-only" for="sort">Sort by</label>
  <select id="sort" class="rounded border px-2 py-1" bind:value={sort}>
    <option value="relevance">Relevance</option>
    <option value="price-asc">Price: Low to High</option>
    <option value="price-desc">Price: High to Low</option>
    <option value="date">Newest</option>
    <option value="popularity">Popularity</option>
  </select>
</div> 