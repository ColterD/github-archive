<template>
  <div class="status-page">
    <h1>Service Status</h1>
    <div class="status-card">
      <div class="status-indicator operational"></div>
      <div class="status-details">
        <h2>All Systems Operational</h2>
        <p>Last updated: {{ new Date().toLocaleString() }}</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.status-page {
  padding: 2rem;
}

.status-card {
  display: flex;
  align-items: center;
  padding: 1.5rem;
  background-color: var(--vp-c-bg-soft);
  border-radius: 8px;
  margin-bottom: 1rem;
}

.status-indicator {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  margin-right: 1rem;
}

.status-indicator.operational {
  background-color: #4caf50;
}

.status-details h2 {
  margin: 0;
  font-size: 1.2rem;
}

.status-details p {
  margin: 0.5rem 0 0;
  font-size: 0.9rem;
  color: var(--vp-c-text-2);
}
</style>