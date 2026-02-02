<!-- REVIEW FORM COMPONENT - Hardware item review submission -->
<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { Button } from '$lib/components/ui/button';
  import { Input } from '$lib/components/ui/input';
  import { Label } from '$lib/components/ui/label';
  import { Textarea } from '$lib/components/ui/textarea';
  import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
  import { Badge } from '$lib/components/ui/badge';
  import { Star, Plus, X, ThumbsUp, ThumbsDown } from 'lucide-svelte';
  import { toast } from 'svelte-sonner';
  import type { ReviewWithUser } from '$lib/types/database';

  export let hardwareItemId: string;
  export let existingReview: ReviewWithUser | null = null;
  export let isEditing = false;

  const dispatch = createEventDispatcher();

  // Form state
  let rating = existingReview?.rating || 0;
  let title = existingReview?.title || '';
  let content = existingReview?.content || '';
  let pros: string[] = existingReview?.pros ? JSON.parse(existingReview.pros as string) : [];
  let cons: string[] = existingReview?.cons ? JSON.parse(existingReview.cons as string) : [];
  let wouldRecommend = existingReview?.wouldRecommend ?? true;
  let isSubmitting = false;

  // Temporary inputs for pros/cons
  let newPro = '';
  let newCon = '';

  // Validation
  $: isValid = rating > 0 && title.trim().length > 0 && content.trim().length >= 10;
  $: characterCount = content.length;
  const maxCharacters = 2000;

  function setRating(newRating: number) {
    rating = newRating;
  }

  function addPro() {
    if (newPro.trim() && pros.length < 10) {
      pros = [...pros, newPro.trim()];
      newPro = '';
    }
  }

  function removePro(index: number) {
    pros = pros.filter((_, i) => i !== index);
  }

  function addCon() {
    if (newCon.trim() && cons.length < 10) {
      cons = [...cons, newCon.trim()];
      newCon = '';
    }
  }

  function removeCon(index: number) {
    cons = cons.filter((_, i) => i !== index);
  }

  async function submitReview() {
    if (!isValid || isSubmitting) return;

    isSubmitting = true;

    try {
      const reviewData = {
        hardwareItemId,
        rating,
        title: title.trim(),
        content: content.trim(),
        pros: pros.length > 0 ? pros : undefined,
        cons: cons.length > 0 ? cons : undefined,
        wouldRecommend
      };

      const url = isEditing ? '/api/reviews' : '/api/reviews';
      const method = isEditing ? 'PUT' : 'POST';
      const body = isEditing 
        ? { reviewId: existingReview?.id, ...reviewData }
        : reviewData;

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      });

      if (response.ok) {
        const result = await response.json();
        toast.success(isEditing ? 'Review updated successfully!' : 'Review submitted successfully!');
        dispatch('success', result.review);
        
        // Reset form if creating new review
        if (!isEditing) {
          rating = 0;
          title = '';
          content = '';
          pros = [];
          cons = [];
          wouldRecommend = true;
        }
      } else {
        const errorResponse = await response.json();
        toast.error(errorResponse.error || 'Failed to submit review');
      }
    } catch {
      toast.error('An error occurred while submitting your review');
    } finally {
      isSubmitting = false;
    }
  }

  function cancel() {
    dispatch('cancel');
  }
</script>

