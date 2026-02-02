<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { Button } from '$lib/components/ui/button';
	import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { WifiOff, RefreshCw, Home, HardDrive, Wrench } from 'lucide-svelte';

	let isOnline = false;
	let retrying = false;

	onMount(() => {
		// Check initial online status
		isOnline = navigator.onLine;

		// Listen for online/offline events
		const handleOnline = () => {
			isOnline = true;
			// Automatically redirect to home when back online
			setTimeout(() => {
				goto('/');
			}, 1000);
		};

		const handleOffline = () => {
			isOnline = false;
		};

		window.addEventListener('online', handleOnline);
		window.addEventListener('offline', handleOffline);

		return () => {
			window.removeEventListener('online', handleOnline);
			window.removeEventListener('offline', handleOffline);
		};
	});

	async function retryConnection() {
		retrying = true;
		
		try {
			// Try to fetch a simple endpoint to test connectivity
			const response = await fetch('/health', { 
				method: 'HEAD',
				cache: 'no-cache'
			});
			
			if (response.ok) {
				isOnline = true;
				goto('/');
			} else {
				// Still offline
				isOnline = false;
			}
		} catch {
			// Connection failed
			isOnline = false;
		} finally {
			retrying = false;
		}
	}

	function goToHome() {
		goto('/');
	}

	function goToHardware() {
		goto('/hardware');
	}

	function goToBuilds() {
		goto('/builds');
	}
</script>

<svelte:head>
	<title>Offline - Homelab Builder</title>
	<meta name="description" content="You're currently offline. Some features may not be available." />
</svelte:head>

<div class="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center p-4">
	<div class="max-w-md w-full space-y-6">
		<!-- Main Offline Card -->
		<Card class="text-center">
			<CardHeader class="pb-4">
				<div class="mx-auto mb-4 p-3 bg-slate-100 dark:bg-slate-800 rounded-full w-fit">
					{#if isOnline}
						<div class="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
							<div class="w-6 h-6 bg-white rounded-full"></div>
						</div>
					{:else}
						<WifiOff class="w-12 h-12 text-slate-500" />
					{/if}
				</div>
				
				{#if isOnline}
					<CardTitle class="text-green-600 dark:text-green-400">Back Online!</CardTitle>
					<CardDescription>Redirecting you to the homepage...</CardDescription>
				{:else}
					<CardTitle class="text-slate-700 dark:text-slate-300">You're Offline</CardTitle>
					<CardDescription>
						It looks like you're not connected to the internet. Some features may not be available.
					</CardDescription>
				{/if}
			</CardHeader>
			
			<CardContent class="space-y-4">
				{#if !isOnline}
					<Button 
					onclick={retryConnection} 
					disabled={retrying}
					class="w-full"
				>
					{#if retrying}
						<RefreshCw class="w-4 h-4 mr-2 animate-spin" />
						Checking Connection...
					{:else}
						<RefreshCw class="w-4 h-4 mr-2" />
						Try Again
					{/if}
				</Button>
				{/if}
			</CardContent>
		</Card>

		<!-- Available Offline Features -->
		{#if !isOnline}
			<Card>
				<CardHeader>
					<CardTitle class="text-sm font-medium text-slate-600 dark:text-slate-400">
						Available Offline
					</CardTitle>
				</CardHeader>
				<CardContent class="space-y-2">
					<Button 
						variant="ghost" 
						class="w-full justify-start" 
						onclick={goToHome}
					>
						<Home class="w-4 h-4 mr-3" />
						Home Page
					</Button>
					
					<Button 
						variant="ghost" 
						class="w-full justify-start" 
						onclick={goToHardware}
					>
						<HardDrive class="w-4 h-4 mr-3" />
						Cached Hardware
					</Button>
					
					<Button 
						variant="ghost" 
						class="w-full justify-start" 
						onclick={goToBuilds}
					>
						<Wrench class="w-4 h-4 mr-3" />
						Cached Builds
					</Button>
				</CardContent>
			</Card>
		{/if}

		<!-- Offline Tips -->
		{#if !isOnline}
			<Card class="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
				<CardContent class="pt-6">
					<div class="text-sm text-blue-700 dark:text-blue-300">
						<p class="font-medium mb-2">💡 Offline Tips:</p>
						<ul class="space-y-1 text-xs">
							<li>• Previously viewed pages are available offline</li>
							<li>• Your build drafts are saved locally</li>
							<li>• Search works with cached hardware data</li>
							<li>• New content will sync when you're back online</li>
						</ul>
					</div>
				</CardContent>
			</Card>
		{/if}
	</div>
</div>

<style>
	/* Custom animations for connection status */
	@keyframes pulse-green {
		0%, 100% {
			opacity: 1;
		}
		50% {
			opacity: 0.5;
		}
	}
</style>