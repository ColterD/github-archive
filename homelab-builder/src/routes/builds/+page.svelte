<!-- BUILDS LISTING PAGE - Community build showcase with filtering -->
<!-- Modern, responsive layout for discovering and browsing user builds -->

<script lang="ts">
	import type { PageData } from './$types';
	import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import {
		Cpu,
		MemoryStick,
		HardDrive,
		Monitor,
		Zap,

		TrendingUp,
		Star,
		Search,
		Grid3X3,
		List,
		Eye,
		Heart,
		User,
		Server
	} from 'lucide-svelte';

	import { Input } from '$lib/components/ui/input';

	export let data: PageData;

	const { builds } = data;
	
	// State for search functionality (will be implemented later)
	let searchQuery = '';
	let viewMode: 'grid' | 'list' = 'grid';
	let _selectedCategory = '';
	let selectedDifficulty = '';
	let selectedSort = 'newest';
	
	// Pagination data from server
	const { totalPages, currentPage, totalCount } = data;
	
	// Get featured builds from the builds array
	const featuredBuilds = builds.filter(build => build.isFeatured).slice(0, 5);
	const categoryIcons = {
		SERVER: Server,
		STORAGE: HardDrive,
		NETWORKING: Monitor,
		VIRTUALIZATION: Cpu,
		COMPONENTS: MemoryStick,
		ACCESSORIES: Zap
	};


	
	function handleSearch() {
		// Search functionality will be implemented
	}
	
	function updateFilters() {
		// Filter functionality will be implemented
	}
	
	function getDifficultyColor(difficulty: string) {
		switch (difficulty) {
			case 'BEGINNER': return 'bg-green-100 text-green-800';
			case 'INTERMEDIATE': return 'bg-yellow-100 text-yellow-800';
			case 'ADVANCED': return 'bg-orange-100 text-orange-800';
			case 'EXPERT': return 'bg-red-100 text-red-800';
			default: return 'bg-gray-100 text-gray-800';
		}
	}
</script>

<svelte:head>
  <title>Community Builds | Homelab Hardware Platform</title>
  <meta name="description" content="Discover and share homelab builds from the community. Browse enterprise hardware configurations for every budget and use case." />
</svelte:head>

