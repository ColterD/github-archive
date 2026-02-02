<script lang="ts">
	import { onMount } from 'svelte';
	import { Star, AlertCircle, Heart, Loader2, Package } from 'lucide-svelte';

	// Types
	interface Build {
		id: string;
		name: string;
		description: string;
		category: string;
		tags: string[];
		totalPrice: number;
		averageRating: number;
		viewCount: number;
		likeCount: number;
		reviewCount: number;
		isLiked: boolean;
		createdAt: string;
		user: {
			id: string;
			name: string;
			avatar?: string;
		};
		hardwareCategories: string[];
		componentCount: number;
		featuredComponents: Array<{
			id: string;
			name: string;
			category: string;
			quantity: number;
			price: number;
		}>;
	}

	interface Recommendation {
		id: string;
		name: string;
		category: string;
		totalPrice: number;
		averageRating: number;
		userName: string;
	}

	// State
	let builds: Build[] = [];
	let recommendations: Recommendation[] = [];
	let loading = true;
	let error = '';

	// Filters
	let selectedCategory = '';
	let minBudget = 0;
	let maxBudget = 10000;
	let selectedTags: string[] = [];
	let sortBy = 'popular';

	// Pagination
	let currentPage = 1;
	let hasMore = false;
	const limit = 12;

	// Available options
	const categories = [
		'Homelab Server',
		'NAS Build',
		'Network Setup',
		'Virtualization Host',
		'Storage Server',
		'Mini PC Setup',
		'Enterprise Grade',
		'Budget Build',
		'High Performance'
	];

	const availableTags = [
		'beginner-friendly',
		'budget',
		'high-performance',
		'energy-efficient',
		'compact',
		'enterprise',
		'diy',
		'rack-mount',
		'silent',
		'upgradeable'
	];

	const sortOptions = [
		{ value: 'popular', label: 'Most Popular' },
		{ value: 'newest', label: 'Newest First' },
		{ value: 'budget', label: 'Lowest Price' },
		{ value: 'rating', label: 'Highest Rated' }
	];

	// Functions
	async function loadBuilds(reset = false) {
		if (reset) {
			currentPage = 1;
			builds = [];
		}

		loading = true;
		error = '';

		try {
			const params = new URLSearchParams({
				limit: limit.toString(),
				offset: ((currentPage - 1) * limit).toString(),
				sortBy
			});

			if (selectedCategory) params.set('category', selectedCategory);
			if (minBudget > 0) params.set('minBudget', minBudget.toString());
			if (maxBudget < 10000) params.set('maxBudget', maxBudget.toString());
			if (selectedTags.length > 0) params.set('tags', selectedTags.join(','));

			const response = await fetch(`/api/builds/discover?${params}`);
			if (!response.ok) {
				throw new Error('Failed to load builds');
			}

			const data = await response.json();
			
			if (reset) {
				builds = data.builds;
				recommendations = data.recommendations || [];
			} else {
				builds = [...builds, ...data.builds];
			}

			hasMore = data.pagination.hasMore;
			// totalPages = Math.ceil(data.pagination.total / limit);
		} catch (error_) {
			error = error_ instanceof Error ? error_.message : 'An error occurred';
		} finally {
			loading = false;
		}
	}

	function loadMore() {
		if (!loading && hasMore) {
			currentPage++;
			loadBuilds();
		}
	}

	function applyFilters() {
		loadBuilds(true);
	}

	function clearFilters() {
		selectedCategory = '';
		minBudget = 0;
		maxBudget = 10000;
		selectedTags = [];
		sortBy = 'popular';
		loadBuilds(true);
	}

	function toggleTag(tag: string) {
		if (selectedTags.includes(tag)) {
			selectedTags = selectedTags.filter(t => t !== tag);
		} else {
			selectedTags = [...selectedTags, tag];
		}
	}

	async function toggleLike(buildId: string) {
		try {
			const response = await fetch(`/api/builds/${buildId}/like`, {
				method: 'POST'
			});

			if (response.ok) {
				// Update the build in the list
				builds = builds.map(build => {
					if (build.id === buildId) {
						return {
							...build,
							isLiked: !build.isLiked,
							likeCount: build.isLiked ? build.likeCount - 1 : build.likeCount + 1
						};
					}
					return build;
				});
			}
		} catch {
			// Failed to toggle like
		}
	}

	function formatPrice(price: number): string {
		return new Intl.NumberFormat('en-US', {
			style: 'currency',
			currency: 'USD',
			minimumFractionDigits: 0,
			maximumFractionDigits: 0
		}).format(price);
	}

	function formatDate(dateString: string): string {
		return new Date(dateString).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric'
		});
	}

	// Lifecycle
	onMount(() => {
		loadBuilds(true);
	});
</script>

<svelte:head>
	<title>Discover Builds - Homelab Hardware Platform</title>
	<meta name="description" content="Discover amazing homelab builds from the community. Filter by budget, category, and features to find your perfect setup." />
