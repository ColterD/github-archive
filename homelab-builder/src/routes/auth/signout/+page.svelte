<!-- HOMELAB HARDWARE PLATFORM - CUSTOM SIGN OUT PAGE -->
<script lang="ts">
  import { signOut } from "@auth/sveltekit/client"
  import { page } from "$app/stores"
  import { Button } from "$lib/components/ui/button"
  import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "$lib/components/ui/card"
  import { LogOut, Server, Home, ArrowLeft } from "lucide-svelte"
  import { onMount } from "svelte"
  
  let loading = false
  let autoSignOut = false
  
  onMount(() => {
    // Check if auto sign out is requested
    if ($page.url.searchParams.get("auto") === "true") {
      autoSignOut = true
      handleSignOut()
    }
  })
  
  const handleSignOut = async () => {
    loading = true
    
    try {
      await signOut({
        callbackUrl: $page.url.searchParams.get("callbackUrl") || "/",
      })
    } catch {
      // Error will be handled by Auth.js
      loading = false
    }
  }
  
  const goBack = () => {
    window.history.back()
  }
</script>

<svelte:head>
  <title>Sign Out - Homelab Hardware Platform</title>
  <meta name="description" content="Sign out of your homelab hardware platform account" />
</svelte:head>

<div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-100 dark:from-gray-900 dark:to-gray-800 p-4">
  <div class="w-full max-w-md space-y-8">
    <!-- Header -->
    <div class="text-center">
      <div class="flex justify-center mb-4">
        <div class="w-16 h-16 bg-red-600 rounded-xl flex items-center justify-center">
          <LogOut class="w-8 h-8 text-white" />
        </div>
      </div>
      
      {#if autoSignOut}
        <h1 class="text-3xl font-bold text-gray-900 dark:text-white">
          Signing Out...
        </h1>
        <p class="text-gray-600 dark:text-gray-300 mt-2">
          Please wait while we securely sign you out
        </p>
      {:else}
        <h1 class="text-3xl font-bold text-gray-900 dark:text-white">
          Sign Out
        </h1>
        <p class="text-gray-600 dark:text-gray-300 mt-2">
          Are you sure you want to sign out of your account?
        </p>
      {/if}
    </div>
    
    {#if !autoSignOut}
      <!-- Sign Out Confirmation Card -->
      <Card class="border-0 shadow-xl">
        <CardHeader>
          <CardTitle class="text-xl text-center">Confirm Sign Out</CardTitle>
          <CardDescription class="text-center">
            You'll need to sign in again to access your account
          </CardDescription>
        </CardHeader>
        
        <CardContent class="space-y-4">
          <!-- Sign Out Button -->
          <Button
            class="w-full h-12 text-base font-medium"
            variant="destructive"
            onclick={handleSignOut}
            disabled={loading}
          >
            <LogOut class="w-5 h-5 mr-3" />
            {#if loading}
              <span class="animate-spin">⏳</span>
              <span class="ml-2">Signing out...</span>
            {:else}
              Sign Out
            {/if}
          </Button>
          
          <!-- Cancel Button -->
          <Button
            class="w-full h-12 text-base font-medium"
            variant="outline"
            onclick={goBack}
            disabled={loading}
          >
            <ArrowLeft class="w-5 h-5 mr-3" />
            Cancel
          </Button>
          
          <!-- Divider -->
          <div class="relative my-6">
            <div class="absolute inset-0 flex items-center">
              <span class="w-full border-t border-gray-300 dark:border-gray-600"></span>
            </div>
            <div class="relative flex justify-center text-sm">
              <span class="bg-white dark:bg-gray-800 px-2 text-gray-500">
                Quick Actions
              </span>
            </div>
          </div>
          
          <!-- Quick Actions -->
          <div class="grid grid-cols-1 gap-3">
            <Button
              class="w-full justify-start"
              variant="ghost"
              onclick={() => window.location.href = "/"}
            >
              <Home class="w-4 h-4 mr-2" />
              Go to Homepage
            </Button>
            <Button
              class="w-full justify-start"
              variant="ghost"
              onclick={() => window.location.href = "/hardware"}
            >
              <Server class="w-4 h-4 mr-2" />
              Browse Hardware
            </Button>
          </div>
        </CardContent>
      </Card>
    {:else}
      <!-- Auto Sign Out Loading -->
      <Card class="border-0 shadow-xl">
        <CardContent class="pt-6">
          <div class="flex items-center justify-center space-x-3">
            <div class="animate-spin text-2xl">⏳</div>
            <span class="text-lg font-medium">Signing out securely...</span>
          </div>
        </CardContent>
      </Card>
    {/if}
    
    <!-- Footer -->
    <div class="text-center text-sm text-gray-500 dark:text-gray-400">
      <p>
        Thank you for using Homelab Hardware Platform
      </p>
    </div>
  </div>
</div>

<style>
  .animate-spin {
    animation: spin 1s linear infinite;
  }
  
  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
</style>