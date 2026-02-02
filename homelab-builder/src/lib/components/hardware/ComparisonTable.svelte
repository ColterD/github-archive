<script lang="ts">
  interface HardwareItem {
    id?: string;
    name?: string;
    cpu?: string;
    ram?: string;
    specs?: string;
    price?: number;
    category?: string;
    manufacturer?: string;
  }

  export let items: HardwareItem[] = [];
</script>

<div class="overflow-x-auto mt-6">
  <table class="min-w-full border border-border bg-background rounded-lg">
    <thead>
      <tr>
        <th class="p-2 font-semibold text-left">Spec</th>
        {#each items as item (item.id)}
          <th class="p-2 font-semibold text-center">{item?.name ?? 'Hardware'}</th>
        {/each}
      </tr>
    </thead>
    <tbody>
      <!-- Placeholder for spec rows -->
      <tr>
        <td class="p-2 font-medium">CPU</td>
        {#each items as item (item.id)}
          <td class="p-2 text-center">{item?.cpu ?? '-'}</td>
        {/each}
      </tr>
      <tr>
        <td class="p-2 font-medium">RAM</td>
        {#each items as item (item.id)}
          <td class="p-2 text-center">{item?.ram ?? '-'}</td>
        {/each}
      </tr>
      <!-- More spec rows as needed -->
    </tbody>
  </table>
</div>