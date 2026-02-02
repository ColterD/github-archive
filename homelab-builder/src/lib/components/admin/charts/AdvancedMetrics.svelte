<script lang="ts">
  import { onMount } from 'svelte';
  import type { PerformanceMetrics, SystemAlert, AdminActivity } from '$lib/types/admin';
  import ChartJS from './ChartJS.svelte';

  export let performanceData: PerformanceMetrics | null = null;
  export let alerts: SystemAlert[] = [];
  export let recentActivity: AdminActivity[] = [];
  export let loading: boolean = false;

  let systemMetrics = {
    cpu: 0,
    memory: 0,
    disk: 0,
    network: 0
  };

  // Mock data for demonstration
  onMount(() => {
    // Simulate real-time system metrics
    const updateMetrics = () => {
      systemMetrics = {
        cpu: Math.floor(Math.random() * 100),
        memory: Math.floor(Math.random() * 100),
        disk: Math.floor(Math.random() * 100),
        network: Math.floor(Math.random() * 100)
      };
    };

    updateMetrics();
    const interval = setInterval(updateMetrics, 5000);

    return () => clearInterval(interval);
  });

  // Process performance data for charts
  $: cpuData = performanceData ? [
    { label: 'Current', value: systemMetrics.cpu },
    { label: 'Average', value: 65 },
    { label: 'Peak', value: 85 }
  ] : [];

  $: memoryData = performanceData ? [
    { label: 'Used', value: systemMetrics.memory },
    { label: 'Available', value: 100 - systemMetrics.memory }
  ] : [];

  function getSeverityColor(severity: string) {
    switch (severity) {
      case 'critical': return 'text-red-600 bg-red-50';
      case 'high': return 'text-orange-600 bg-orange-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      case 'low': return 'text-blue-600 bg-blue-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  }

  function getActivityIcon(type: string) {
    switch (type) {
      case 'user': return '👤';
      case 'hardware': return '🔧';
      case 'system': return '⚙️';
      case 'error': return '❌';
      case 'security': return '🔒';
      default: return '📝';
    }
  }
</script>

<div class="advanced-metrics">
  <div class="metrics-grid">
    <!-- System Performance -->
    <div class="metric-card">
      <h3>System Performance</h3>
      <div class="performance-grid">
        <div class="performance-item">
          <span class="label">CPU Usage</span>
          <div class="progress-bar">
            <div class="progress-fill" style="width: {systemMetrics.cpu}%"></div>
          </div>
          <span class="value">{systemMetrics.cpu}%</span>
        </div>
        <div class="performance-item">
          <span class="label">Memory</span>
          <div class="progress-bar">
            <div class="progress-fill" style="width: {systemMetrics.memory}%"></div>
          </div>
          <span class="value">{systemMetrics.memory}%</span>
        </div>
        <div class="performance-item">
          <span class="label">Disk Usage</span>
          <div class="progress-bar">
            <div class="progress-fill" style="width: {systemMetrics.disk}%"></div>
          </div>
          <span class="value">{systemMetrics.disk}%</span>
        </div>
        <div class="performance-item">
          <span class="label">Network</span>
          <div class="progress-bar">
            <div class="progress-fill" style="width: {systemMetrics.network}%"></div>
          </div>
          <span class="value">{systemMetrics.network}%</span>
        </div>
      </div>
    </div>

    <!-- CPU Usage Chart -->
    <div class="metric-card">
      <h3>CPU Usage Breakdown</h3>
      <ChartJS
        type="bar"
        data={cpuData}
        title="CPU Metrics"
        width={300}
        height={200}
        backgroundColor="rgba(34, 197, 94, 0.1)"
        borderColor="rgba(34, 197, 94, 1)"
        {loading}
      />
    </div>

    <!-- Memory Usage Chart -->
    <div class="metric-card">
      <h3>Memory Distribution</h3>
      <ChartJS
        type="doughnut"
        data={memoryData}
        title="Memory Usage"
        width={300}
        height={200}
        backgroundColor="rgba(168, 85, 247, 0.1)"
        borderColor="rgba(168, 85, 247, 1)"
        {loading}
      />
    </div>

    <!-- System Alerts -->
    <div class="metric-card alerts-card">
      <h3>System Alerts</h3>
      <div class="alerts-list">
        {#if alerts.length > 0}
          {#each alerts.slice(0, 5) as alert}
            <div class="alert-item {getSeverityColor(alert.severity)}">
              <div class="alert-header">
                <span class="alert-title">{alert.title}</span>
                <span class="alert-time">{new Date(alert.timestamp).toLocaleTimeString()}</span>
              </div>
              <p class="alert-message">{alert.message}</p>
            </div>
          {/each}
        {:else}
          <div class="no-alerts">
            <span>✅ No active alerts</span>
          </div>
        {/if}
      </div>
    </div>

    <!-- Recent Activity -->
    <div class="metric-card activity-card">
      <h3>Recent Activity</h3>
      <div class="activity-list">
        {#if recentActivity.length > 0}
          {#each recentActivity.slice(0, 8) as activity}
            <div class="activity-item">
              <span class="activity-icon">{getActivityIcon(activity.type)}</span>
              <div class="activity-content">
                <p class="activity-message">{activity.message}</p>
                <span class="activity-time">{new Date(activity.timestamp).toLocaleString()}</span>
              </div>
            </div>
          {/each}
        {:else}
          <div class="no-activity">
            <span>No recent activity</span>
          </div>
        {/if}
      </div>
    </div>

    <!-- API Performance -->
    {#if performanceData?.api}
      <div class="metric-card">
        <h3>API Performance</h3>
        <div class="api-metrics">
          <div class="api-metric">
            <span class="metric-label">Requests/min</span>
            <span class="metric-value">{performanceData.api.requestsPerMinute}</span>
          </div>
          <div class="api-metric">
            <span class="metric-label">Avg Response</span>
            <span class="metric-value">{performanceData.api.averageResponseTime}ms</span>
          </div>
          <div class="api-metric">
            <span class="metric-label">Error Rate</span>
            <span class="metric-value">{performanceData.api.errorRate}%</span>
          </div>
        </div>
        {#if performanceData.api.topEndpoints.length > 0}
          <div class="top-endpoints">
            <h4>Top Endpoints</h4>
            {#each performanceData.api.topEndpoints.slice(0, 3) as endpoint}
              <div class="endpoint-item">
                <span class="endpoint-path">{endpoint.endpoint}</span>
                <span class="endpoint-time">{endpoint.avgTime}ms</span>
              </div>
            {/each}
          </div>
        {/if}
      </div>
    {/if}
  </div>
</div>

<style>
  .advanced-metrics {
    width: 100%;
  }

  .metrics-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 1.5rem;
  }

  .metric-card {
    background: white;
    border-radius: 12px;
    padding: 1.5rem;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    border: 1px solid #e5e7eb;
  }

  .metric-card h3 {
    margin: 0 0 1rem 0;
    font-size: 1.125rem;
    font-weight: 600;
    color: #374151;
  }

  .performance-grid {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .performance-item {
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  .label {
    min-width: 80px;
    font-size: 0.875rem;
    color: #6b7280;
  }

  .progress-bar {
    flex: 1;
    height: 8px;
    background-color: #f3f4f6;
    border-radius: 4px;
    overflow: hidden;
  }

  .progress-fill {
    height: 100%;
    background-color: #3b82f6;
    transition: width 0.3s ease;
  }

  .value {
    min-width: 40px;
    text-align: right;
    font-weight: 600;
    color: #374151;
  }

  .alerts-list, .activity-list {
    max-height: 300px;
    overflow-y: auto;
  }

  .alert-item {
    padding: 0.75rem;
    border-radius: 8px;
    margin-bottom: 0.5rem;
  }

  .alert-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.25rem;
  }

  .alert-title {
    font-weight: 600;
    font-size: 0.875rem;
  }

  .alert-time {
    font-size: 0.75rem;
    opacity: 0.8;
  }

  .alert-message {
    margin: 0;
    font-size: 0.875rem;
    opacity: 0.9;
  }

  .activity-item {
    display: flex;
    align-items: flex-start;
    gap: 0.75rem;
    padding: 0.75rem 0;
    border-bottom: 1px solid #f3f4f6;
  }

  .activity-item:last-child {
    border-bottom: none;
  }

  .activity-icon {
    font-size: 1.25rem;
    margin-top: 0.125rem;
  }

  .activity-content {
    flex: 1;
  }

  .activity-message {
    margin: 0 0 0.25rem 0;
    font-size: 0.875rem;
    color: #374151;
  }

  .activity-time {
    font-size: 0.75rem;
    color: #6b7280;
  }

  .no-alerts, .no-activity {
    text-align: center;
    padding: 2rem;
    color: #6b7280;
    font-style: italic;
  }

  .api-metrics {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
    gap: 1rem;
    margin-bottom: 1rem;
  }

  .api-metric {
    text-align: center;
    padding: 0.75rem;
    background-color: #f9fafb;
    border-radius: 8px;
  }

  .metric-label {
    display: block;
    font-size: 0.75rem;
    color: #6b7280;
    margin-bottom: 0.25rem;
  }

  .metric-value {
    display: block;
    font-size: 1.25rem;
    font-weight: 600;
    color: #374151;
  }

  .top-endpoints h4 {
    margin: 0 0 0.75rem 0;
    font-size: 0.875rem;
    font-weight: 600;
    color: #374151;
  }

  .endpoint-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.5rem 0;
    border-bottom: 1px solid #f3f4f6;
  }

  .endpoint-item:last-child {
    border-bottom: none;
  }

  .endpoint-path {
    font-size: 0.875rem;
    color: #374151;
    font-family: monospace;
  }

  .endpoint-time {
    font-size: 0.875rem;
    color: #6b7280;
    font-weight: 600;
  }
</style>