</svelte:head>

<div class="min-h-screen bg-gray-50">
	<!-- Header -->
	<div class="bg-white border-b border-gray-200">
		<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
			<div class="text-center">
				<h1 class="text-4xl font-bold text-gray-900 mb-4">
					Discover Amazing Builds
				</h1>
				<p class="text-xl text-gray-600 max-w-3xl mx-auto">
					Explore community-created homelab builds, get inspired, and find the perfect setup for your needs.
				</p>
			</div>
		</div>
	</div>

	<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
		<div class="flex flex-col lg:flex-row gap-8">
			<!-- Filters Sidebar -->
			<div class="lg:w-80 flex-shrink-0">
				<div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sticky top-8">
					<div class="flex items-center justify-between mb-6">
						<h2 class="text-lg font-semibold text-gray-900">Filters</h2>
						<button
						onclick={clearFilters}
						class="text-sm text-blue-600 hover:text-blue-700"
					>
							Clear All
						</button>
					</div>

					<!-- Sort By -->
					<div class="mb-6">
						<label for="sort-by" class="block text-sm font-medium text-gray-700 mb-2">
							Sort By
						</label>
						<select
						bind:value={sortBy}
						onchange={applyFilters}
						class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
					>
							{#each sortOptions as option (option.value)}
								<option value={option.value}>{option.label}</option>
							{/each}
						</select>
					</div>

					<!-- Category -->
				<div class="mb-6">
					<label for="category-select" class="block text-sm font-medium text-gray-700 mb-2">
						Category
					</label>
					<select
					id="category-select"
					bind:value={selectedCategory}
					onchange={applyFilters}
					class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
				>
							<option value="">All Categories</option>
							{#each categories as category (category)}
								<option value={category}>{category}</option>
							{/each}
						</select>
					</div>

					<!-- Budget Range -->
				<div class="mb-6">
					<div class="block text-sm font-medium text-gray-700 mb-2">
						Budget Range
					</div>
					<div class="space-y-3">
							<div>
						<label for="min-budget" class="block text-xs text-gray-500 mb-1">Min Budget</label>
						<input
						id="min-budget"
						type="number"
						bind:value={minBudget}
						onchange={applyFilters}
						min="0"
						step="100"
						class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
						placeholder="$0"
					/>
							</div>
							<div>
						<label for="max-budget" class="block text-xs text-gray-500 mb-1">Max Budget</label>
						<input
						id="max-budget"
						type="number"
						bind:value={maxBudget}
						onchange={applyFilters}
						min="0"
						step="100"
						class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
						placeholder="$10,000"
					/>
							</div>
						</div>
					</div>

					<!-- Tags -->
				<div class="mb-6">
					<div class="block text-sm font-medium text-gray-700 mb-3">
						Tags
					</div>
					<div class="flex flex-wrap gap-2">
							{#each availableTags as tag (tag)}
								<button
									onclick={() => {
										toggleTag(tag);
										applyFilters();
									}}
									class="px-3 py-1 text-sm rounded-full border transition-colors {
										selectedTags.includes(tag)
											? 'bg-blue-100 border-blue-300 text-blue-700'
											: 'bg-gray-100 border-gray-300 text-gray-700 hover:bg-gray-200'
									}"
								>
									{tag}
								</button>
							{/each}
						</div>
					</div>
				</div>
			</div>

			<!-- Main Content -->
			<div class="flex-1">
				<!-- Recommendations -->
				{#if recommendations.length > 0}
					<div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
						<h2 class="text-lg font-semibold text-gray-900 mb-4 flex items-center">
							<Star class="w-5 h-5 text-yellow-500 mr-2" />
							Recommended for You
						</h2>
						<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
							{#each recommendations as rec (rec.id)}
								<a
									href="/builds/{rec.id}"
									class="block p-4 border border-gray-200 rounded-lg hover:border-blue-300 transition-colors"
								>
									<h3 class="font-medium text-gray-900 mb-1">{rec.name}</h3>
									<p class="text-sm text-gray-600 mb-2">{rec.category}</p>
									<div class="flex items-center justify-between text-sm">
										<span class="font-medium text-green-600">{formatPrice(rec.totalPrice)}</span>
										<div class="flex items-center">
											<Star class="w-4 h-4 text-yellow-500 mr-1" />
											<span>{rec.averageRating.toFixed(1)}</span>
										</div>
									</div>
								</a>
							{/each}
						</div>
					</div>
				{/if}

				<!-- Results Header -->
				<div class="flex items-center justify-between mb-6">
					<h2 class="text-xl font-semibold text-gray-900">
						All Builds
						{#if builds.length > 0}
							<span class="text-gray-500 font-normal">({builds.length} found)</span>
						{/if}
					</h2>
				</div>

				<!-- Error State -->
				{#if error}
					<div class="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
						<AlertCircle class="w-12 h-12 text-red-500 mx-auto mb-4" />
						<h3 class="text-lg font-medium text-red-900 mb-2">Error Loading Builds</h3>
						<p class="text-red-700">{error}</p>
						<button
						onclick={() => loadBuilds(true)}
						class="mt-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
					>
							Try Again
						</button>
					</div>
				{/if}

				<!-- Builds Grid -->
				{#if builds.length > 0}
					<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
						{#each builds as build (build.id)}
							<div class="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
								<!-- Build Header -->
								<div class="p-6">
									<div class="flex items-start justify-between mb-3">
										<h3 class="text-lg font-semibold text-gray-900 line-clamp-2">
											<a href="/builds/{build.id}" class="hover:text-blue-600">
												{build.name}
											</a>
										</h3>
										<button
										onclick={() => toggleLike(build.id)}
										class="p-1 rounded-full hover:bg-gray-100 transition-colors"
									>
											<Heart
								class="w-5 h-5 {build.isLiked ? 'text-red-500 fill-current' : 'text-gray-400'}"
							/>
										</button>
									</div>

									{#if build.description}
										<p class="text-gray-600 text-sm mb-4 line-clamp-2">
											{build.description}
										</p>
									{/if}

									<!-- Build Stats -->
									<div class="flex items-center justify-between mb-4">
										<div class="text-2xl font-bold text-green-600">
											{formatPrice(build.totalPrice)}
										</div>
										<div class="flex items-center space-x-4 text-sm text-gray-500">
											<div class="flex items-center">
												<Star class="w-4 h-4 text-yellow-500 mr-1" />
												{build.averageRating.toFixed(1)}
											</div>
											<div class="flex items-center">
												<Heart class="w-4 h-4 text-red-500 mr-1" />
												{build.likeCount}
											</div>
										</div>
									</div>

									<!-- Featured Components -->
									{#if build.featuredComponents.length > 0}
										<div class="mb-4">
											<h4 class="text-sm font-medium text-gray-700 mb-2">Key Components</h4>
											<div class="space-y-1">
												{#each build.featuredComponents as component (component.id)}
													<div class="flex items-center justify-between text-sm">
														<span class="text-gray-600 truncate">
															{component.quantity}x {component.name}
														</span>
														<span class="text-gray-500 ml-2">
															{formatPrice(component.price * component.quantity)}
														</span>
													</div>
												{/each}
											</div>
										</div>
									{/if}

									<!-- Tags -->
									{#if build.tags && Array.isArray(build.tags) && build.tags.length > 0}
										<div class="mb-4">
											<div class="flex flex-wrap gap-1">
												{#each build.tags.slice(0, 3) as tag (tag)}
													<span class="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded-full">
														{tag}
													</span>
												{/each}
												{#if build.tags.length > 3}
													<span class="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full">
														+{build.tags.length - 3}
													</span>
												{/if}
											</div>
										</div>
									{/if}

									<!-- Build Footer -->
									<div class="flex items-center justify-between text-sm text-gray-500">
										<div class="flex items-center">
											<div class="w-6 h-6 bg-gray-300 rounded-full mr-2"></div>
											<span>{build.user.name}</span>
										</div>
										<span>{formatDate(build.createdAt)}</span>
									</div>
								</div>
							</div>
						{/each}
					</div>

					<!-- Load More Button -->
					{#if hasMore}
						<div class="text-center mt-8">
							<button
							onclick={loadMore}
							disabled={loading}
							class="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
						>
								{#if loading}
									<Loader2 class="w-5 h-5 animate-spin mr-2" />
									Loading...
								{:else}
									Load More Builds
								{/if}
							</button>
						</div>
					{/if}
				{:else if !loading}
					<!-- Empty State -->
					<div class="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
						<Package class="w-16 h-16 text-gray-400 mx-auto mb-4" />
						<h3 class="text-lg font-medium text-gray-900 mb-2">No Builds Found</h3>
						<p class="text-gray-600 mb-6">
							Try adjusting your filters or browse all builds.
						</p>
						<button
						onclick={clearFilters}
						class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
					>
							Clear Filters
						</button>
					</div>
				{/if}

				<!-- Loading State -->
				{#if loading && builds.length === 0}
					<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
						{#each Array(6) as _, i (i)}
							<div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6 animate-pulse">
								<div class="h-6 bg-gray-200 rounded mb-3"></div>
								<div class="h-4 bg-gray-200 rounded mb-4"></div>
								<div class="h-8 bg-gray-200 rounded mb-4"></div>
								<div class="space-y-2">
									<div class="h-3 bg-gray-200 rounded"></div>
									<div class="h-3 bg-gray-200 rounded"></div>
								</div>
							</div>
						{/each}
					</div>
				{/if}
			</div>
		</div>
	</div>
</div>

<style>
	.line-clamp-2 {
		display: -webkit-box;
		-webkit-line-clamp: 2;
		-webkit-box-orient: vertical;
		line-clamp: 2;
		overflow: hidden;
	}
</style>