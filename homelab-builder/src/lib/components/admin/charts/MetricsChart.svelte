<!-- HOMELAB HARDWARE PLATFORM - METRICS CHART COMPONENT -->
<script lang="ts">
  import type { ChartDataPoint } from '$lib/types/admin'
  // TEMPORARILY DISABLED FOR BUNDLE TESTING

  export let data: ChartDataPoint[] = []
  export let title: string = ''
  export let height: string = '300px'
  // TEMPORARILY DISABLED FOR BUNDLE TESTING
</script>

<div class="chart-container" style="height: {height};">
  <!-- TEMPORARY PLACEHOLDER FOR BUNDLE TESTING -->
  <div class="w-full h-full bg-muted/30 rounded-lg p-4 flex items-center justify-center">
    <div class="text-center">
      <div class="text-lg font-medium text-muted-foreground">
        📊 {title || 'Chart'}
      </div>
      <div class="text-sm text-muted-foreground mt-2">
        Chart disabled for bundle testing
      </div>
      <div class="text-xs text-muted-foreground mt-1">
        {data.length} data points available
      </div>
    </div>
  </div>
</div>

<style>
  .chart-container {
    position: relative;
    width: 100%;
  }
</style>