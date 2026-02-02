<script lang="ts">
  import '../app.css';
  import { ConnectionStatus } from '$lib/components/ui';
  import { LiveNotifications } from '$lib/components/ui';
  import ErrorBoundary from '$lib/components/ErrorBoundary.svelte';
  import { onMount } from 'svelte';
  import { performanceMonitor } from '$lib/client/performance';
  import { logger } from '$lib/client/logger';

  onMount(() => {
    // Initialize performance monitoring
    logger.info('Application initialized', {
      url: window.location.href,
      userAgent: navigator.userAgent,
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight,
      },
    });

    // Mark application start for performance measurement
    performanceMonitor.markStart('app_lifecycle');

    return () => {
      // Mark application end
      performanceMonitor.markEnd('app_lifecycle');
    };
  });
</script>

<ErrorBoundary>
  <div id="app">
    <ConnectionStatus />
    <LiveNotifications />
    <main>
      <slot />
    </main>
  </div>
</ErrorBoundary>