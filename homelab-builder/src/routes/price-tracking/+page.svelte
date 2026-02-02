<script lang="ts">
	import { onMount } from 'svelte';
	import { Button } from '$lib/components/ui/button';
	import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Input } from '$lib/components/ui/input';
	import { Badge } from '$lib/components/ui/badge';
	import { Tabs, TabsContent, TabsList, TabsTrigger } from '$lib/components/ui/tabs';
	import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '$lib/components/ui/select';
	import { TrendingDown, TrendingUp, Bell, BellOff, Calendar, ExternalLink, Filter, Search, Plus } from 'lucide-svelte';
	import { toast } from 'svelte-sonner';

	interface PriceAlert {
		id: string;
		hardwareId: string;
		hardwareName: string;
		currentPrice: number;
		targetPrice: number;
		isActive: boolean;
		createdAt: string;
		lastTriggered?: string;
	}

	interface PriceHistory {
		id: string;
		hardwareId: string;
		hardwareName: string;
		price: number;
		vendor: string;
		url: string;
		timestamp: string;
		priceChange?: number;
		priceChangePercent?: number;
	}

	interface PriceDrop {
		id: string;
		hardwareId: string;
		hardwareName: string;
		oldPrice: number;
		newPrice: number;
		discountPercent: number;
		vendor: string;
		url: string;
		timestamp: string;
	}

	let priceAlerts: PriceAlert[] = [];
	let priceHistory: PriceHistory[] = [];
	let priceDrops: PriceDrop[] = [];
	let loading = true;
	let searchQuery = '';
	let filterBy = 'all';
	let activeTab = 'alerts';

	// New alert form
	let newAlertHardware = '';
	let newAlertPrice = '';
	let showAddAlert = false;

	onMount(async () => {
		await loadPriceData();
	});

	async function loadPriceData() {
		try {
			loading = true;
			
			// Load price alerts
			const alertsResponse = await fetch('/api/price-tracking/alerts');
			if (alertsResponse.ok) {
				priceAlerts = await alertsResponse.json();
			}

			// Load price history
			const historyResponse = await fetch('/api/price-tracking/history');
			if (historyResponse.ok) {
				priceHistory = await historyResponse.json();
			}

			// Load recent price drops
			const dropsResponse = await fetch('/api/price-tracking/drops');
			if (dropsResponse.ok) {
				priceDrops = await dropsResponse.json();
			}
	} catch {
		// Failed to load price data
		toast.error('Failed to load price tracking data');
		} finally {
			loading = false;
		}
	}

	async function toggleAlert(alertId: string) {
		try {
			const alert = priceAlerts.find(a => a.id === alertId);
			if (!alert) return;

			const response = await fetch(`/api/price-tracking/alerts/${alertId}`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ isActive: !alert.isActive })
			});

			if (response.ok) {
				alert.isActive = !alert.isActive;
				priceAlerts = [...priceAlerts];
				toast.success(`Alert ${alert.isActive ? 'enabled' : 'disabled'}`);
			} else {
				toast.error('Failed to update alert');
			}
} catch {
			// Failed to toggle alert
			toast.error('Failed to update alert');
		}
	}

	async function deleteAlert(alertId: string) {
		try {
			const response = await fetch(`/api/price-tracking/alerts/${alertId}`, {
				method: 'DELETE'
			});

			if (response.ok) {
				priceAlerts = priceAlerts.filter(a => a.id !== alertId);
				toast.success('Alert deleted');
			} else {
				toast.error('Failed to delete alert');
			}
} catch {
			// Failed to delete alert
			toast.error('Failed to delete alert');
		}
	}

	async function createAlert() {
		if (!newAlertHardware || !newAlertPrice) {
			toast.error('Please fill in all fields');
			return;
		}

		try {
			const response = await fetch('/api/price-tracking/alerts', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					hardwareId: newAlertHardware,
					targetPrice: parseFloat(newAlertPrice)
				})
			});

			if (response.ok) {
				const newAlert = await response.json();
				priceAlerts = [newAlert, ...priceAlerts];
				newAlertHardware = '';
				newAlertPrice = '';
				showAddAlert = false;
				toast.success('Price alert created');
			} else {
				toast.error('Failed to create alert');
			}
} catch {
			// Failed to create alert
			toast.error('Failed to create alert');
		}
	}

	function formatPrice(price: number): string {
		return new Intl.NumberFormat('en-US', {
			style: 'currency',
			currency: 'USD'
		}).format(price);
	}

	function formatDate(dateString: string): string {
		return new Date(dateString).toLocaleDateString('en-US', {
			month: 'short',
			day: 'numeric',
			year: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	}

	function getPriceChangeColor(change: number): string {
		if (change > 0) return 'text-red-600 dark:text-red-400';
		if (change < 0) return 'text-green-600 dark:text-green-400';
		return 'text-slate-600 dark:text-slate-400';
	}

	// Handle select change
	function handleSelect(value: string) {
		filterBy = value;
	}

	// Filter and sort functions
	$: filteredAlerts = priceAlerts.filter(alert => {
		const matchesSearch = alert.hardwareName.toLowerCase().includes(searchQuery.toLowerCase());
		const matchesFilter = filterBy === 'all' || 
			(filterBy === 'active' && alert.isActive) ||
			(filterBy === 'inactive' && !alert.isActive);
		return matchesSearch && matchesFilter;
	});

	$: filteredHistory = priceHistory.filter(item => 
		item.hardwareName.toLowerCase().includes(searchQuery.toLowerCase())
	);

	$: filteredDrops = priceDrops.filter(drop => 
		drop.hardwareName.toLowerCase().includes(searchQuery.toLowerCase())
	);
</script>

<svelte:head>
	<title>Price Tracking - Homelab Builder</title>
	<meta name="description" content="Track hardware prices, set alerts, and discover the best deals for your homelab." />
</svelte:head>

<div class="container mx-auto px-4 py-8 max-w-7xl">
	<!-- Header -->
	<div class="mb-8">
		<h1 class="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-2">
			Price Tracking
		</h1>
		<p class="text-slate-600 dark:text-slate-400">
			Monitor hardware prices, set alerts, and never miss a great deal.
		</p>
	</div>

	<!-- Search and Filters -->
	<div class="mb-6 flex flex-col sm:flex-row gap-4">
		<div class="relative flex-1">
			<Search class="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
			<Input
				bind:value={searchQuery}
				placeholder="Search hardware..."
				class="pl-10"
			/>
		</div>
		
		<Select bind:value={filterBy}>
			<SelectTrigger class="w-full sm:w-48">
				<Filter class="w-4 h-4 mr-2" />
				<SelectValue placeholder="Filter alerts" />
			</SelectTrigger>
			<SelectContent>
				<SelectItem value="all" handleSelect={handleSelect}>All Alerts</SelectItem>
				<SelectItem value="active" handleSelect={handleSelect}>Active Only</SelectItem>
				<SelectItem value="inactive" handleSelect={handleSelect}>Inactive Only</SelectItem>
			</SelectContent>
		</Select>
		
		<Button onclick={() => showAddAlert = true}>
			<Plus class="w-4 h-4 mr-2" />
			Add Alert
		</Button>
	</div>

	<!-- Tabs -->
	<Tabs bind:value={activeTab} class="w-full">
		<TabsList class="grid w-full grid-cols-3">
			<TabsTrigger value="alerts">Price Alerts ({priceAlerts.length})</TabsTrigger>
			<TabsTrigger value="drops">Recent Drops ({priceDrops.length})</TabsTrigger>
			<TabsTrigger value="history">Price History</TabsTrigger>
		</TabsList>

		<!-- Price Alerts Tab -->
		<TabsContent value="alerts" class="space-y-4">
			{#if loading}
				<div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
					{#each Array(6) as _, index (index)}
						<Card>
							<CardContent class="p-6">
								<div class="animate-pulse space-y-3">
									<div class="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4"></div>
									<div class="h-6 bg-slate-200 dark:bg-slate-700 rounded w-1/2"></div>
									<div class="h-4 bg-slate-200 dark:bg-slate-700 rounded w-full"></div>
								</div>
							</CardContent>
						</Card>
					{/each}
				</div>
			{:else if filteredAlerts.length === 0}
				<Card>
					<CardContent class="p-12 text-center">
						<Bell class="w-12 h-12 text-slate-400 mx-auto mb-4" />
						<h3 class="text-lg font-medium text-slate-900 dark:text-slate-100 mb-2">
							No price alerts yet
						</h3>
						<p class="text-slate-600 dark:text-slate-400 mb-4">
							Create your first price alert to get notified when hardware prices drop.
						</p>
						<Button onclick={() => showAddAlert = true}>
							<Plus class="w-4 h-4 mr-2" />
							Create Alert
						</Button>
					</CardContent>
				</Card>
			{:else}
				<div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
					{#each filteredAlerts as alert (alert.id)}
						<Card class="relative">
							<CardHeader class="pb-3">
								<div class="flex items-start justify-between">
									<div class="flex-1">
										<CardTitle class="text-sm font-medium text-slate-900 dark:text-slate-100">
											{alert.hardwareName}
										</CardTitle>
										<Badge variant={alert.isActive ? 'default' : 'secondary'} class="mt-1">
											{alert.isActive ? 'Active' : 'Inactive'}
										</Badge>
									</div>
									<Button
										variant="ghost"
										size="sm"
										onclick={() => toggleAlert(alert.id)}
									>
										{#if alert.isActive}
											<Bell class="w-4 h-4" />
										{:else}
											<BellOff class="w-4 h-4" />
										{/if}
									</Button>
								</div>
							</CardHeader>
							<CardContent class="pt-0">
								<div class="space-y-2">
									<div class="flex justify-between items-center">
										<span class="text-sm text-slate-600 dark:text-slate-400">Current</span>
										<span class="font-medium">{formatPrice(alert.currentPrice || 0)}</span>
									</div>
									<div class="flex justify-between items-center">
										<span class="text-sm text-slate-600 dark:text-slate-400">Target</span>
										<span class="font-medium text-green-600 dark:text-green-400">
											{formatPrice(alert.targetPrice)}
										</span>
									</div>
									<div class="flex justify-between items-center text-xs text-slate-500 dark:text-slate-400">
										<span>Created {formatDate(alert.createdAt)}</span>
										<Button
												variant="ghost"
												size="sm"
												class="text-red-600 hover:text-red-700 h-auto p-0"
												onclick={() => deleteAlert(alert.id)}
											>
												Delete
											</Button>
									</div>
								</div>
							</CardContent>
						</Card>
					{/each}
				</div>
			{/if}
		</TabsContent>

		<!-- Recent Price Drops Tab -->
		<TabsContent value="drops" class="space-y-4">
			{#if loading}
				<div class="space-y-4">
					{#each Array(5) as _, index (index)}
						<Card>
							<CardContent class="p-6">
								<div class="animate-pulse space-y-3">
									<div class="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4"></div>
									<div class="h-6 bg-slate-200 dark:bg-slate-700 rounded w-1/2"></div>
								</div>
							</CardContent>
						</Card>
					{/each}
				</div>
			{:else if filteredDrops.length === 0}
				<Card>
					<CardContent class="p-12 text-center">
						<TrendingDown class="w-12 h-12 text-slate-400 mx-auto mb-4" />
						<h3 class="text-lg font-medium text-slate-900 dark:text-slate-100 mb-2">
							No recent price drops
						</h3>
						<p class="text-slate-600 dark:text-slate-400">
							We'll show you the latest price drops here when they happen.
						</p>
					</CardContent>
				</Card>
			{:else}
				<div class="space-y-4">
					{#each filteredDrops as drop (drop.id)}
						<Card>
							<CardContent class="p-6">
								<div class="flex items-center justify-between">
									<div class="flex-1">
										<h3 class="font-medium text-slate-900 dark:text-slate-100 mb-1">
											{drop.hardwareName}
										</h3>
										<div class="flex items-center gap-4 text-sm">
											<span class="text-slate-500 line-through">
												{formatPrice(drop.oldPrice)}
											</span>
											<span class="font-medium text-green-600 dark:text-green-400">
												{formatPrice(drop.newPrice)}
											</span>
											<Badge variant="secondary" class="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
												-{drop.discountPercent}%
											</Badge>
										</div>
										<div class="flex items-center gap-2 mt-2 text-xs text-slate-500 dark:text-slate-400">
											<span>{drop.vendor}</span>
											<span>•</span>
											<span>{formatDate(drop.timestamp)}</span>
										</div>
									</div>
									<Button variant="outline" size="sm" asChild>
										<a href={drop.url} target="_blank" rel="noopener noreferrer">
											<ExternalLink class="w-4 h-4 mr-2" />
											View Deal
										</a>
									</Button>
								</div>
							</CardContent>
						</Card>
					{/each}
				</div>
			{/if}
		</TabsContent>

		<!-- Price History Tab -->
		<TabsContent value="history" class="space-y-4">
			{#if loading}
				<div class="space-y-4">
					{#each Array(8) as _, index (index)}
						<Card>
							<CardContent class="p-4">
								<div class="animate-pulse space-y-2">
									<div class="h-4 bg-slate-200 dark:bg-slate-700 rounded w-2/3"></div>
									<div class="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/3"></div>
								</div>
							</CardContent>
						</Card>
					{/each}
				</div>
			{:else if filteredHistory.length === 0}
				<Card>
					<CardContent class="p-12 text-center">
						<Calendar class="w-12 h-12 text-slate-400 mx-auto mb-4" />
						<h3 class="text-lg font-medium text-slate-900 dark:text-slate-100 mb-2">
							No price history available
						</h3>
						<p class="text-slate-600 dark:text-slate-400">
							Price history will appear here as we track hardware prices over time.
						</p>
					</CardContent>
				</Card>
			{:else}
				<div class="space-y-2">
					{#each filteredHistory as item (item.id)}
						<Card>
							<CardContent class="p-4">
								<div class="flex items-center justify-between">
									<div class="flex-1">
										<div class="flex items-center gap-3">
											<h4 class="font-medium text-slate-900 dark:text-slate-100">
												{item.hardwareName}
											</h4>
											<span class="text-sm text-slate-500 dark:text-slate-400">
												at {item.vendor}
											</span>
										</div>
										<div class="flex items-center gap-2 mt-1">
											<span class="font-medium">{formatPrice(item.price)}</span>
											{#if item.priceChange}
												<span class={`text-sm flex items-center gap-1 ${getPriceChangeColor(item.priceChange)}`}>
													{#if item.priceChange > 0}
														<TrendingUp class="w-3 h-3" />
														+{formatPrice(item.priceChange)}
													{:else if item.priceChange < 0}
														<TrendingDown class="w-3 h-3" />
														{formatPrice(item.priceChange)}
													{/if}
													{#if item.priceChangePercent}
														({item.priceChangePercent > 0 ? '+' : ''}{item.priceChangePercent.toFixed(1)}%)
													{/if}
												</span>
											{/if}
										</div>
									</div>
									<div class="flex items-center gap-2">
										<span class="text-xs text-slate-500 dark:text-slate-400">
											{formatDate(item.timestamp)}
										</span>
										<Button variant="ghost" size="sm" asChild>
											<a href={item.url} target="_blank" rel="noopener noreferrer">
												<ExternalLink class="w-3 h-3" />
											</a>
										</Button>
									</div>
								</div>
							</CardContent>
						</Card>
					{/each}
				</div>
			{/if}
		</TabsContent>
	</Tabs>
</div>

<!-- Add Alert Modal -->
{#if showAddAlert}
	<div class="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
		<Card class="w-full max-w-md">
			<CardHeader>
				<CardTitle>Create Price Alert</CardTitle>
				<CardDescription>
					Get notified when hardware prices drop below your target.
				</CardDescription>
			</CardHeader>
			<CardContent class="space-y-4">
				<div>
					<label for="hardware-item" class="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">
						Hardware Item
					</label>
					<Input
						id="hardware-item"
						bind:value={newAlertHardware}
						placeholder="Search for hardware..."
					/>
				</div>
				<div>
					<label for="target-price" class="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">
						Target Price ($)
					</label>
					<Input
						id="target-price"
						bind:value={newAlertPrice}
						type="number"
						placeholder="0.00"
						step="0.01"
						min="0"
					/>
				</div>
				<div class="flex gap-2 pt-4">
					<Button variant="outline" class="flex-1" onclick={() => showAddAlert = false}>
						Cancel
					</Button>
					<Button class="flex-1" onclick={createAlert}>
						Create Alert
					</Button>
				</div>
			</CardContent>
		</Card>
	</div>
{/if}