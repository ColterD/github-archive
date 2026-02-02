<template>
  <div class="home-status">
    <div class="status-indicator operational"></div>
    <div class="status-text">
      <a href="/status">All systems operational</a>
    </div>
  </div>
</template>

<style scoped>
.home-status {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.5rem;
  margin: 2rem 0;
  background-color: var(--vp-c-bg-soft);
  border-radius: 8px;
}

.status-indicator {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  margin-right: 0.5rem;
}

.status-indicator.operational {
  background-color: #4caf50;
}

.status-text a {
  font-size: 0.9rem;
  color: var(--vp-c-text-1);
  text-decoration: none;
}

.status-text a:hover {
  text-decoration: underline;
}
</style>