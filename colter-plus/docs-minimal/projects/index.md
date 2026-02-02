---
title: Projects
layout: doc
---

<script setup>
import OptimizedImage from '../.vitepress/theme/components/OptimizedImage.vue'
import { ref, computed } from 'vue'

const projects = [
  {
    title: 'Project One',
    description: 'A sample project to demonstrate the project card component',
    status: 'completed',
    tags: ['Vue', 'TypeScript', 'VitePress'],
    url: '/projects/project-one'
  },
  {
    title: 'Project Two',
    description: 'Another sample project that is currently in progress',
    status: 'in-progress',
    tags: ['React', 'JavaScript', 'API'],
    url: '/projects/project-two'
  },
  {
    title: 'Project Three',
    description: 'A planned project for future development',
    status: 'planned',
    tags: ['Node.js', 'Express', 'MongoDB'],
    url: '/projects/project-three'
  }
]

const projectFilter = ref('all')

const filteredProjects = computed(() => {
  if (projectFilter.value === 'all') {
    return projects
  }
  return projects.filter(project => 
    project.status === projectFilter.value
  )
})
</script>

# My Projects

<div class="project-filters">
  <button 
    @click="projectFilter = 'all'" 
    :class="['filter-button', projectFilter === 'all' ? 'active' : '']">
    All
  </button>
  <button 
    @click="projectFilter = 'completed'" 
    :class="['filter-button', projectFilter === 'completed' ? 'active' : '']">
    Completed
  </button>
  <button 
    @click="projectFilter = 'in-progress'" 
    :class="['filter-button', projectFilter === 'in-progress' ? 'active' : '']">
    In Progress
  </button>
  <button 
    @click="projectFilter = 'planned'" 
    :class="['filter-button', projectFilter === 'planned' ? 'active' : '']">
    Planned
  </button>
</div>

<div v-if="filteredProjects.length" class="projects-grid">
  <div v-for="project in filteredProjects" :key="project.url" class="project-card">
    <div class="project-image">
      <a :href="project.url">
        <OptimizedImage 
          :src="`/placeholder-project.png`" 
          :alt="project.title" 
          :fallbackSrc="'/placeholder-project.png'" 
          lazy
        />
      </a>
    </div>
    <div class="project-content">
      <div class="project-status" :class="project.status">
        {{ project.status }}
      </div>
      <h2>
        <a :href="project.url">{{ project.title }}</a>
      </h2>
      <p>{{ project.description }}</p>
      <div class="project-tags">
        <span v-for="tag in project.tags" :key="tag" class="project-tag">
          {{ tag }}
        </span>
      </div>
      <a :href="project.url" class="view-project" aria-label="View project details">View Project →</a>
    </div>
  </div>
</div>

<div v-else class="empty-projects">
  <p>No projects found matching the current filter.</p>
  <button @click="projectFilter = 'all'" class="filter-button active">Show All Projects</button>
</div>