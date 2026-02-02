<!-- HOMELAB HARDWARE PLATFORM HOMEPAGE -->
<!-- Modern landing page with enterprise features showcase -->

<script lang="ts">
  import type { PageData } from './$types';
  import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card';
  import { Server, TrendingUp, Search, Users, Database, Zap } from 'lucide-svelte';

  export let data: PageData;

  const iconMap = {
    'Enterprise Hardware': Server,
    'Price Tracking': TrendingUp,
    'Advanced Search': Search,
    'Community Builds': Users,
    'Comprehensive Database': Database,
    'Performance Insights': Zap
  };

  const { stats, features } = data;
</script>

<svelte:head>
  <title>Homelab Hardware Platform - Enterprise Surplus & Used Hardware</title>
  <meta name="description" content="Find the best deals on used enterprise hardware for your homelab. Compare prices, track trends, and connect with the community." />
</svelte:head>

<!-- Hero Section -->
<section class="bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 py-20">
  <div class="container mx-auto px-4">
    <div class="text-center max-w-4xl mx-auto">
      <h1 class="text-5xl font-bold text-gray-900 dark:text-white mb-6">
        Build Your Dream Homelab
        <span class="text-blue-600 dark:text-blue-400">For Less</span>
      </h1>
      <p class="text-xl text-gray-600 dark:text-gray-300 mb-8 leading-relaxed">
        Discover enterprise-grade used hardware at unbeatable prices. Compare specifications, 
        track price history, and connect with thousands of homelab enthusiasts.
      </p>
      <div class="flex flex-col sm:flex-row gap-4 justify-center">
        <a href="/build-creator" class="bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-8 rounded-lg text-lg transition-colors duration-200">
          🔧 Build My Homelab
        </a>
        <a href="/hardware" class="border border-blue-600 text-blue-600 hover:bg-blue-50 font-medium py-3 px-8 rounded-lg text-lg transition-colors duration-200">
          Browse Hardware
        </a>
        <a href="/builds" class="border border-gray-400 text-gray-600 hover:bg-gray-50 font-medium py-3 px-8 rounded-lg text-lg transition-colors duration-200">
          Community Builds
        </a>
      </div>
    </div>
  </div>
</section>

<!-- Stats Section -->
<section class="py-16 bg-white dark:bg-gray-900">
  <div class="container mx-auto px-4">
    <div class="grid grid-cols-2 md:grid-cols-4 gap-8">
      {#each stats as stat (stat.label)}
        <div class="text-center">
          <div class="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-2">
            {stat.value}
          </div>
          <div class="text-gray-600 dark:text-gray-300">
            {stat.label}
          </div>
        </div>
      {/each}
    </div>
  </div>
</section>

<!-- Features Section -->
<section class="py-20 bg-gray-50 dark:bg-gray-800">
  <div class="container mx-auto px-4">
    <div class="text-center mb-16">
      <h2 class="text-3xl font-bold text-gray-900 dark:text-white mb-4">
        Everything You Need for Your Homelab
      </h2>
      <p class="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
        From hardware discovery to community builds, we provide all the tools 
        and resources you need to build an amazing homelab.
      </p>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      {#each features as feature (feature.title)}
        <Card class="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
          <CardHeader>
            <div class="flex items-center gap-4">
              <div class="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <svelte:component this={iconMap[feature.title as keyof typeof iconMap]} class="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <CardTitle class="text-lg">{feature.title}</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <CardDescription class="text-base leading-relaxed">
              {feature.description}
            </CardDescription>
          </CardContent>
        </Card>
      {/each}
    </div>
  </div>
</section>

<!-- CTA Section -->
<section class="py-20 bg-blue-600 dark:bg-blue-700">
  <div class="container mx-auto px-4 text-center">
    <h2 class="text-3xl font-bold text-white mb-4">
      Ready to Start Building?
    </h2>
    <p class="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
      Join thousands of homelab enthusiasts who trust our platform to find the best hardware deals.
    </p>
    <div class="flex flex-col sm:flex-row gap-4 justify-center">
      <a href="/auth/signin" class="bg-white text-blue-600 font-medium py-3 px-8 rounded-lg text-lg transition-colors duration-200 hover:bg-gray-100">
        Create Account
      </a>
      <a href="/hardware" class="border border-white text-white hover:bg-white hover:text-blue-600 font-medium py-3 px-8 rounded-lg text-lg transition-colors duration-200">
        Browse Hardware
      </a>
    </div>
  </div>
</section>
