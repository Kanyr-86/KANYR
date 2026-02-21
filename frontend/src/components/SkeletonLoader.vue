<template>
  <div class="skeleton-loader" role="status" aria-label="Tartalom betöltése">
    <!-- Table skeleton -->
    <div v-if="type === 'table'" class="skeleton-table">
      <div class="skeleton-table-header">
        <div class="skeleton-cell skeleton-header" v-for="n in columns" :key="'header-' + n"></div>
      </div>
      <div class="skeleton-table-row" v-for="row in rows" :key="'row-' + row">
        <div class="skeleton-cell" v-for="col in columns" :key="'cell-' + row + '-' + col"></div>
      </div>
    </div>

    <!-- Card skeleton -->
    <div v-else-if="type === 'card'" class="skeleton-card">
      <div class="skeleton-card-header">
        <div class="skeleton-avatar"></div>
        <div class="skeleton-card-title"></div>
      </div>
      <div class="skeleton-card-body">
        <div class="skeleton-line"></div>
        <div class="skeleton-line short"></div>
        <div class="skeleton-line"></div>
      </div>
    </div>

    <!-- List skeleton -->
    <div v-else-if="type === 'list'" class="skeleton-list">
      <div class="skeleton-list-item" v-for="n in rows" :key="'list-item-' + n">
        <div class="skeleton-avatar sm"></div>
        <div class="skeleton-list-content">
          <div class="skeleton-line"></div>
          <div class="skeleton-line short"></div>
        </div>
      </div>
    </div>

    <!-- Stat card skeleton -->
    <div v-else-if="type === 'stat'" class="skeleton-stat">
      <div class="skeleton-stat-icon"></div>
      <div class="skeleton-stat-content">
        <div class="skeleton-stat-value"></div>
        <div class="skeleton-stat-label"></div>
      </div>
    </div>

    <!-- Default/Text skeleton -->
    <div v-else class="skeleton-text">
      <div class="skeleton-line" v-for="n in rows" :key="'line-' + n"></div>
    </div>
    
    <span class="visually-hidden">Tartalom betöltése folyamatban...</span>
  </div>
</template>

<script>
import { defineComponent } from 'vue'

export default defineComponent({
  name: 'SkeletonLoader',
  props: {
    type: {
      type: String,
      default: 'text',
      validator: (value) => ['text', 'table', 'card', 'list', 'stat'].includes(value)
    },
    rows: {
      type: Number,
      default: 5
    },
    columns: {
      type: Number,
      default: 4
    }
  }
})
</script>

<style scoped>
.skeleton-loader {
  width: 100%;
}

/* Shimmer animation */
.skeleton-cell,
.skeleton-line,
.skeleton-avatar,
.skeleton-card-title,
.skeleton-stat-icon,
.skeleton-stat-value,
.skeleton-stat-label {
  background: linear-gradient(
    90deg,
    var(--bg-tertiary, #e1e9f0) 25%,
    var(--bg-secondary, #f0f4f8) 50%,
    var(--bg-tertiary, #e1e9f0) 75%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  border-radius: 4px;
}

[data-theme="dark"] .skeleton-cell,
[data-theme="dark"] .skeleton-line,
[data-theme="dark"] .skeleton-avatar,
[data-theme="dark"] .skeleton-card-title,
[data-theme="dark"] .skeleton-stat-icon,
[data-theme="dark"] .skeleton-stat-value,
[data-theme="dark"] .skeleton-stat-label {
  background: linear-gradient(
    90deg,
    var(--bg-tertiary, #333d4f) 25%,
    var(--bg-secondary, #242c38) 50%,
    var(--bg-tertiary, #333d4f) 75%
  );
  background-size: 200% 100%;
}

@keyframes shimmer {
  0% {
    background-position: -200% 0;
  }
  100% {
    background-position: 200% 0;
  }
}

/* Table skeleton */
.skeleton-table {
  width: 100%;
  border-radius: var(--border-radius-md, 8px);
  overflow: hidden;
  background-color: var(--card-bg, #ffffff);
  box-shadow: var(--shadow-card, 0 4px 6px -1px rgba(48, 77, 109, 0.15));
}

.skeleton-table-header {
  display: flex;
  padding: 1rem;
  background-color: var(--table-header-bg, #f0f4f8);
}

.skeleton-header {
  height: 20px;
  background-color: var(--text-tertiary, #545e75) !important;
  opacity: 0.3;
}

.skeleton-table-row {
  display: flex;
  padding: 1rem;
  border-bottom: 1px solid var(--border-primary, #a5bcd2);
}

.skeleton-table-row:last-child {
  border-bottom: none;
}

.skeleton-cell {
  flex: 1;
  height: 16px;
  margin: 0 0.5rem;
}

/* Card skeleton */
.skeleton-card {
  background-color: var(--card-bg, #ffffff);
  border-radius: var(--border-radius-lg, 12px);
  padding: 1.5rem;
  box-shadow: var(--shadow-card, 0 4px 6px -1px rgba(48, 77, 109, 0.15));
}

.skeleton-card-header {
  display: flex;
  align-items: center;
  margin-bottom: 1rem;
}

.skeleton-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  margin-right: 1rem;
}

.skeleton-avatar.sm {
  width: 32px;
  height: 32px;
}

.skeleton-card-title {
  width: 60%;
  height: 20px;
}

.skeleton-card-body {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.skeleton-line {
  height: 14px;
  width: 100%;
}

.skeleton-line.short {
  width: 60%;
}

/* List skeleton */
.skeleton-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.skeleton-list-item {
  display: flex;
  align-items: center;
  padding: 1rem;
  background-color: var(--card-bg, #ffffff);
  border-radius: var(--border-radius-md, 8px);
  box-shadow: var(--shadow-sm, 0 1px 2px 0 rgba(48, 77, 109, 0.1));
}

.skeleton-list-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

/* Stat skeleton */
.skeleton-stat {
  display: flex;
  align-items: center;
  padding: 1.5rem;
  background-color: var(--card-bg, #ffffff);
  border-radius: var(--border-radius-lg, 12px);
  box-shadow: var(--shadow-card, 0 4px 6px -1px rgba(48, 77, 109, 0.15));
}

.skeleton-stat-icon {
  width: 48px;
  height: 48px;
  border-radius: var(--border-radius-md, 8px);
  margin-right: 1rem;
}

.skeleton-stat-content {
  flex: 1;
}

.skeleton-stat-value {
  height: 32px;
  width: 60%;
  margin-bottom: 0.5rem;
}

.skeleton-stat-label {
  height: 16px;
  width: 80%;
}

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  .skeleton-cell,
  .skeleton-line,
  .skeleton-avatar,
  .skeleton-card-title,
  .skeleton-stat-icon,
  .skeleton-stat-value,
  .skeleton-stat-label {
    animation: none;
    opacity: 0.7;
  }
}
</style>