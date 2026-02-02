<script lang="ts">
  import { connectionState, websocketClient } from '$lib/stores/websocket.js';
  import { Wifi, WifiOff, AlertCircle } from 'lucide-svelte';
  import { fade } from 'svelte/transition';

  function reconnect() {
    websocketClient.connect();
  }
</script>

{#if !$connectionState.connected}
  <div
    class="fixed bottom-4 left-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-3 z-50"
    transition:fade={{ duration: 200 }}
  >
    <div class="flex items-center space-x-3">
      {#if $connectionState.connecting}
        <div class="animate-spin">
          <Wifi class="h-5 w-5 text-yellow-500" />
        </div>
        <div>
          <p class="text-sm font-medium text-gray-900 dark:text-white">Connecting...</p>
          <p class="text-xs text-gray-500 dark:text-gray-400">Establishing real-time connection</p>
        </div>
      {:else if $connectionState.error}
        <AlertCircle class="h-5 w-5 text-red-500" />
        <div class="flex-1">
          <p class="text-sm font-medium text-gray-900 dark:text-white">Connection Error</p>
          <p class="text-xs text-gray-500 dark:text-gray-400">{$connectionState.error}</p>
        </div>
        <button
          onclick={reconnect}
          class="px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
        >
          Retry
        </button>
      {:else}
        <WifiOff class="h-5 w-5 text-gray-500" />
        <div class="flex-1">
          <p class="text-sm font-medium text-gray-900 dark:text-white">Offline</p>
          <p class="text-xs text-gray-500 dark:text-gray-400">
            Real-time features unavailable
            {#if $connectionState.reconnectAttempts > 0}
              (Attempt {$connectionState.reconnectAttempts}/5)
            {/if}
          </p>
        </div>
        <button
          onclick={reconnect}
          class="px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
        >
          Connect
        </button>
      {/if}
    </div>
  </div>
{/if}