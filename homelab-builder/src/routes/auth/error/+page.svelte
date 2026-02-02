<!-- HOMELAB HARDWARE PLATFORM - AUTHENTICATION ERROR PAGE -->
<script lang="ts">
  import { page } from "$app/stores"
  import { Button } from "$lib/components/ui/button"
  import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "$lib/components/ui/card"
  import { AlertTriangle, Home, RefreshCw, Mail } from "lucide-svelte"
  
  // Get error details from URL parameters
  $: error = $page.url.searchParams.get("error")
  $: errorDescription = $page.url.searchParams.get("error_description")
  
  // Map error codes to user-friendly messages
  const errorMessages: { [key: string]: string } = {
    "Configuration": "There's an issue with the authentication configuration. Please try again later.",
    "AccessDenied": "Access was denied. You may have cancelled the authentication or don't have permission.",
    "Verification": "Unable to verify your identity. Please check your email or try a different method.",
    "Default": "An authentication error occurred. Please try signing in again.",
    "OAuthSignin": "There was an issue starting the OAuth sign-in process.",
    "OAuthCallback": "There was an issue during the OAuth callback process.",
    "OAuthCreateAccount": "Could not create an account with the OAuth provider.",
    "EmailCreateAccount": "Could not create an account with the email provider.",
    "Callback": "There was an issue with the authentication callback.",
    "OAuthAccountNotLinked": "This account is not linked to your existing account. Please sign in with the same provider you used initially.",
    "EmailSignin": "There was an issue sending the verification email.",
    "CredentialsSignin": "Invalid credentials provided.",
    "SessionRequired": "You must be signed in to access this page.",
  }
  
  $: userMessage = errorMessages[error || "Default"] || errorMessages["Default"]
  $: isEmailError = error === "EmailSignin" || error === "EmailCreateAccount" || error === "Verification"
  $: isOAuthError = error?.startsWith("OAuth") || error === "AccessDenied"
  
  const retrySignIn = () => {
    window.location.href = "/auth/signin"
  }
  
  const contactSupport = () => {
    window.location.href = "mailto:support@homelab-hardware.com?subject=Authentication Error&body=" + 
      encodeURIComponent(`Error: ${error}\nDescription: ${errorDescription}\nTimestamp: ${new Date().toISOString()}`)
  }
</script>

<svelte:head>
  <title>Authentication Error - Homelab Hardware Platform</title>
  <meta name="description" content="An error occurred during authentication" />
</svelte:head>

<div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-100 dark:from-gray-900 dark:to-gray-800 p-4">
  <div class="w-full max-w-md space-y-8">
    <!-- Header -->
    <div class="text-center">
      <div class="flex justify-center mb-4">
        <div class="w-16 h-16 bg-red-600 rounded-xl flex items-center justify-center">
          <AlertTriangle class="w-8 h-8 text-white" />
        </div>
      </div>
      <h1 class="text-3xl font-bold text-gray-900 dark:text-white">
        Authentication Error
      </h1>
      <p class="text-gray-600 dark:text-gray-300 mt-2">
        We encountered an issue while signing you in
      </p>
    </div>
    
    <!-- Error Details Card -->
    <Card class="border-0 shadow-xl">
      <CardHeader>
        <CardTitle class="text-xl text-center text-red-600 dark:text-red-400">
          {error || "Unknown Error"}
        </CardTitle>
        <CardDescription class="text-center">
          {userMessage}
        </CardDescription>
      </CardHeader>
      
      <CardContent class="space-y-4">
        {#if errorDescription}
          <div class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
            <p class="text-sm text-red-700 dark:text-red-300">
              <strong>Details:</strong> {errorDescription}
            </p>
          </div>
        {/if}
        
        <!-- Action Buttons -->
        <div class="space-y-3">
          <Button
            class="w-full h-12 text-base font-medium"
            onclick={retrySignIn}
          >
            <RefreshCw class="w-5 h-5 mr-3" />
            Try Again
          </Button>
          
          <Button
            class="w-full h-12 text-base font-medium"
            variant="outline"
            onclick={() => window.location.href = "/"}
          >
            <Home class="w-5 h-5 mr-3" />
            Go to Homepage
          </Button>
        </div>
        
        <!-- Divider -->
        <div class="relative my-6">
          <div class="absolute inset-0 flex items-center">
            <span class="w-full border-t border-gray-300 dark:border-gray-600"></span>
          </div>
          <div class="relative flex justify-center text-sm">
            <span class="bg-white dark:bg-gray-800 px-2 text-gray-500">
              Need Help?
            </span>
          </div>
        </div>
        
        <!-- Help Options -->
        <div class="grid grid-cols-1 gap-3">
          {#if isOAuthError}
            <div class="text-sm text-gray-600 dark:text-gray-300 space-y-2">
              <p class="font-medium">OAuth Authentication Issues:</p>
              <ul class="list-disc list-inside space-y-1 text-xs">
                <li>Check if you have an account with the selected provider</li>
                <li>Ensure you're using the same provider you used initially</li>
                <li>Try clearing your browser cache and cookies</li>
                <li>Disable ad blockers or browser extensions temporarily</li>
              </ul>
            </div>
          {/if}
          
          {#if isEmailError}
            <div class="text-sm text-gray-600 dark:text-gray-300 space-y-2">
              <p class="font-medium">Email Authentication Issues:</p>
              <ul class="list-disc list-inside space-y-1 text-xs">
                <li>Check your spam/junk folder for verification emails</li>
                <li>Ensure the email address is correct</li>
                <li>Try a different email provider</li>
                <li>Wait a few minutes and try again</li>
              </ul>
            </div>
          {/if}
          
          <Button
            class="w-full justify-start"
            variant="ghost"
            onclick={contactSupport}
          >
            <Mail class="w-4 h-4 mr-2" />
            Contact Support
          </Button>
        </div>
      </CardContent>
    </Card>
    
    <!-- Footer -->
    <div class="text-center text-sm text-gray-500 dark:text-gray-400">
      <p>
        Error Code: {error || "Unknown"} | 
        <span class="font-mono">{new Date().toISOString().split('T')[0]}</span>
      </p>
    </div>
  </div>
</div>