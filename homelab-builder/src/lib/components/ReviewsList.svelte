<!-- REVIEWS LIST COMPONENT - Display hardware item reviews -->
<script lang="ts">
  import { onMount } from 'svelte';
  import { Button } from '$lib/components/ui/button';
  import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
  import { Badge } from '$lib/components/ui/badge';
  import { Separator } from '$lib/components/ui/separator';
  import { 
    Star, 
    ThumbsUp, 
    ThumbsDown, 
    User, 
    Calendar,
    Edit,
    Trash2
  } from 'lucide-svelte';
  import { formatDate } from '$lib/utils';
  import ReviewForm from './ReviewForm.svelte';
  import { toast } from 'svelte-sonner';
  import type { ReviewWithUser } from '$lib/types/database';

  interface RatingDistribution {
    rating: number;
    count: number;
  }

  export let hardwareItemId: string;
  export let currentUserId: string | null = null;

  // State
  let reviews: ReviewWithUser[] = [];
  let stats = {
    averageRating: 0,
    totalReviews: 0,
    distribution: [] as RatingDistribution[]
  };
  let pagination = {
    page: 1,
    limit: 10,
    totalCount: 0,
    totalPages: 0
  };
  let isLoading = true;
  let sortBy = 'newest';
  let showReviewForm = false;
  let editingReview: ReviewWithUser | null = null;

  // Sort options
  const sortOptions = [
    { value: 'newest', label: 'Newest First' },
    { value: 'oldest', label: 'Oldest First' },
    { value: 'rating-high', label: 'Highest Rating' },
    { value: 'rating-low', label: 'Lowest Rating' },
    { value: 'helpful', label: 'Most Helpful' }
  ];

  onMount(() => {
    loadReviews();
  });

  async function loadReviews() {
    isLoading = true;
    try {
      const params = new URLSearchParams({
        hardwareItemId,
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        sortBy
      });

      const response = await fetch(`/api/reviews?${params}`);
      if (response.ok) {
        const data = await response.json();
        reviews = data.reviews;
        stats = data.stats;
        pagination = data.pagination;
      } else {
        toast.error('Failed to load reviews');
      }
    } catch {
       // Error loading reviews
       toast.error('Error loading reviews');
    } finally {
      isLoading = false;
    }
  }

  function handleSortChange(event: Event) {
    const target = event.target as HTMLSelectElement;
    sortBy = target.value;
    pagination.page = 1;
    loadReviews();
  }

  function handlePageChange(newPage: number) {
    pagination.page = newPage;
    loadReviews();
  }

  function handleReviewSuccess() {
    showReviewForm = false;
    editingReview = null;
    loadReviews();
  }

  function handleReviewCancel() {
    showReviewForm = false;
    editingReview = null;
  }

  function startEditReview(review: ReviewWithUser) {
    editingReview = review;
    showReviewForm = true;
  }

  async function deleteReview(reviewId: string) {
    if (!confirm('Are you sure you want to delete this review?')) {
      return;
    }

    try {
      const response = await fetch('/api/reviews', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ reviewId })
      });

      if (response.ok) {
        toast.success('Review deleted successfully');
        loadReviews();
      } else {
        const errorResponse = await response.json();
        toast.error(errorResponse.error || 'Failed to delete review');
      }
    } catch {
       // Error deleting review
       toast.error('Error deleting review');
    }
  }

  function canEditReview(review: ReviewWithUser): boolean {
    return currentUserId === review.user.id;
  }

  function getStarArray(rating: number): boolean[] {
    return Array.from({ length: 5 }, (_, i) => i < rating);
  }

  function getRatingDistributionPercentage(rating: number): number {
    if (stats.totalReviews === 0) return 0;
    const ratingData = stats.distribution.find((d: { rating: number; count: number }) => d.rating === rating);
    return ratingData ? ((ratingData as { count: number }).count / stats.totalReviews) * 100 : 0;
  }
</script>

