<script lang="ts">
	import { onMount } from 'svelte';
	import { RefreshCw, Clock, Eye, Check, X, Flag, AlertCircle, Loader2, Star, Package, User, EyeOff, Trash, AlertTriangle } from 'lucide-svelte';

	// Types
	interface ModerationReport {
		id: string;
		type: 'REVIEW' | 'BUILD' | 'USER';
		reason: string;
		description?: string;
		status: 'PENDING' | 'REVIEWED' | 'RESOLVED' | 'DISMISSED';
		createdAt: string;
		updatedAt: string;
		reporter: {
			id: string;
			name: string;
			email: string;
		};
		moderator?: {
			id: string;
			name: string;
		};
		review?: {
			id: string;
			title: string;
			content: string;
			user: {
				id: string;
				name: string;
			};
		};
		build?: {
			id: string;
			name: string;
			description: string;
			user: {
				id: string;
				name: string;
			};
		};
		user?: {
			id: string;
			name: string;
			email: string;
		};
	}

	// State
	let reports: ModerationReport[] = [];
	let loading = true;
	let error = '';
	let selectedReport: ModerationReport | null = null;
	let showModal = false;

	// Filters
	let statusFilter = '';
	let typeFilter = '';
	let sortBy = 'newest';

	// Pagination
	let currentPage = 1;
	let hasMore = false;
	const limit = 20;

	// Stats
	let stats = {
		pending: 0,
		reviewed: 0,
		resolved: 0,
		dismissed: 0,
		total: 0
	};

	// Options
	const statusOptions = [
		{ value: '', label: 'All Status' },
		{ value: 'PENDING', label: 'Pending' },
		{ value: 'REVIEWED', label: 'Reviewed' },
		{ value: 'RESOLVED', label: 'Resolved' },
		{ value: 'DISMISSED', label: 'Dismissed' }
	];

	const typeOptions = [
		{ value: '', label: 'All Types' },
		{ value: 'REVIEW', label: 'Reviews' },
		{ value: 'BUILD', label: 'Builds' },
		{ value: 'USER', label: 'Users' }
	];

	const sortOptions = [
		{ value: 'newest', label: 'Newest First' },
		{ value: 'oldest', label: 'Oldest First' },
		{ value: 'priority', label: 'Priority' }
	];

	const moderationActions = [
		{ value: 'hide', label: 'Hide Content', icon: 'eye-off' },
		{ value: 'delete', label: 'Delete Content', icon: 'trash' },
		{ value: 'warn', label: 'Warn User', icon: 'alert-triangle' },
		{ value: 'dismiss', label: 'Dismiss Report', icon: 'x' }
	];

	// Functions
	async function loadReports(reset = false) {
		if (reset) {
			currentPage = 1;
			reports = [];
		}

		loading = true;
		error = '';

		try {
			const params = new URLSearchParams({
				limit: limit.toString(),
				offset: ((currentPage - 1) * limit).toString(),
				sortBy
			});

			if (statusFilter) params.set('status', statusFilter);
			if (typeFilter) params.set('type', typeFilter);

			const response = await fetch(`/api/moderation?${params}`);
			if (!response.ok) {
				throw new Error('Failed to load reports');
			}

			const data = await response.json();
			
			if (reset) {
				reports = data.reports;
				stats = data.stats;
			} else {
				reports = [...reports, ...data.reports];
			}

			hasMore = data.pagination.hasMore;
		} catch (_err) {
			error = _err instanceof Error ? _err.message : 'An error occurred';
		} finally {
			loading = false;
		}
	}

	function loadMore() {
		if (!loading && hasMore) {
			currentPage++;
			loadReports();
		}
	}

	function applyFilters() {
		loadReports(true);
	}

	function openReportModal(report: ModerationReport) {
		selectedReport = report;
		showModal = true;
	}

	function closeModal() {
		showModal = false;
		selectedReport = null;
	}

	async function handleModerationAction(action: string, reportId: string) {
		try {
			const response = await fetch(`/api/moderation/${reportId}`, {
				method: 'PATCH',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					action,
					status: action === 'dismiss' ? 'DISMISSED' : 'RESOLVED'
				})
			});

			if (response.ok) {
				// Update the report in the list
				reports = reports.map(report => {
					if (report.id === reportId) {
						return {
							...report,
							status: action === 'dismiss' ? 'DISMISSED' : 'RESOLVED',
							updatedAt: new Date().toISOString()
						};
					}
					return report;
				});

				// Update stats
				if (action === 'dismiss') {
					stats.dismissed++;
				} else {
					stats.resolved++;
				}
				stats.pending--;

				closeModal();
			} else {
				throw new Error('Failed to perform moderation action');
			}
		} catch {
      // Moderation action failed
      alert('Failed to perform moderation action');
    }
	}

	function getStatusColor(status: string): string {
		switch (status) {
			case 'PENDING':
				return 'bg-yellow-100 text-yellow-800';
			case 'REVIEWED':
				return 'bg-blue-100 text-blue-800';
			case 'RESOLVED':
				return 'bg-green-100 text-green-800';
			case 'DISMISSED':
				return 'bg-gray-100 text-gray-800';
			default:
				return 'bg-gray-100 text-gray-800';
		}
	}

	function getTypeIcon(type: string): string {
		switch (type) {
			case 'REVIEW':
				return 'star';
			case 'BUILD':
				return 'package';
			case 'USER':
				return 'user';
			default:
				return 'flag';
		}
	}

	function formatDate(dateString: string): string {
		return new Date(dateString).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	}

	function getIconComponent(iconName: string) {
		switch (iconName) {
			case 'star': return Star;
			case 'package': return Package;
			case 'user': return User;
			case 'flag': return Flag;
			case 'eye-off': return EyeOff;
			case 'trash': return Trash;
			case 'alert-triangle': return AlertTriangle;
			case 'x': return X;
			default: return Flag;
		}
	}

	// Lifecycle
	onMount(() => {
		loadReports(true);
	});