<div class="container mx-auto px-4 py-8">
  <!-- Header -->
  <div class="mb-8">
    <h1 class="text-3xl font-bold mb-2">Community Builds</h1>
    <p class="text-muted-foreground">
      Discover and share homelab builds from the community. Find inspiration for your next enterprise hardware setup.
    </p>
  </div>

  <div class="flex flex-col lg:flex-row gap-8">
    <!-- Main Content -->
    <div class="flex-1">
      <!-- Search and Filters -->
      <div class="bg-card border rounded-lg p-6 mb-6">
        <div class="flex flex-col md:flex-row gap-4 mb-4">
          <!-- Search -->
          <div class="flex-1">
            <div class="relative">
              <Search class="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search builds..."
                class="pl-10"
                bind:value={searchQuery}
                oninput={handleSearch}
              />
            </div>
          </div>

          <!-- View Toggle -->
          <div class="flex bg-muted rounded-lg p-1">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="sm"
              class="px-3"
              onclick={() => viewMode = 'grid'}
            >
              <Grid3X3 class="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              class="px-3"
              onclick={() => viewMode = 'list'}
            >
              <List class="w-4 h-4" />
            </Button>
          </div>
        </div>

        <!-- Filter Controls -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <!-- Difficulty Filter -->
          <div>
            <label for="difficulty-filter" class="block text-sm font-medium mb-2">Difficulty</label>
            <select
              id="difficulty-filter"
              class="w-full p-2 border rounded-md bg-background"
              bind:value={selectedDifficulty}
              onchange={updateFilters}
            >
              <option value="">All Levels</option>
              <option value="BEGINNER">Beginner</option>
              <option value="INTERMEDIATE">Intermediate</option>
              <option value="ADVANCED">Advanced</option>
              <option value="EXPERT">Expert</option>
            </select>
          </div>

          <!-- Sort Options -->
          <div>
            <label for="sort-filter" class="block text-sm font-medium mb-2">Sort By</label>
            <select
              id="sort-filter"
              class="w-full p-2 border rounded-md bg-background"
              bind:value={selectedSort}
              onchange={updateFilters}
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="popular">Most Viewed</option>
              <option value="liked">Most Liked</option>
              <option value="featured">Featured</option>
              <option value="name">Name A-Z</option>
            </select>
          </div>

          <!-- Results Info -->
          <div class="flex items-end">
            <div class="text-sm text-muted-foreground">
              Showing {builds.length} of {totalCount} builds
            </div>
          </div>
        </div>
      </div>

      <!-- Builds Grid/List -->
      {#if viewMode === 'grid'}
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {#each builds as build (build.id || build.slug)}
            <Card class="hover:shadow-lg transition-shadow">
              <!-- Build Images/Preview -->
              <div class="aspect-video bg-muted rounded-t-lg relative overflow-hidden">
                {#if build.images && JSON.parse(build.images).length > 0}
                  <img 
                    src={JSON.parse(build.images)[0]} 
                    alt={build.name}
                    class="w-full h-full object-cover"
                  />
                {:else}
                  <div class="w-full h-full flex items-center justify-center">
                    <Server class="w-12 h-12 text-muted-foreground" />
                  </div>
                {/if}
                
                <!-- Hardware Category Icons -->
                <div class="absolute top-2 right-2 flex gap-1">
                  {#each build.buildItems || [] as item (item.id)}
                    {@const IconComponent = categoryIcons[item.hardwareItem.category as keyof typeof categoryIcons]}
                    {#if IconComponent}
                      <Badge variant="secondary" class="p-1">
                        <svelte:component this={IconComponent} class="w-3 h-3" />
                      </Badge>
                    {/if}
                  {/each}
                </div>
              </div>

              <CardHeader>
                <CardTitle class="text-lg leading-tight">{build.name}</CardTitle>
                <CardDescription class="line-clamp-2">{build.description}</CardDescription>
              </CardHeader>

              <CardContent class="space-y-3">
                <!-- Build Stats -->
                <div class="flex items-center justify-between text-sm">
                  <div class="flex items-center gap-4">
                    <div class="flex items-center gap-1">
                      <Eye class="w-4 h-4 text-muted-foreground" />
                      <span>{build.viewCount}</span>
                    </div>
                    <div class="flex items-center gap-1">
                      <Heart class="w-4 h-4 text-muted-foreground" />
                      <span>{build.likeCount}</span>
                    </div>
                  </div>
                  {#if build.difficulty}
                    <Badge class={getDifficultyColor(build.difficulty)}>
                      {build.difficulty.toLowerCase()}
                    </Badge>
                  {/if}
                </div>

                <!-- Author -->
                <div class="flex items-center gap-2">
                  <User class="w-4 h-4 text-muted-foreground" />
                  <span class="text-sm text-muted-foreground">
                    {build.user.name || build.user.username}
                  </span>
                </div>

                <!-- Component Count -->
                <div class="flex items-center gap-2">
                  <span class="text-xs text-muted-foreground">
                    {build._count.buildItems} components  
                  </span>
                  {#if build.totalCost}
                    <span class="text-xs text-muted-foreground">
                      • ${build.totalCost.toLocaleString()}
                    </span>
                  {/if}
                </div>

                <!-- Action Button -->
                <Button 
                  href="/builds/{build.slug}" 
                  variant="outline" 
                  size="sm" 
                  class="w-full mt-3"
                >
                  View Build
                </Button>
              </CardContent>
            </Card>
          {/each}
        </div>
      {:else}
        <!-- List View -->
        <div class="space-y-4">
          {#each builds as build (build.id || build.slug)}
            <Card class="hover:shadow-md transition-shadow">
              <CardContent class="p-6">
                <div class="flex gap-4">
                  <!-- Build Thumbnail -->
                  <div class="w-20 h-20 bg-muted rounded-lg flex-shrink-0 overflow-hidden">
                    {#if build.images && JSON.parse(build.images).length > 0}
                      <img 
                        src={JSON.parse(build.images)[0]} 
                        alt={build.name}
                        class="w-full h-full object-cover"
                      />
                    {:else}
                      <div class="w-full h-full flex items-center justify-center">
                        <Server class="w-6 h-6 text-muted-foreground" />
                      </div>
                    {/if}
                  </div>

                  <!-- Build Info -->
                  <div class="flex-1 min-w-0">
                    <div class="flex items-start justify-between">
                      <!-- Hardware Category Icons -->
                      <div class="flex items-center gap-2">
                        {#each build.buildItems || [] as item (item.id)}
                          {@const IconComponent = categoryIcons[item.hardwareItem.category as keyof typeof categoryIcons]}
                          {#if IconComponent}
                            <svelte:component this={IconComponent} class="w-4 h-4 text-muted-foreground" />
                          {/if}
                        {/each}
                      </div>
                      {#if build.isFeatured}
                        <Badge variant="secondary" class="ml-2">
                          <Star class="w-3 h-3 mr-1" />
                          Featured
                        </Badge>
                      {/if}
                    </div>

                    <div class="flex-1">
                      <CardTitle class="text-lg leading-tight">{build.name}</CardTitle>
                      <CardDescription class="mt-1">
                        {build.description}
                      </CardDescription>
                    </div>

                    <div class="flex items-center justify-between mt-3">
                      <div class="flex items-center gap-4 text-sm text-muted-foreground">
                        <div class="flex items-center gap-1">
                          <User class="w-4 h-4" />
                          <span class="text-muted-foreground">
                            {build.user.name || build.user.username}
                          </span>
                        </div>
                        <div class="flex items-center gap-1">
                          <Eye class="w-4 h-4" />
                          <span>{build.viewCount}</span>
                        </div>
                        <div class="flex items-center gap-1">
                          <Heart class="w-4 h-4" />
                          <span>{build.likeCount}</span>
                        </div>
                        <span class="text-xs text-muted-foreground">
                          {build._count.buildItems} components
                        </span>
                      </div>

                      <Button href="/builds/{build.slug}" variant="outline" size="sm">
                        View Build
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          {/each}
        </div>
      {/if}

      <!-- Pagination -->
      {#if totalPages > 1}
        <div class="flex justify-center mt-8">
          <div class="flex gap-2">
            {#if currentPage > 1}
              <Button
                href="?page={currentPage - 1}"
                variant="outline"
                size="sm"
              >
                Previous
              </Button>
            {/if}

            {#each Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const start = Math.max(1, currentPage - 2);
              return start + i;
            }) as pageNum (pageNum)}
              {#if pageNum <= totalPages}
                <Button
                  href="?page={pageNum}"
                  variant={pageNum === currentPage ? 'default' : 'outline'}
                  size="sm"
                >
                  {pageNum}
                </Button>
              {/if}
            {/each}

            {#if currentPage < totalPages}
              <Button
                href="?page={currentPage + 1}"
                variant="outline"
                size="sm"
              >
                Next
              </Button>
            {/if}
          </div>
        </div>
      {/if}

      <!-- No Results -->
      {#if builds.length === 0}
        <div class="text-center py-12">
          <Server class="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h3 class="text-lg font-semibold mb-2">No builds found</h3>
          <p class="text-muted-foreground mb-4">
            Try adjusting your search criteria or browse all builds.
          </p>
          <Button onclick={() => { searchQuery = ''; _selectedCategory = ''; selectedDifficulty = ''; updateFilters(); }}>
            Clear Filters
          </Button>
        </div>
      {/if}
    </div>

    <!-- Sidebar -->
    <div class="lg:w-80 space-y-6">
      <!-- Featured Builds -->
      {#if featuredBuilds.length > 0}
        <Card>
          <CardHeader>
            <CardTitle class="flex items-center gap-2">
              <Star class="w-5 h-5" />
              Featured Builds
            </CardTitle>
          </CardHeader>
          <CardContent class="space-y-4">
            {#each featuredBuilds as build (build.id || build.slug)}
              <div class="border-b last:border-b-0 pb-4 last:pb-0">
                <a href="/builds/{build.slug}" class="block hover:bg-muted -m-2 p-2 rounded">
                  <h4 class="font-medium text-sm mb-1">{build.name}</h4>
                  <p class="text-xs text-muted-foreground mb-2 line-clamp-2">
                    {build.description}
                  </p>
                  <div class="flex items-center justify-between text-xs text-muted-foreground">
                    <span>by {build.user.name || build.user.username}</span>
                    <span>{build._count.buildItems} parts</span>
                  </div>
                </a>
              </div>
            {/each}
          </CardContent>
        </Card>
      {/if}

      <!-- Build Tips -->
      <Card>
        <CardHeader>
          <CardTitle class="flex items-center gap-2">
            <TrendingUp class="w-5 h-5" />
            Build Tips
          </CardTitle>
        </CardHeader>
        <CardContent class="space-y-3 text-sm">
          <div class="p-3 bg-muted rounded-lg">
            <h4 class="font-medium mb-1">Plan Your Power</h4>
            <p class="text-muted-foreground text-xs">
              Calculate total power consumption before buying. Enterprise hardware can be power-hungry.
            </p>
          </div>
          <div class="p-3 bg-muted rounded-lg">
            <h4 class="font-medium mb-1">Check Compatibility</h4>
            <p class="text-muted-foreground text-xs">
              Verify RAM, storage, and network card compatibility with your chosen server.
            </p>
          </div>
          <div class="p-3 bg-muted rounded-lg">
            <h4 class="font-medium mb-1">Consider Noise</h4>
            <p class="text-muted-foreground text-xs">
              Enterprise fans can be loud. Factor in noise levels for home lab setups.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  </div>
</div>

<style>
  .line-clamp-2 {
    overflow: hidden;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    line-clamp: 2;
  }
</style>