<div class="space-y-6">
  <!-- Reviews Header & Stats -->
  <Card>
    <CardHeader>
      <div class="flex items-center justify-between">
        <CardTitle class="flex items-center gap-2">
          <Star class="w-5 h-5 text-yellow-500" />
          Reviews ({stats.totalReviews})
        </CardTitle>
        
        {#if currentUserId && !showReviewForm}
          <Button onclick={() => showReviewForm = true}>
            Write a Review
          </Button>
        {/if}
      </div>
    </CardHeader>
    
    {#if stats.totalReviews > 0}
      <CardContent>
        <div class="grid md:grid-cols-2 gap-6">
          <!-- Average Rating -->
          <div class="text-center">
            <div class="text-4xl font-bold mb-2">{stats.averageRating}</div>
            <div class="flex justify-center mb-2">
              {#each getStarArray(Math.round(stats.averageRating)) as filled, i (i)}
                <Star class="w-5 h-5 {filled ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}" />
              {/each}
            </div>
            <div class="text-sm text-muted-foreground">
              Based on {stats.totalReviews} review{stats.totalReviews !== 1 ? 's' : ''}
            </div>
          </div>

          <!-- Rating Distribution -->
          <div class="space-y-2">
            {#each [5, 4, 3, 2, 1] as rating (rating)}
                {@const percentage = getRatingDistributionPercentage(rating)}
                {@const count = stats.distribution.find((d) => d.rating === rating)?.count || 0}
              <div class="flex items-center gap-2 text-sm">
                <span class="w-8">{rating}</span>
                <Star class="w-4 h-4 fill-yellow-400 text-yellow-400" />
                <div class="flex-1 bg-gray-200 rounded-full h-2">
                  <div 
                    class="bg-yellow-400 h-2 rounded-full transition-all duration-300"
                    style="width: {percentage}%"
                  ></div>
                </div>
                <span class="w-8 text-right">{count}</span>
              </div>
            {/each}
          </div>
        </div>
      </CardContent>
    {/if}
  </Card>

  <!-- Review Form -->
  {#if showReviewForm}
    <ReviewForm 
      {hardwareItemId}
      existingReview={editingReview}
      isEditing={!!editingReview}
      on:success={handleReviewSuccess}
      on:cancel={handleReviewCancel}
    />
  {/if}

  <!-- Reviews List -->
  {#if stats.totalReviews > 0}
    <Card>
      <CardHeader>
        <div class="flex items-center justify-between">
          <h3 class="text-lg font-semibold">Customer Reviews</h3>
          
          <!-- Sort Controls -->
          <div class="flex items-center gap-2">
            <label for="sort-reviews" class="text-sm font-medium">Sort by:</label>
            <select 
              id="sort-reviews"
              class="text-sm border rounded px-2 py-1 bg-background"
              value={sortBy}
              onchange={handleSortChange}
            >
              {#each sortOptions as option (option.value)}
                <option value={option.value}>{option.label}</option>
              {/each}
            </select>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        {#if isLoading}
          <div class="text-center py-8">
            <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p class="mt-2 text-muted-foreground">Loading reviews...</p>
          </div>
        {:else}
          <div class="space-y-6">
            {#each reviews as review, index (review.id)}
              <div class="space-y-3">
                <!-- Review Header -->
                <div class="flex items-start justify-between">
                  <div class="flex items-center gap-3">
                    <div class="w-10 h-10 bg-muted rounded-full flex items-center justify-center">
                      {#if review.user.avatar}
                        <img
                          src={review.user.avatar}
                          alt={review.user.name}
                          class="w-10 h-10 rounded-full"
                        />
                      {:else}
                        <User class="w-5 h-5 text-muted-foreground" />
                      {/if}
                    </div>
                    <div>
                      <div class="font-medium">{review.user.name}</div>
                      <div class="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar class="w-3 h-3" />
                        {formatDate(review.createdAt)}
                        {#if review.verified}
                          <Badge variant="outline" class="text-xs bg-green-50 text-green-700 border-green-200">
                            Verified Purchase
                          </Badge>
                        {/if}
                      </div>
                    </div>
                  </div>
                  
                  <!-- Review Actions -->
                  {#if canEditReview(review)}
                    <div class="flex items-center gap-1">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onclick={() => startEditReview(review)}
                      >
                        <Edit class="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onclick={() => deleteReview(review.id)}
                      >
                        <Trash2 class="w-4 h-4" />
                      </Button>
                    </div>
                  {/if}
                </div>

                <!-- Rating & Title -->
                <div>
                  <div class="flex items-center gap-2 mb-2">
                    <div class="flex">
                      {#each getStarArray(review.rating) as filled, i (i)}
                        <Star class="w-4 h-4 {filled ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}" />
                      {/each}
                    </div>
                    <span class="text-sm text-muted-foreground">({review.rating}/5)</span>
                  </div>
                  <h4 class="font-semibold text-lg">{review.title}</h4>
                </div>

                <!-- Review Content -->
                <div class="prose prose-sm max-w-none">
                  <p class="text-muted-foreground leading-relaxed">{review.content}</p>
                </div>

                <!-- Pros & Cons -->
                {#if review.pros || review.cons}
                  <div class="grid md:grid-cols-2 gap-4">
                    {#if review.pros}
                      {@const pros = JSON.parse(review.pros)}
                      {#if pros.length > 0}
                        <div>
                          <h5 class="font-medium text-green-700 mb-2 flex items-center gap-1">
                            <ThumbsUp class="w-4 h-4" />
                            Pros
                          </h5>
                          <ul class="space-y-1">
                            {#each pros as pro, i (i)}
                              <li class="text-sm text-green-600 flex items-start gap-1">
                                <span class="text-green-500 mt-1">•</span>
                                {pro}
                              </li>
                            {/each}
                          </ul>
                        </div>
                      {/if}
                    {/if}
                    
                    {#if review.cons}
                      {@const cons = JSON.parse(review.cons)}
                      {#if cons.length > 0}
                        <div>
                          <h5 class="font-medium text-red-700 mb-2 flex items-center gap-1">
                            <ThumbsDown class="w-4 h-4" />
                            Cons
                          </h5>
                          <ul class="space-y-1">
                            {#each cons as con, i (i)}
                              <li class="text-sm text-red-600 flex items-start gap-1">
                                <span class="text-red-500 mt-1">•</span>
                                {con}
                              </li>
                            {/each}
                          </ul>
                        </div>
                      {/if}
                    {/if}
                  </div>
                {/if}

                <!-- Recommendation -->
                {#if review.wouldRecommend !== null}
                  <div class="flex items-center gap-2">
                    {#if review.wouldRecommend}
                      <ThumbsUp class="w-4 h-4 text-green-600" />
                      <span class="text-sm text-green-600 font-medium">Recommends this product</span>
                    {:else}
                      <ThumbsDown class="w-4 h-4 text-red-600" />
                      <span class="text-sm text-red-600 font-medium">Does not recommend this product</span>
                    {/if}
                  </div>
                {/if}

                {#if index < reviews.length - 1}
                  <Separator class="mt-6" />
                {/if}
              </div>
            {/each}
          </div>

          <!-- Pagination -->
          {#if pagination.totalPages > 1}
            <div class="flex justify-center items-center gap-2 mt-8">
              <Button 
                variant="outline" 
                size="sm"
                disabled={pagination.page <= 1}
                onclick={() => handlePageChange(pagination.page - 1)}
              >
                Previous
              </Button>
              
              <span class="text-sm text-muted-foreground px-4">
                Page {pagination.page} of {pagination.totalPages}
              </span>
              
              <Button 
                variant="outline" 
                size="sm"
                disabled={pagination.page >= pagination.totalPages}
                onclick={() => handlePageChange(pagination.page + 1)}
              >
                Next
              </Button>
            </div>
          {/if}
        {/if}
      </CardContent>
    </Card>
  {:else if !isLoading}
    <Card>
      <CardContent class="text-center py-12">
        <Star class="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <h3 class="text-lg font-semibold mb-2">No reviews yet</h3>
        <p class="text-muted-foreground mb-4">
          Be the first to share your experience with this hardware!
        </p>
        {#if currentUserId}
          <Button onclick={() => showReviewForm = true}>
            Write the First Review
          </Button>
        {/if}
      </CardContent>
    </Card>
  {/if}
</div>