<!-- ADMIN METRICS CHART COMPONENT WITH CHART.JS -->
<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { browser } from '$app/environment';
  import type { Chart, ChartConfiguration, ChartType, ChartOptions } from 'chart.js';
  import type { TimeSeriesData, ChartDataPoint } from '$lib/types/admin';

  export let type: ChartType = 'line';
  export let data: TimeSeriesData | ChartDataPoint[] | null = null;
  export let options: Partial<ChartOptions> = {};
  export let width: number = 400;
  export let height: number = 200;
  export let backgroundColor: string = 'rgba(59, 130, 246, 0.1)';
  export let borderColor: string = 'rgba(59, 130, 246, 1)';
  export let title: string = '';
  export let loading: boolean = false;

  let canvas: HTMLCanvasElement;
  let chart: Chart | null = null;
  let chartLoaded = false;
  let ChartClass: typeof Chart | null = null;

  // Process data based on type
  function processChartData() {
    if (!data) return null;

    // If data is already in TimeSeriesData format
    if ('labels' in data && 'datasets' in data) {
      return data;
    }

    // If data is ChartDataPoint array, convert to TimeSeriesData
    if (Array.isArray(data)) {
      return {
        labels: data.map(point => point.label),
        datasets: [{
          label: title || 'Data',
          data: data.map(point => point.value),
          backgroundColor,
          borderColor,
          fill: type === 'line' ? false : true,
          tension: 0.4
        }]
      };
    }

    return null;
  }

  const initChart = async () => {
    if (!browser || !canvas || chart) return;

    try {
      // Dynamic import to reduce bundle size
      const chartModule = await import('chart.js');
      ChartClass = chartModule.Chart;
      
      // Register required components
      ChartClass.register(
        chartModule.CategoryScale,
        chartModule.LinearScale,
        chartModule.PointElement,
        chartModule.LineElement,
        chartModule.BarElement,
        chartModule.ArcElement,
        chartModule.Title,
        chartModule.Tooltip,
        chartModule.Legend
      );

      const processedData = processChartData();
      if (!processedData) return;

      const config: ChartConfiguration = {
        type,
        data: processedData,
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            title: {
              display: !!title,
              text: title
            },
            legend: {
              display: true,
              position: 'top'
            }
          },
          scales: type !== 'doughnut' && type !== 'pie' ? {
            y: {
              beginAtZero: true
            }
          } : {},
          ...options
        }
      };

      chart = new ChartClass(canvas, config);
      chartLoaded = true;
    } catch (error) {
      console.error('Failed to load Chart.js:', error);
    }
  };

  const updateChart = () => {
    if (!chart || !data.length) return;

    chart.data.labels = data.map(point => point.label);
    chart.data.datasets[0].data = data.map(point => point.value);
    chart.update('none'); // No animation for better performance
  };

  onMount(() => {
    if (data.length > 0) {
      initChart();
    }
  });

  onDestroy(() => {
    if (chart) {
      chart.destroy();
      chart = null;
    }
  });

  // Reactive updates
  $: if (chart && data) {
    const processedData = processChartData();
    if (processedData) {
      chart.data = processedData;
      chart.update();
    }
  }

  // Initialize chart when data becomes available
  $: if (!chart && data.length > 0 && canvas) {
    initChart();
  }
</script>

<div class="chart-container" style="width: {width}px; height: {height}px;">
  {#if loading}
    <div class="chart-placeholder loading">
      <div class="loading-spinner"></div>
      <p>Loading chart...</p>
    </div>
  {:else if !data || (Array.isArray(data) && data.length === 0)}
    <div class="chart-placeholder">
      <p>No data available</p>
    </div>
  {:else}
    <canvas bind:this={canvas} {width} {height}></canvas>
  {/if}
</div>

<style>
  .chart-container {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .chart-placeholder {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.05);
    border-radius: 8px;
    color: #666;
  }

  .chart-placeholder.loading {
    gap: 12px;
  }

  .loading-spinner {
    width: 24px;
    height: 24px;
    border: 2px solid #e5e7eb;
    border-top: 2px solid #3b82f6;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  canvas {
    max-width: 100%;
    max-height: 100%;
  }
</style>