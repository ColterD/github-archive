---
title: Blog
layout: doc
---

<script setup>
import OptimizedImage from '../.vitepress/theme/components/OptimizedImage.vue'

const blogPosts = [
  {
    title: 'Getting Started with VitePress',
    date: '2023-05-15',
    excerpt: 'Learn how to set up and customize your VitePress site for optimal performance and user experience.',
    tags: ['VitePress', 'Vue', 'Tutorial'],
    url: '/blog/getting-started-with-vitepress',
    image: '/placeholder-blog.png'
  },
  {
    title: 'Advanced Vue.js Techniques',
    date: '2023-04-22',
    excerpt: 'Explore advanced Vue.js patterns and techniques to build more maintainable and scalable applications.',
    tags: ['Vue', 'JavaScript', 'Advanced'],
    url: '/blog/advanced-vuejs-techniques',
    image: '/placeholder-blog.png'
  },
  {
    title: 'Building a Personal Brand Online',
    date: '2023-03-10',
    excerpt: 'Tips and strategies for building a strong personal brand and online presence as a developer.',
    tags: ['Career', 'Personal Brand', 'Marketing'],
    url: '/blog/building-a-personal-brand',
    image: '/placeholder-blog.png'
  }
]
</script>

# Blog

Welcome to my blog where I share thoughts, tutorials, and insights about web development, technology, and my personal projects.

<div class="blog-post-list">
  <div v-for="post in blogPosts" :key="post.url" class="blog-card">
    <div class="blog-card-image">
      <a :href="post.url">
        <OptimizedImage 
          :src="post.image" 
          :alt="post.title" 
          :fallbackSrc="'/placeholder-blog.png'" 
          lazy
        />
      </a>
    </div>
    <div class="blog-card-content">
      <h2 class="blog-card-title">
        <a :href="post.url">{{ post.title }}</a>
      </h2>
      <div class="blog-card-date">{{ post.date }}</div>
      <p class="blog-card-excerpt">{{ post.excerpt }}</p>
      <div class="blog-card-tags">
        <span v-for="tag in post.tags" :key="tag" class="blog-card-tag">
          {{ tag }}
        </span>
      </div>
    </div>
  </div>
</div>