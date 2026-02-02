<!-- HOMELAB HARDWARE PLATFORM - CUSTOM SIGN IN PAGE -->
<script lang="ts">
  import { signIn } from "@auth/sveltekit/client"
  import { page } from "$app/stores"
  import { Button } from "$lib/components/ui/button"
  import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "$lib/components/ui/card"
  import { Github, Mail, Server, Shield, Users } from "lucide-svelte"
  
  let loading = false
  let provider = ""
  
  const handleSignIn = async (selectedProvider: string) => {
    loading = true
    provider = selectedProvider
    
    try {
      await signIn(selectedProvider, {
        callbackUrl: $page.url.searchParams.get("callbackUrl") || "/",
      })
    } catch {
      // Error will be handled by Auth.js and redirected to error page
      loading = false
      provider = ""
    }
  }
</script>

<svelte:head>
  <title>Sign In - Homelab Hardware Platform</title>
  <meta name="description" content="Sign in to access the homelab hardware platform" />
</svelte:head>

<div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
  <div class="w-full max-w-md space-y-8">
    <!-- Header -->
    <div class="text-center">
      <div class="flex justify-center mb-4">
        <div class="w-16 h-16 bg-blue-600 rounded-xl flex items-center justify-center">
          <Server class="w-8 h-8 text-white" />
        </div>
      </div>
      <h1 class="text-3xl font-bold text-gray-900 dark:text-white">
        Welcome Back
      </h1>
      <p class="text-gray-600 dark:text-gray-300 mt-2">
        Sign in to your homelab hardware platform account
      </p>
    </div>
    
    <!-- Sign In Card -->
    <Card class="border-0 shadow-xl">
      <CardHeader>
        <CardTitle class="text-xl text-center">Choose Your Sign In Method</CardTitle>
        <CardDescription class="text-center">
          Secure authentication powered by industry-standard OAuth providers
        </CardDescription>
      </CardHeader>
      
      <CardContent class="space-y-4">
        <!-- GitHub Sign In -->
        <Button
          class="w-full h-12 text-base font-medium relative"
          variant="outline"
          onclick={() => handleSignIn("github")}
          disabled={loading}
        >
          <Github class="w-5 h-5 mr-3" />
          {#if loading && provider === "github"}
            <span class="animate-spin">⏳</span>
            <span class="ml-2">Signing in...</span>
          {:else}
            Continue with GitHub
          {/if}
        </Button>
        
        <!-- Google Sign In -->
        <Button
          class="w-full h-12 text-base font-medium relative"
          variant="outline"
          onclick={() => handleSignIn("google")}
          disabled={loading}
        >
          <Mail class="w-5 h-5 mr-3" />
          {#if loading && provider === "google"}
            <span class="animate-spin">⏳</span>
            <span class="ml-2">Signing in...</span>
          {:else}
            Continue with Google
          {/if}
        </Button>
        
        <!-- Divider -->
        <div class="relative my-6">
          <div class="absolute inset-0 flex items-center">
            <span class="w-full border-t border-gray-300 dark:border-gray-600"></span>
          </div>
          <div class="relative flex justify-center text-sm">
            <span class="bg-white dark:bg-gray-800 px-2 text-gray-500">
              Secure & Privacy-First
            </span>
          </div>
        </div>
        
        <!-- Security Features -->
        <div class="grid grid-cols-1 gap-3 text-sm text-gray-600 dark:text-gray-300">
          <div class="flex items-center">
            <Shield class="w-4 h-4 mr-2 text-green-500" />
            <span>End-to-end encrypted authentication</span>
          </div>
          <div class="flex items-center">
            <Users class="w-4 h-4 mr-2 text-blue-500" />
            <span>Role-based access control</span>
          </div>
          <div class="flex items-center">
            <Server class="w-4 h-4 mr-2 text-purple-500" />
            <span>Enterprise-grade security</span>
          </div>
        </div>
      </CardContent>
    </Card>
    
    <!-- Footer -->
    <div class="text-center text-sm text-gray-500 dark:text-gray-400">
      <p>
        By signing in, you agree to our 
        <a href="/terms" class="text-blue-600 hover:text-blue-500 dark:text-blue-400">
          Terms of Service
        </a>
        and 
        <a href="/privacy" class="text-blue-600 hover:text-blue-500 dark:text-blue-400">
          Privacy Policy
        </a>
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