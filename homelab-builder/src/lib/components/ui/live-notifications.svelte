<script lang="ts">
  import { onMount } from 'svelte';
  import { fade, fly } from 'svelte/transition';
  import { websocketClient, notifications } from '$lib/stores/websocket.js';
  import { Bell, X, TrendingDown, Users, Heart } from 'lucide-svelte';

  let showPanel = false;
  let unreadCount = 0;

  $: {
    unreadCount = $notifications.length;
  }

  function togglePanel() {
    showPanel = !showPanel;
  }

  function clearNotifications() {
    websocketClient.clearNotifications();
  }

  function removeNotification(id: string) {
    notifications.update(items => items.filter(item => item.id !== id));
  }

  function getNotificationIcon(type: string) {
    switch (type) {
      case 'price_drop_alert':
        return TrendingDown;
      case 'new_build':
        return Users;
      case 'build_like':
        return Heart;
      default:
        return Bell;
    }
  }

  function getNotificationColor(type: string) {
    switch (type) {
      case 'price_drop_alert':
        return 'text-green-500';
      case 'new_build':
        return 'text-blue-500';
      case 'build_like':
        return 'text-red-500';
      default:
        return 'text-gray-500';
    }
  }

  onMount(() => {
    // Close panel when clicking outside
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Element;
      if (showPanel && !target.closest('.notification-panel')) {
        showPanel = false;
      }
    }

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  });
</script>

<!-- Notification Bell Button -->
<div class="relative notification-panel">
  <button
    onclick={togglePanel}
    class="relative p-2 text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white transition-colors"
    aria-label="Notifications"
  >
    <Bell class="h-6 w-6" />
    {#if unreadCount > 0}
      <span
        class="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center"
        transition:fade={{ duration: 200 }}
      >
        {Math.min(unreadCount, 9)}
      </span>
    {/if}
  </button>

  <!-- Notification Panel -->
  {#if showPanel}
    <div
      class="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50"
      transition:fly={{ y: -10, duration: 200 }}
    >
      <!-- Header -->
      <div class="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Notifications</h3>
        {#if $notifications.length > 0}
          <button
            onclick={clearNotifications}
            class="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            Clear all
          </button>
        {/if}
      </div>

      <!-- Notifications List -->
      <div class="max-h-96 overflow-y-auto">
        {#if $notifications.length === 0}
          <div class="p-4 text-center text-gray-500 dark:text-gray-400">
            <Bell class="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No new notifications</p>
          </div>
        {:else}
          {#each $notifications as notification (notification.id)}
            <div
              class="p-4 border-b border-gray-100 dark:border-gray-700 last:border-b-0 hover:bg-gray-50 dark:hover:bg-gray-750"
              transition:fly={{ x: 10, duration: 200 }}
            >
              <div class="flex items-start justify-between">
                <div class="flex items-start space-x-3">
                  <div class={`mt-1 ${getNotificationColor(notification.type)}`}>
                    <svelte:component this={getNotificationIcon(notification.type)} class="h-5 w-5" />
                  </div>
                  <div class="flex-1 min-w-0">
                    {#if notification.type === 'price_drop_alert'}
                      <p class="text-sm font-medium text-gray-900 dark:text-white">
                        Price Drop Alert!
                      </p>
                      <p class="text-sm text-gray-500 dark:text-gray-400">
                        Hardware item dropped {Math.abs(parseFloat(notification.payload.change as string))}%
                      </p>
                    {:else if notification.type === 'new_build'}
                      <p class="text-sm font-medium text-gray-900 dark:text-white">
                        {notification.payload.title}
                      </p>
                      <p class="text-sm text-gray-500 dark:text-gray-400">
                        A new build was just published
                      </p>
                    {:else if notification.type === 'build_like'}
                      <p class="text-sm font-medium text-gray-900 dark:text-white">
                        Build liked!
                      </p>
                      <p class="text-sm text-gray-500 dark:text-gray-400">
                        Someone liked your build
                      </p>
                    {:else}
                      <p class="text-sm font-medium text-gray-900 dark:text-white">
                        {notification.type}
                      </p>
                      <p class="text-sm text-gray-500 dark:text-gray-400">
                        {JSON.stringify(notification.payload)}
                      </p>
                    {/if}
                    <p class="text-xs text-gray-400 dark:text-gray-500 mt-1">
                      {new Date(notification.timestamp).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
                <button
                  onclick={() => removeNotification(notification.id)}
                  class="ml-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  aria-label="Dismiss notification"
                >
                  <X class="h-4 w-4" />
                </button>
              </div>
            </div>
          {/each}
        {/if}
      </div>
    </div>
  {/if}
</div>

<style>
  .notification-panel {
    /* Ensure the panel stays on top of other elements */
    z-index: 100;
  }
</style>