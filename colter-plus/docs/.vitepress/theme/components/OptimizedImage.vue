<template>
  <img 
    :src="src || fallbackSrc" 
    :alt="alt" 
    :loading="lazy ? 'lazy' : 'eager'"
    class="optimized-image"
    @error="handleImageError"
  />
</template>

<script setup>
import { ref } from 'vue';

const props = defineProps({
  src: {
    type: String,
    required: true
  },
  alt: {
    type: String,
    default: ''
  },
  fallbackSrc: {
    type: String,
    default: ''
  },
  lazy: {
    type: Boolean,
    default: true
  }
});

const handleImageError = (e) => {
  if (props.fallbackSrc && e.target.src !== props.fallbackSrc) {
    e.target.src = props.fallbackSrc;
  }
};
</script>

<style scoped>
.optimized-image {
  max-width: 100%;
  height: auto;
  display: block;
  border-radius: 4px;
}
</style>