</script>

<svelte:head>
	<title>Moderation Dashboard - Admin</title>
	<meta name="description" content="Manage community reports and moderate content" />
</svelte:head>

<div class="min-h-screen bg-gray-50">
	<!-- Header -->
	<div class="bg-white border-b border-gray-200">
		<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
			<div class="flex items-center justify-between">
				<div>
					<h1 class="text-2xl font-bold text-gray-900">Moderation Dashboard</h1>
					<p class="text-gray-600 mt-1">Manage community reports and moderate content</p>
				</div>
				<div class="flex items-center space-x-4">
					<button
					onclick={() => loadReports(true)}
					class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
				>
						<RefreshCw class="w-4 h-4 mr-2" />
						Refresh
					</button>
				</div>
			</div>
		</div>
	</div>

	<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
		<!-- Stats Cards -->
		<div class="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
			<div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
				<div class="flex items-center">
					<div class="p-2 bg-yellow-100 rounded-lg">
						<Clock class="w-6 h-6 text-yellow-600" />
					</div>
					<div class="ml-4">
						<p class="text-sm font-medium text-gray-600">Pending</p>
						<p class="text-2xl font-bold text-gray-900">{stats.pending}</p>
					</div>
				</div>
			</div>

			<div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
				<div class="flex items-center">
					<div class="p-2 bg-blue-100 rounded-lg">
						<Eye class="w-6 h-6 text-blue-600" />
					</div>
					<div class="ml-4">
						<p class="text-sm font-medium text-gray-600">Reviewed</p>
						<p class="text-2xl font-bold text-gray-900">{stats.reviewed}</p>
					</div>
				</div>
			</div>

			<div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
				<div class="flex items-center">
					<div class="p-2 bg-green-100 rounded-lg">
						<Check class="w-6 h-6 text-green-600" />
					</div>
					<div class="ml-4">
						<p class="text-sm font-medium text-gray-600">Resolved</p>
						<p class="text-2xl font-bold text-gray-900">{stats.resolved}</p>
					</div>
				</div>
			</div>

			<div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
				<div class="flex items-center">
					<div class="p-2 bg-gray-100 rounded-lg">
						<X class="w-6 h-6 text-gray-600" />
					</div>
					<div class="ml-4">
						<p class="text-sm font-medium text-gray-600">Dismissed</p>
						<p class="text-2xl font-bold text-gray-900">{stats.dismissed}</p>
					</div>
				</div>
			</div>

			<div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
				<div class="flex items-center">
					<div class="p-2 bg-purple-100 rounded-lg">
						<Flag class="w-6 h-6 text-purple-600" />
					</div>
					<div class="ml-4">
						<p class="text-sm font-medium text-gray-600">Total</p>
						<p class="text-2xl font-bold text-gray-900">{stats.total}</p>
					</div>
				</div>
			</div>
		</div>

		<!-- Filters -->
		<div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
			<div class="grid grid-cols-1 md:grid-cols-3 gap-4">
				<div>
				<label for="status-filter" class="block text-sm font-medium text-gray-700 mb-2">
					Status
				</label>
				<select
					id="status-filter"
					bind:value={statusFilter}
					onchange={applyFilters}
					class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
				>
						{#each statusOptions as option (option.value)}
							<option value={option.value}>{option.label}</option>
						{/each}
					</select>
				</div>

				<div>
				<label for="type-filter" class="block text-sm font-medium text-gray-700 mb-2">
					Type
				</label>
				<select
					id="type-filter"
					bind:value={typeFilter}
					onchange={applyFilters}
					class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
				>
						{#each typeOptions as option (option.value)}
							<option value={option.value}>{option.label}</option>
						{/each}
					</select>
				</div>

				<div>
				<label for="sort-by" class="block text-sm font-medium text-gray-700 mb-2">
					Sort By
				</label>
				<select
					id="sort-by"
					bind:value={sortBy}
					onchange={applyFilters}
					class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
				>
						{#each sortOptions as option (option.value)}
							<option value={option.value}>{option.label}</option>
						{/each}
					</select>
				</div>
			</div>
		</div>

		<!-- Reports List -->
		{#if error}
			<div class="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
				<AlertCircle class="w-12 h-12 text-red-500 mx-auto mb-4" />
				<h3 class="text-lg font-medium text-red-900 mb-2">Error Loading Reports</h3>
				<p class="text-red-700">{error}</p>
				<button
					onclick={() => loadReports(true)}
					class="mt-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
				>
					Try Again
				</button>
			</div>
		{:else if reports.length > 0}
			<div class="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
				<div class="overflow-x-auto">
					<table class="min-w-full divide-y divide-gray-200">
						<thead class="bg-gray-50">
							<tr>
								<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
									Report
								</th>
								<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
									Type
								</th>
								<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
									Status
								</th>
								<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
									Reporter
								</th>
								<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
									Date
								</th>
								<th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
									Actions
								</th>
							</tr>
						</thead>
						<tbody class="bg-white divide-y divide-gray-200">
							{#each reports as report (report.id)}
								<tr class="hover:bg-gray-50">
									<td class="px-6 py-4">
										<div class="max-w-xs">
											<p class="text-sm font-medium text-gray-900 truncate">
												{report.reason}
											</p>
											{#if report.description}
												<p class="text-sm text-gray-500 truncate">
													{report.description}
												</p>
											{/if}
										</div>
									</td>
									<td class="px-6 py-4 whitespace-nowrap">
										<div class="flex items-center">
											<svelte:component this={getIconComponent(getTypeIcon(report.type))} class="w-5 h-5 text-gray-400 mr-2" />
											<span class="text-sm text-gray-900">{report.type}</span>
										</div>
									</td>
									<td class="px-6 py-4 whitespace-nowrap">
										<span class="px-2 py-1 text-xs font-medium rounded-full {getStatusColor(report.status)}">
											{report.status}
										</span>
									</td>
									<td class="px-6 py-4 whitespace-nowrap">
										<div class="text-sm text-gray-900">{report.reporter.name}</div>
										<div class="text-sm text-gray-500">{report.reporter.email}</div>
									</td>
									<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
										{formatDate(report.createdAt)}
									</td>
									<td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
										<button
												onclick={() => openReportModal(report)}
												class="text-blue-600 hover:text-blue-900 transition-colors"
											>
											View Details
										</button>
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>

				<!-- Load More -->
				{#if hasMore}
					<div class="px-6 py-4 border-t border-gray-200 text-center">
						<button
							onclick={loadMore}
							disabled={loading}
							class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
						>
							{#if loading}
								<Loader2 class="w-4 h-4 animate-spin mr-2" />
								Loading...
							{:else}
								Load More
							{/if}
						</button>
					</div>
				{/if}
			</div>
		{:else if !loading}
			<div class="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
				<Flag class="w-16 h-16 text-gray-400 mx-auto mb-4" />
				<h3 class="text-lg font-medium text-gray-900 mb-2">No Reports Found</h3>
				<p class="text-gray-600">There are no moderation reports matching your filters.</p>
			</div>
		{/if}

		<!-- Loading State -->
		{#if loading && reports.length === 0}
			<div class="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
				<Loader2 class="w-12 h-12 text-gray-400 mx-auto mb-4 animate-spin" />
				<p class="text-gray-600">Loading reports...</p>
			</div>
		{/if}
	</div>
</div>

<!-- Report Details Modal -->
{#if showModal && selectedReport}
	<div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
		<div class="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
			<div class="p-6">
				<!-- Modal Header -->
				<div class="flex items-center justify-between mb-6">
					<h2 class="text-xl font-semibold text-gray-900">Report Details</h2>
					<button
						onclick={closeModal}
						class="p-2 hover:bg-gray-100 rounded-full transition-colors"
					>
						<X class="w-5 h-5" />
					</button>
				</div>

				<!-- Report Info -->
				<div class="space-y-6">
					<div class="grid grid-cols-2 gap-4">
						<div>
						<div class="block text-sm font-medium text-gray-700 mb-1">Type</div>
						<div class="flex items-center">
							<svelte:component this={getIconComponent(getTypeIcon(selectedReport.type))} class="w-5 h-5 text-gray-400 mr-2" />
							<span>{selectedReport.type}</span>
						</div>
					</div>
					<div>
						<div class="block text-sm font-medium text-gray-700 mb-1">Status</div>
						<span class="px-2 py-1 text-xs font-medium rounded-full {getStatusColor(selectedReport.status)}">
								{selectedReport.status}
							</span>
						</div>
					</div>

					<div>
					<div class="block text-sm font-medium text-gray-700 mb-1">Reason</div>
					<p class="text-gray-900">{selectedReport.reason}</p>
				</div>

					{#if selectedReport.description}
						<div>
						<div class="block text-sm font-medium text-gray-700 mb-1">Description</div>
						<p class="text-gray-900">{selectedReport.description}</p>
					</div>
					{/if}

					<div>
					<div class="block text-sm font-medium text-gray-700 mb-1">Reporter</div>
					<p class="text-gray-900">{selectedReport.reporter.name} ({selectedReport.reporter.email})</p>
				</div>

					<!-- Content Details -->
					{#if selectedReport.review}
						<div class="border-t pt-6">
							<h3 class="text-lg font-medium text-gray-900 mb-4">Reported Review</h3>
							<div class="bg-gray-50 rounded-lg p-4">
								<h4 class="font-medium text-gray-900 mb-2">{selectedReport.review.title}</h4>
								<p class="text-gray-700 mb-2">{selectedReport.review.content}</p>
								<p class="text-sm text-gray-500">By: {selectedReport.review.user.name}</p>
							</div>
						</div>
					{/if}

					{#if selectedReport.build}
						<div class="border-t pt-6">
							<h3 class="text-lg font-medium text-gray-900 mb-4">Reported Build</h3>
							<div class="bg-gray-50 rounded-lg p-4">
								<h4 class="font-medium text-gray-900 mb-2">{selectedReport.build.name}</h4>
								<p class="text-gray-700 mb-2">{selectedReport.build.description}</p>
								<p class="text-sm text-gray-500">By: {selectedReport.build.user.name}</p>
							</div>
						</div>
					{/if}

					{#if selectedReport.user}
						<div class="border-t pt-6">
							<h3 class="text-lg font-medium text-gray-900 mb-4">Reported User</h3>
							<div class="bg-gray-50 rounded-lg p-4">
								<p class="font-medium text-gray-900">{selectedReport.user.name}</p>
								<p class="text-gray-700">{selectedReport.user.email}</p>
							</div>
						</div>
					{/if}

					<!-- Moderation Actions -->
					{#if selectedReport.status === 'PENDING'}
						<div class="border-t pt-6">
							<h3 class="text-lg font-medium text-gray-900 mb-4">Moderation Actions</h3>
							<div class="grid grid-cols-2 gap-3">
								{#each moderationActions as action (action.value)}
									<button
										onclick={() => selectedReport && handleModerationAction(action.value, selectedReport.id)}
										class="flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
									>
										<svelte:component this={getIconComponent(action.icon)} class="w-4 h-4 mr-2" />
										{action.label}
									</button>
								{/each}
							</div>
						</div>
					{/if}
				</div>
			</div>
		</div>
	</div>
{/if}