<!-- ERROR BOUNDARY COMPONENT - Enhanced Error Handling -->
<!-- Provides graceful error handling and user feedback -->
<!-- Updated: 2025-01-09 - Added comprehensive error boundary -->

<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { page } from '$app/stores';
  import { logger } from '$lib/client/logger';
  import { Button } from '$lib/components/ui/button';
  import { AlertTriangle, RefreshCw, Home } from 'lucide-svelte';
  
  export let fallback: boolean = true;
  export let showDetails: boolean = false;
  export let onError: ((error: Error, errorInfo?: Record<string, unknown>) => void) | undefined = undefined;
  
  let hasError = false;
  let error: Error | null = null;
  let errorId: string = '';
  let retryCount = 0;
  let isRetrying = false;
  
  // Generate unique error ID for tracking
  const generateErrorId = () => {
    return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  };
  
  // Handle unhandled promise rejections
  const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
    handleError(new Error(`Unhandled Promise Rejection: ${event.reason}`));
  };
  
  // Handle JavaScript errors
  const handleJSError = (event: ErrorEvent) => {
    handleError(new Error(`${event.message} at ${event.filename}:${event.lineno}:${event.colno}`));
  };
  
  // Central error handler
  const handleError = (err: Error, errorInfo?: Record<string, unknown>) => {
    if (hasError) return; // Prevent error loops
    
    hasError = true;
    error = err;
    errorId = generateErrorId();
    
    // Log error details
    logger.error('Error boundary caught error', {
      errorId,
      message: err.message,
      stack: err.stack,
      url: $page.url.pathname,
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString(),
      retryCount,
      errorInfo
    });
    
    // Call custom error handler if provided
    if (onError) {
      try {
        onError(err, errorInfo);
      } catch (handlerError) {
        logger.error('Error in custom error handler', handlerError as Error);
      }
    }
    
    // Report to external service (if configured)
    reportError(err, errorId);
  };
  
  // Report error to external monitoring service
  const reportError = async (err: Error, id: string) => {
    try {
      // This could be Sentry, LogRocket, or custom endpoint
      await fetch('/api/errors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          errorId: id,
          message: err.message,
          stack: err.stack,
          url: $page.url.pathname,
          userAgent: navigator.userAgent,
          timestamp: new Date().toISOString(),
          retryCount
        })
      });
    } catch (reportingError) {
        logger.error('Failed to report error', reportingError as Error);
      }
  };
  
  // Retry mechanism
  const retry = async () => {
    if (isRetrying) return;
    
    isRetrying = true;
    retryCount++;
    
    logger.info('Retrying after error', { errorId, retryCount });
    
    // Wait a bit before retrying
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Reset error state
    hasError = false;
    error = null;
    errorId = '';
    isRetrying = false;
  };
  
  // Navigate to home
  const goHome = () => {
    window.location.href = '/';
  };
  
  // Reload page
  const reloadPage = () => {
    window.location.reload();
  };
  
  onMount(() => {
    // Set up global error handlers
    window.addEventListener('error', handleJSError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);
  });
  
  onDestroy(() => {
    // Clean up event listeners
    window.removeEventListener('error', handleJSError);
    window.removeEventListener('unhandledrejection', handleUnhandledRejection);
  });
  
  // Export error handler for manual use
  export const captureError = handleError;
</script>

{#if hasError && fallback}
  <div class="min-h-screen flex items-center justify-center bg-gray-50 px-4">
    <div class="max-w-md w-full bg-white rounded-lg shadow-lg p-6 text-center">
      <!-- Error Icon -->
      <div class="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
        <AlertTriangle class="h-6 w-6 text-red-600" />
      </div>
      
      <!-- Error Title -->
      <h1 class="text-xl font-semibold text-gray-900 mb-2">
        Something went wrong
      </h1>
      
      <!-- Error Message -->
      <p class="text-gray-600 mb-6">
        We're sorry, but something unexpected happened. Our team has been notified.
      </p>
      
      <!-- Error ID -->
      {#if errorId}
        <p class="text-xs text-gray-400 mb-4 font-mono">
          Error ID: {errorId}
        </p>
      {/if}
      
      <!-- Error Details (if enabled) -->
      {#if showDetails && error}
        <details class="text-left mb-4">
          <summary class="cursor-pointer text-sm text-gray-600 hover:text-gray-800">
            Technical Details
          </summary>
          <div class="mt-2 p-3 bg-gray-100 rounded text-xs font-mono text-gray-700 overflow-auto max-h-32">
            <div class="mb-2">
              <strong>Message:</strong> {error.message}
            </div>
            {#if error.stack}
              <div>
                <strong>Stack:</strong>
                <pre class="whitespace-pre-wrap">{error.stack}</pre>
              </div>
            {/if}
          </div>
        </details>
      {/if}
      
      <!-- Action Buttons -->
      <div class="space-y-3">
        <Button 
          onclick={retry}
          disabled={isRetrying}
          class="w-full"
          variant="default"
        >
          {#if isRetrying}
            <RefreshCw class="h-4 w-4 mr-2 animate-spin" />
            Retrying...
          {:else}
            <RefreshCw class="h-4 w-4 mr-2" />
            Try Again
          {/if}
        </Button>
        
        <div class="flex space-x-3">
          <Button 
            onclick={goHome} 
            variant="outline"
            class="flex-1"
          >
            <Home class="h-4 w-4 mr-2" />
            Go Home
          </Button>
          
          <Button 
            onclick={reloadPage} 
            variant="outline"
            class="flex-1"
          >
            <RefreshCw class="h-4 w-4 mr-2" />
            Reload
          </Button>
        </div>
      </div>
      
      <!-- Retry Count -->
      {#if retryCount > 0}
        <p class="text-xs text-gray-400 mt-4">
          Retry attempts: {retryCount}
        </p>
      {/if}
    </div>
  </div>
{:else}
  <slot />
{/if}

<style>
  /* Ensure error boundary takes full height */
  :global(.error-boundary-container) {
    min-height: 100vh;
  }
</style>