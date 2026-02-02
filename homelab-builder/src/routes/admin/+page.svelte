<!-- HOMELAB HARDWARE PLATFORM - ENHANCED ADMIN DASHBOARD -->
<script lang="ts">
  import { onMount, onDestroy } from "svelte"
  import { browser } from "$app/environment"
  import { Button } from "$lib/components/ui/button"
  import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "$lib/components/ui/card"
  import { Badge } from "$lib/components/ui/badge"
  import LazyLoader from "$lib/components/LazyLoader.svelte"
  
  // Optimize icon imports - only import what we need upfront
  import { 
    Users, 
    Server, 
    Activity, 
    AlertCircle,
    CheckCircle,
    Shield,
    RefreshCw,
    Settings,
    TrendingUp, 
    BarChart3,
    Search,
    Zap,
    Database,
    Network,
    Clock
  } from "lucide-svelte"
  
  import { 
    dashboardMetrics,
    searchAnalytics,
    userAnalytics,
    performanceMetrics,
    realTimeMetrics,
    recentActivity,
    systemAlerts,
    isLoadingDashboard,
    isLoadingAnalytics,
    isConnected,
    connectionError,
    autoRefresh,
    lastUpdated,
    adminStore
  } from '$lib/stores/admin'
  
  export let data
  $: session = data.session
  
  let selectedTimeframe: '24h' | '7d' | '30d' = '24h'
  let refreshTimer: NodeJS.Timeout | null = null
  
  // Chart data derived from analytics
  $: userGrowthData = $userAnalytics?.topPages?.map((point: { page: string; views: number }) => ({
    label: point.page,
    value: point.views
  })) || []
  
  $: searchTrendsData = $searchAnalytics?.searchTrends?.map((point: { date: string; searches: number }) => ({
    label: point.date,
    value: point.searches
  })) || []
  
  $: performanceChartData = $performanceMetrics?.api?.topEndpoints?.map((point: { endpoint: string; avgTime: number }) => ({
    label: point.endpoint,
    value: point.avgTime
  })) || []

  // Lazy loading functions for heavy components
  const loadChart = () => import("$lib/components/admin/charts/ChartJS.svelte")
  const loadAdvancedMetrics = () => import("$lib/components/admin/charts/AdvancedMetrics.svelte")
  
  const refreshData = async (force = false) => {
    try {
      await adminStore.fetchAllMetrics(force)
      await adminStore.fetchSearchAnalytics(selectedTimeframe)
      await adminStore.fetchUserAnalytics(selectedTimeframe)
    } catch {
      // Failed to refresh data
    }
  }
  
  const handleTimeframeChange = (timeframe: '24h' | '7d' | '30d') => {
    selectedTimeframe = timeframe
    refreshData()
  }
  
  onMount(() => {
    // Initial data fetch (but don't auto-start refresh to avoid rate limiting)
    adminStore.fetchAllMetrics()
    
    // Track admin dashboard view
    adminStore.trackAdminAction('dashboard_view', {
      timestamp: new Date().toISOString(),
      userId: session?.user?.id
    })
    
    return () => {
      adminStore.stopAutoRefresh()
    }
  })
  
  onDestroy(() => {
    if (refreshTimer) {
      clearInterval(refreshTimer)
    }
  })
  
  // Format helper functions
  const formatNumber = (num: number): string => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M'
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K'
    return num.toString()
  }
  
  const formatPercentage = (num: number): string => {
    return (num > 0 ? '+' : '') + num.toFixed(1) + '%'
  }
  
  const getTrendIcon = (change: number) => {
    return change > 0 ? lazyIcons.TrendingUp || TrendingUp : lazyIcons.TrendingDown || TrendingUp
  }
  
  const getTrendColor = (change: number): string => {
    return change > 0 ? 'text-green-600' : change < 0 ? 'text-red-600' : 'text-gray-600'
  }
</script>

<svelte:head>
  <title>Admin Dashboard - Homelab Hardware Platform</title>
  <meta name="description" content="Real-time administrative dashboard for system monitoring and management" />
</svelte:head>

