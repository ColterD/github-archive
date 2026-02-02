---
layout: home
title: Colter+
description: My Digital Universe - Curated
hero:
  name: Colter+
  text: My Digital Universe
  tagline: A collection of projects, thoughts, and guides
  image:
    src: /hero-logo.png
    alt: C+ Icon
  actions:
    - theme: brand
      text: View Projects
      link: /projects/
    - theme: alt
      text: Read Blog
      link: /blog/
features:
  - title: Projects
    details: Check out my latest technical projects and works in progress
    icon: 📂
    link: /projects/
  - title: Blog
    details: Thoughts, tutorials, and deep dives into technology
    icon: 📝
    link: /blog/
  - title: Guides
    details: Step-by-step tutorials and reference materials
    icon: 📚
    link: /guides/
---

<script setup>
import HomeStatus from '../.vitepress/theme/components/HomeStatus.vue'
</script>

<HomeStatus />