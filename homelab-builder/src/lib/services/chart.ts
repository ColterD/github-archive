/**
 * OPTIMIZED CHART SERVICE - MINIMAL BUNDLE SIZE
 *
 * Single Chart.js import point to prevent bundle duplication
 * Only imports essential chart types to reduce bundle size
 */

import Chart from "chart.js/auto";
import type { ChartConfiguration, ChartOptions, ChartData } from "chart.js";

export function createChart(
  canvas: HTMLCanvasElement,
  config: ChartConfiguration,
): Chart {
  return new Chart(canvas, config);
}

export function getDefaultOptions(): ChartOptions {
  return {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: "top",
      },
    },
  };
}

export function createLineChart(
  canvas: HTMLCanvasElement,
  data: ChartData,
): Chart {
  const config: ChartConfiguration = {
    type: "line",
    data,
    options: getDefaultOptions(),
  };

  return createChart(canvas, config);
}

/**
 * Simple date formatting without external dependencies
 * Replaces chartjs-adapter-date-fns to reduce bundle size
 */
export function formatDate(date: string | Date): string {
  const d = new Date(date);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

/**
 * Format datetime for detailed charts
 */
export function formatDateTime(date: string | Date): string {
  const d = new Date(date);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