<div class="container mx-auto px-4 py-8 max-w-7xl">
  <!-- Header -->
  <div class="flex flex-col md:flex-row items-start md:items-center justify-between mb-8">
    <div>
      <h1 class="text-3xl font-bold">Admin Dashboard</h1>
      <p class="text-muted-foreground mt-2">
        Real-time system overview and analytics
      </p>
      {#if $lastUpdated}
        <p class="text-xs text-muted-foreground mt-1">
          Last updated: {new Date($lastUpdated).toLocaleTimeString()}
        </p>
      {/if}
    </div>
    
    <div class="flex items-center gap-3 mt-4 md:mt-0">
      <!-- Connection Status -->
      <Badge variant={$isConnected ? "default" : "destructive"} class="flex items-center gap-1">
        <div class="w-2 h-2 rounded-full {$isConnected ? 'bg-green-400' : 'bg-red-400'} animate-pulse"></div>
        {$isConnected ? 'Connected' : 'Disconnected'}
      </Badge>
      
      <!-- Admin Role Badge -->
      <Badge variant="secondary" class="flex items-center gap-1">
        <Shield class="w-3 h-3" />
        {session?.user?.role || 'ADMIN'}
      </Badge>
      
      <!-- Auto-refresh Toggle -->
      <Button 
        variant="outline" 
        size="sm" 
        onclick={() => autoRefresh.update(val => !val)}
        class={$autoRefresh ? 'bg-green-50 border-green-200' : ''}
      >
        <RefreshCw class="w-4 h-4 mr-2 {$autoRefresh ? 'animate-spin' : ''}" />
        Auto-refresh: {$autoRefresh ? 'On' : 'Off'}
      </Button>
      
      <!-- Manual Refresh -->
      <Button variant="outline" size="sm" onclick={() => refreshData(true)} disabled={$isLoadingDashboard}>
        <RefreshCw class="w-4 h-4 mr-2 {$isLoadingDashboard ? 'animate-spin' : ''}" />
        Refresh
      </Button>
      
      <Button size="sm">
        <Settings class="w-4 h-4 mr-2" />
        Settings
      </Button>
    </div>
  </div>
  
  <!-- Connection Error Alert -->
  {#if $connectionError}
    <div class="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
      <div class="flex items-center gap-2">
        <AlertCircle class="w-5 h-5 text-red-600" />
        <span class="font-medium text-red-800 dark:text-red-200">Connection Error</span>
      </div>
      <p class="text-sm text-red-700 dark:text-red-300 mt-1">{$connectionError}</p>
    </div>
  {/if}
  
  <!-- Real-time Metrics Bar -->
  {#if $realTimeMetrics}
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
      <div class="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
        <div class="text-sm text-blue-600 dark:text-blue-400">Active Users</div>
        <div class="text-2xl font-bold text-blue-800 dark:text-blue-200">
          {$realTimeMetrics.activeUsers}
        </div>
      </div>
      
      <div class="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
        <div class="text-sm text-green-600 dark:text-green-400">Requests/sec</div>
        <div class="text-2xl font-bold text-green-800 dark:text-green-200">
          {$realTimeMetrics.requestsPerSecond}
        </div>
      </div>
      
      <div class="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
        <div class="text-sm text-purple-600 dark:text-purple-400">Response Time</div>
        <div class="text-2xl font-bold text-purple-800 dark:text-purple-200">
          {$realTimeMetrics.responseTime}ms
        </div>
      </div>
      
      <div class="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-4">
        <div class="text-sm text-orange-600 dark:text-orange-400">Errors</div>
        <div class="text-2xl font-bold text-orange-800 dark:text-orange-200">
          {$realTimeMetrics.errorCount}
        </div>
      </div>
    </div>
  {/if}
  
  <!-- Key Metrics Grid -->
  <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
    <!-- Users -->
    <Card>
      <CardContent class="p-6">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-muted-foreground">Total Users</p>
            <p class="text-2xl font-bold">
              {$dashboardMetrics ? formatNumber($dashboardMetrics.users.total) : '0'}
            </p>
            <p class="text-xs font-medium text-green-600">
              {$dashboardMetrics?.users.growth || '+0%'} from last month
            </p>
          </div>
          <div class="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
            <Users class="w-6 h-6 text-blue-600" />
          </div>
        </div>
        <div class="mt-4 flex items-center gap-4 text-sm">
          <span class="text-muted-foreground">Today: +{$dashboardMetrics?.users.newToday || 0}</span>
          <span class="text-green-600">Active: {$dashboardMetrics?.users.activeNow || 0}</span>
        </div>
      </CardContent>
    </Card>
    
    <!-- Hardware Items -->
    <Card>
      <CardContent class="p-6">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-muted-foreground">Hardware Items</p>
            <p class="text-2xl font-bold">
              {$dashboardMetrics ? formatNumber($dashboardMetrics.hardware.total) : '0'}
            </p>
            <p class="text-xs text-yellow-600 font-medium">
              {$dashboardMetrics?.hardware.pending || 0} pending review
            </p>
          </div>
          <div class="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
            <Server class="w-6 h-6 text-green-600" />
          </div>
        </div>
        <div class="mt-4 flex items-center gap-4 text-sm">
          <span class="text-green-600">Active: {$dashboardMetrics?.hardware.active || 0}</span>
          <span class="text-muted-foreground">Archived: {$dashboardMetrics?.hardware.archived || 0}</span>
        </div>
      </CardContent>
    </Card>
    
    <!-- Community Builds -->
    <Card>
      <CardContent class="p-6">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-muted-foreground">Community Builds</p>
            <p class="text-2xl font-bold">
              {$dashboardMetrics ? formatNumber($dashboardMetrics.builds.totalBuilds) : '0'}
            </p>
            {#if $dashboardMetrics?.builds.buildsGrowth}
              <p class="text-xs font-medium {getTrendColor($dashboardMetrics.builds.buildsGrowth)}">
                <svelte:component this={getTrendIcon($dashboardMetrics.builds.buildsGrowth)} class="w-3 h-3 inline mr-1" />
                {formatPercentage($dashboardMetrics.builds.buildsGrowth)} this week
              </p>
            {/if}
          </div>
          <div class="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
            <BarChart3 class="w-6 h-6 text-purple-600" />
          </div>
        </div>
        <div class="mt-4 flex items-center gap-4 text-sm">
          <span class="text-green-600">Published: {$dashboardMetrics?.builds.publishedBuilds || 0}</span>
          <span class="text-muted-foreground">Drafts: {$dashboardMetrics?.builds.draftBuilds || 0}</span>
        </div>
      </CardContent>
    </Card>
    
    <!-- Search Performance -->
    <Card>
      <CardContent class="p-6">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-muted-foreground">Search Performance</p>
            <p class="text-2xl font-bold">
              {$searchAnalytics ? formatNumber($searchAnalytics.totalSearches) : '0'}
            </p>
            <p class="text-xs text-blue-600 font-medium">
              Avg: {$searchAnalytics?.averageResponseTime || 0}ms
            </p>
          </div>
          <div class="w-12 h-12 bg-orange-100 dark:bg-orange-900 rounded-lg flex items-center justify-center">
            <Search class="w-6 h-6 text-orange-600" />
          </div>
        </div>
        <div class="mt-4 flex items-center gap-4 text-sm">
          <span class="text-green-600">Success: {$searchAnalytics?.successRate || 0}%</span>
          <span class="text-muted-foreground">Zero results: {$searchAnalytics?.zeroResultsRate || 0}%</span>
        </div>
      </CardContent>
    </Card>
  </div>
  
  <!-- Analytics Timeframe Controls -->
  <div class="flex items-center gap-2 mb-6">
    <span class="text-sm font-medium">Analytics Timeframe:</span>
    {#each ['24h', '7d', '30d'] as timeframe (timeframe)}
      <Button
        variant={selectedTimeframe === timeframe ? 'default' : 'outline'}
        size="sm"
        onclick={() => handleTimeframeChange(timeframe as '24h' | '7d' | '30d')}
      >
        {timeframe === '24h' ? '24 Hours' : timeframe === '7d' ? '7 Days' : '30 Days'}
      </Button>
    {/each}
  </div>
  
  <!-- Charts Section -->
  <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
    <!-- User Growth Chart -->
    <Card>
      <CardHeader>
        <CardTitle class="flex items-center gap-2">
          <Users class="w-5 h-5" />
          User Growth
        </CardTitle>
        <CardDescription>
          New user registrations over time
        </CardDescription>
      </CardHeader>
      <CardContent>
        <LazyLoader
          componentLoader={loadChart}
          fallback="Loading user growth chart..."
          threshold={0.2}
          let:Component
        >
          {#if userGrowthData.length > 0}
            <svelte:component 
              this={Component} 
              data={userGrowthData}
              title="New Users"
              height="300px"
              type="line"
              backgroundColor="rgba(59, 130, 246, 0.1)"
              borderColor="rgba(59, 130, 246, 1)"
            />
          {:else}
            <div class="h-[300px] flex items-center justify-center text-muted-foreground">
              {#if $isLoadingAnalytics}
                <div class="animate-pulse">Loading user data...</div>
              {:else}
                <div>No user growth data available</div>
              {/if}
            </div>
          {/if}
        </LazyLoader>
      </CardContent>
    </Card>
    
    <!-- Search Trends Chart -->
    <Card>
      <CardHeader>
        <CardTitle class="flex items-center gap-2">
          <Search class="w-5 h-5" />
          Search Trends
        </CardTitle>
        <CardDescription>
          Search volume and patterns
        </CardDescription>
      </CardHeader>
      <CardContent>
        <LazyLoader
          componentLoader={loadChart}
          fallback="Loading search trends chart..."
          threshold={0.2}
          let:Component
        >
          {#if searchTrendsData.length > 0}
            <svelte:component 
              this={Component} 
              data={searchTrendsData}
              title="Searches"
              height="300px"
              type="line"
              backgroundColor="rgba(34, 197, 94, 0.1)"
              borderColor="rgba(34, 197, 94, 1)"
            />
          {:else}
            <div class="h-[300px] flex items-center justify-center text-muted-foreground">
              {#if $isLoadingAnalytics}
                <div class="animate-pulse">Loading search data...</div>
              {:else}
                <div>No search trend data available</div>
              {/if}
            </div>
          {/if}
        </LazyLoader>
      </CardContent>
    </Card>
  </div>
  
  <!-- Performance and Activity Section -->
  <div class="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
    <!-- Performance Metrics -->
    <Card class="lg:col-span-2">
      <CardHeader>
        <CardTitle class="flex items-center gap-2">
          <Zap class="w-5 h-5" />
          Performance Metrics
        </CardTitle>
        <CardDescription>
          Real-time system performance and database metrics
        </CardDescription>
      </CardHeader>
      <CardContent>
        <LazyLoader
          componentLoader={loadChart}
          fallback="Loading performance chart..."
          threshold={0.2}
          let:Component
        >
          {#if performanceChartData.length > 0}
            <svelte:component 
              this={Component} 
              data={performanceChartData}
              title="Response Time (ms)"
              height="250px"
              type="bar"
              backgroundColor="rgba(168, 85, 247, 0.1)"
              borderColor="rgba(168, 85, 247, 1)"
            />
          {:else}
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div class="text-center p-4 bg-muted/50 rounded-lg">
                <div class="text-2xl font-bold text-green-600">
                  {$performanceMetrics?.api?.averageResponseTime || 0}ms
                </div>
                <div class="text-sm text-muted-foreground">Avg Response Time</div>
                <div class="w-full bg-background rounded-full h-2 mt-2">
                  <div class="bg-green-500 h-2 rounded-full" style="width: 85%"></div>
                </div>
              </div>
              
              <div class="text-center p-4 bg-muted/50 rounded-lg">
                <div class="text-2xl font-bold text-blue-600">
                  {formatNumber($performanceMetrics?.database?.queryPerformance?.average || 0)}
                </div>
                <div class="text-sm text-muted-foreground">Database Queries</div>
                <div class="w-full bg-background rounded-full h-2 mt-2">
                  <div class="bg-blue-500 h-2 rounded-full" style="width: 70%"></div>
                </div>
              </div>
              
              <div class="text-center p-4 bg-muted/50 rounded-lg">
                <div class="text-2xl font-bold text-green-600">
                  {$performanceMetrics?.api?.errorRate || 0}%
                </div>
                <div class="text-sm text-muted-foreground">Error Rate</div>
                <div class="w-full bg-background rounded-full h-2 mt-2">
                  <div class="bg-green-500 h-2 rounded-full" style="width: 98%"></div>
                </div>
              </div>
            </div>
          {/if}
        </LazyLoader>
      </CardContent>
    </Card>
    
    <!-- Quick Actions -->
    <Card>
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
        <CardDescription>
          Common administrative tasks
        </CardDescription>
      </CardHeader>
      <CardContent class="space-y-3">
        <Button class="w-full justify-start" variant="outline">
          <Users class="w-4 h-4 mr-2" />
          Manage Users ({$dashboardMetrics?.users?.total || 0})
        </Button>
        <Button class="w-full justify-start" variant="outline">
          <Server class="w-4 h-4 mr-2" />
          Review Hardware ({$dashboardMetrics?.hardware?.pending || 0})
        </Button>
        <Button class="w-full justify-start" variant="outline">
          <Shield class="w-4 h-4 mr-2" />
          Content Moderation ({$systemAlerts.length})
        </Button>
        <Button class="w-full justify-start" variant="outline">
          <Database class="w-4 h-4 mr-2" />
          Database Health
        </Button>
        <Button class="w-full justify-start" variant="outline">
          <BarChart3 class="w-4 h-4 mr-2" />
          Advanced Analytics
        </Button>
        <Button class="w-full justify-start" variant="outline">
          <Network class="w-4 h-4 mr-2" />
          System Status
        </Button>
      </CardContent>
    </Card>
  </div>
  
  <!-- Advanced Metrics Section -->
  <Card class="mb-8">
    <CardHeader>
      <CardTitle class="flex items-center gap-2">
        <BarChart3 class="w-5 h-5" />
        Advanced System Metrics
      </CardTitle>
      <CardDescription>
        Detailed performance monitoring and system analytics
      </CardDescription>
    </CardHeader>
    <CardContent>
      <LazyLoader
        componentLoader={loadAdvancedMetrics}
        fallback="Loading advanced metrics..."
        threshold={0.1}
        let:Component
      >
        <svelte:component 
          this={Component} 
          performanceData={$performanceMetrics}
          alerts={$systemAlerts}
          recentActivity={$recentActivity}
          loading={$isLoadingDashboard}
        />
      </LazyLoader>
    </CardContent>
  </Card>
  
  <!-- Recent Activity -->
  <Card>
    <CardHeader>
      <CardTitle class="flex items-center gap-2">
        <Clock class="w-5 h-5" />
        Recent Activity
      </CardTitle>
      <CardDescription>
        Latest system events and user actions
      </CardDescription>
    </CardHeader>
    <CardContent>
      <div class="space-y-4">
        {#if $recentActivity.length > 0}
          {#each $recentActivity as activity (activity.id)}
            <div class="flex items-start gap-3 p-3 rounded-lg border">
              {#if activity.severity === 'error'}
                <AlertCircle class="w-5 h-5 text-red-500 mt-0.5" />
              {:else if activity.severity === 'warning'}
                <AlertCircle class="w-5 h-5 text-yellow-500 mt-0.5" />
              {:else if activity.severity === 'success'}
                <CheckCircle class="w-5 h-5 text-green-500 mt-0.5" />
              {:else}
                <Activity class="w-5 h-5 text-blue-500 mt-0.5" />
              {/if}
              
              <div class="flex-1">
                <p class="font-medium">{activity.message}</p>
                <p class="text-sm text-muted-foreground">
                  {new Date(activity.timestamp).toLocaleString()}
                </p>
              </div>
              
              <Badge 
                variant={activity.severity === 'error' ? 'destructive' : 
                        activity.severity === 'warning' ? 'secondary' : 
                        activity.severity === 'success' ? 'default' : 'outline'}
                class="text-xs"
              >
                {activity.type}
              </Badge>
            </div>
          {/each}
        {:else}
          <div class="text-center py-8 text-muted-foreground">
            <Activity class="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No recent activity to display</p>
            {#if $isLoadingDashboard}
              <p class="text-sm mt-2 animate-pulse">Loading activity data...</p>
            {/if}
          </div>
        {/if}
      </div>
    </CardContent>
  </Card>
</div>

<style>
  :global(.animate-spin) {
    animation: spin 1s linear infinite;
  }
  
  :global(.animate-pulse) {
    animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
  }
  
  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
  
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }
</style>