<Card class="w-full max-w-2xl">
  <CardHeader>
    <CardTitle>
      {isEditing ? 'Edit Your Review' : 'Write a Review'}
    </CardTitle>
  </CardHeader>
  <CardContent class="space-y-6">
    <!-- Rating Selection -->
    <div class="space-y-2">
      <Label class="text-base font-medium">Overall Rating *</Label>
      <div class="flex items-center gap-1">
        {#each Array(5) as _unused, i (i)}
          <button
            type="button"
            class="p-1 hover:scale-110 transition-transform"
            onclick={() => setRating(i + 1)}
          >
            <Star 
              class="w-8 h-8 {i < rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}" 
            />
          </button>
        {/each}
        {#if rating > 0}
          <span class="ml-2 text-sm text-muted-foreground">
            {rating} out of 5 stars
          </span>
        {/if}
      </div>
    </div>

    <!-- Review Title -->
    <div class="space-y-2">
      <Label for="review-title" class="text-base font-medium">Review Title *</Label>
      <Input
        id="review-title"
        bind:value={title}
        placeholder="Summarize your experience in a few words"
        maxLength={100}
        class="w-full"
      />
      <div class="text-xs text-muted-foreground text-right">
        {title.length}/100 characters
      </div>
    </div>

    <!-- Review Content -->
    <div class="space-y-2">
      <Label for="review-content" class="text-base font-medium">Your Review *</Label>
      <Textarea
        id="review-content"
        bind:value={content}
        placeholder="Share your detailed experience with this hardware. What worked well? What could be improved? How does it perform in your homelab?"
        rows={6}
        maxLength={maxCharacters}
        class="w-full resize-none"
      />
      <div class="flex justify-between text-xs text-muted-foreground">
        <span>Minimum 10 characters</span>
        <span class="{characterCount > maxCharacters * 0.9 ? 'text-orange-500' : ''}">
          {characterCount}/{maxCharacters} characters
        </span>
      </div>
    </div>

    <!-- Pros Section -->
    <div class="space-y-3">
      <Label class="text-base font-medium flex items-center gap-2">
        <ThumbsUp class="w-4 h-4 text-green-600" />
        Pros (Optional)
      </Label>
      
      {#if pros.length > 0}
        <div class="flex flex-wrap gap-2">
          {#each pros as pro, index (index)}
            <Badge variant="outline" class="bg-green-50 border-green-200 text-green-800">
              {pro}
              <button
                type="button"
                class="ml-1 hover:text-red-600"
                onclick={() => removePro(index)}
              >
                <X class="w-3 h-3" />
              </button>
            </Badge>
          {/each}
        </div>
      {/if}
      
      {#if pros.length < 10}
        <div class="flex gap-2">
          <Input
            bind:value={newPro}
            placeholder="Add a positive point"
            maxLength={100}
            class="flex-1"
            onkeydown={(e) => e.key === 'Enter' && addPro()}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onclick={addPro}
            disabled={!newPro.trim()}
          >
            <Plus class="w-4 h-4" />
          </Button>
        </div>
      {/if}
    </div>

    <!-- Cons Section -->
    <div class="space-y-3">
      <Label class="text-base font-medium flex items-center gap-2">
        <ThumbsDown class="w-4 h-4 text-red-600" />
        Cons (Optional)
      </Label>
      
      {#if cons.length > 0}
        <div class="flex flex-wrap gap-2">
          {#each cons as con, index (index)}
            <Badge variant="outline" class="bg-red-50 border-red-200 text-red-800">
              {con}
              <button
                type="button"
                class="ml-1 hover:text-red-600"
                onclick={() => removeCon(index)}
              >
                <X class="w-3 h-3" />
              </button>
            </Badge>
          {/each}
        </div>
      {/if}
      
      {#if cons.length < 10}
        <div class="flex gap-2">
          <Input
            bind:value={newCon}
            placeholder="Add a concern or limitation"
            maxLength={100}
            class="flex-1"
            onkeydown={(e) => e.key === 'Enter' && addCon()}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onclick={addCon}
            disabled={!newCon.trim()}
          >
            <Plus class="w-4 h-4" />
          </Button>
        </div>
      {/if}
    </div>

    <!-- Recommendation -->
    <div class="space-y-3">
      <Label class="text-base font-medium">Would you recommend this hardware?</Label>
      <div class="flex gap-4">
        <label class="flex items-center gap-2 cursor-pointer">
          <input
            type="radio"
            bind:group={wouldRecommend}
            value={true}
            class="text-green-600"
          />
          <span class="text-green-600">Yes, I recommend it</span>
        </label>
        <label class="flex items-center gap-2 cursor-pointer">
          <input
            type="radio"
            bind:group={wouldRecommend}
            value={false}
            class="text-red-600"
          />
          <span class="text-red-600">No, I don't recommend it</span>
        </label>
      </div>
    </div>

    <!-- Form Actions -->
    <div class="flex gap-3 pt-4">
      <Button
        onclick={submitReview}
        disabled={!isValid || isSubmitting}
        class="flex-1"
      >
        {#if isSubmitting}
          Submitting...
        {:else}
          {isEditing ? 'Update Review' : 'Submit Review'}
        {/if}
      </Button>
      
      {#if isEditing}
        <Button variant="outline" onclick={cancel}>
          Cancel
        </Button>
      {/if}
    </div>

    <!-- Form Validation Help -->
    {#if !isValid}
      <div class="text-sm text-muted-foreground bg-muted p-3 rounded-lg">
        <p class="font-medium mb-1">Please complete the following:</p>
        <ul class="list-disc list-inside space-y-1">
          {#if rating === 0}
            <li>Select a star rating</li>
          {/if}
          {#if title.trim().length === 0}
            <li>Add a review title</li>
          {/if}
          {#if content.trim().length < 10}
            <li>Write at least 10 characters in your review</li>
          {/if}
        </ul>
      </div>
    {/if}
  </CardContent>
</Card>