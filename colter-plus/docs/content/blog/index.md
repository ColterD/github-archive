---
title: Blog
layout: doc
---

<script setup>
import { data as posts } from './posts.data.ts'
</script>

# Blog

<div class="blog-list">
  <div v-for="post in posts" :key="post.url" class="blog-item">
    <h2>
      <a :href="post.url">{{ post.frontmatter.title }}</a>
    </h2>
    <div class="post-meta">
      {{ post.date.formatted }} • 
      <span v-for="(tag, index) in post.frontmatter.tags" :key="tag">
        <a :href="`/tags/${tag}`" class="tag">{{ tag }}</a>
        <span v-if="index < post.frontmatter.tags.length - 1">, </span>
      </span>
    </div>
    <p>{{ post.frontmatter.description }}</p>
    <a :href="post.url" class="read-more">Read More →</a>
  </div>
</div>