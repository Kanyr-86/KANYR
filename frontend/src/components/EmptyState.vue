<template>
  <div class="empty-state text-center py-5">
    <div class="empty-state-icon mb-3">
      <i :class="iconClass" style="font-size: 3rem; opacity: 0.5;"></i>
    </div>
    <h5 class="empty-state-title mb-2">{{ title }}</h5>
<p class="empty-state-description mb-3" style="color: var(--text-muted)">{{ description }}</p>
<p class="empty-state-context mb-4" v-if="contextText" style="color: var(--text-muted)">{{ contextText }}</p>
    
    <div class="empty-state-actions">
      <button 
        v-if="actionText && actionRoute" 
        class="btn btn-primary me-2"
        @click="$router.push(actionRoute)"
      >
        <i :class="actionIcon" v-if="actionIcon"></i>
        {{ actionText }}
      </button>
      
      <slot name="secondaryActions"></slot>
    </div>
  </div>
</template>

<script>
export default {
  name: 'EmptyState',
  props: {
    icon: {
      type: String,
      default: 'bi bi-info-circle'
    },
    title: {
      type: String,
      required: true
    },
    description: {
      type: String,
      required: true
    },
    contextText: {
      type: String,
      default: ''
    },
    actionText: {
      type: String,
      default: ''
    },
    actionRoute: {
      type: String,
      default: ''
    },
    actionIcon: {
      type: String,
      default: ''
    }
  },
  computed: {
    iconClass() {
      // Handle both Bootstrap icons and custom classes
      if (this.icon.startsWith('bi-') || this.icon.startsWith('bi ')) {
        return `bi ${this.icon}`
      }
      return this.icon
    }
  }
}
</script>

<style scoped>
.empty-state {
  background: var(--bs-body-bg, #f8f9fa);
  border: 2px dashed var(--bs-border-color, #dee2e6);
  border-radius: 12px;
  transition: all 0.3s ease;
}

.empty-state:hover {
  border-color: var(--bs-primary, #0d6efd);
  background: var(--bs-body-bg, #f8f9fa);
}

.empty-state-icon {
  color: var(--bs-primary, #0d6efd);
}

.empty-state-title {
  color: var(--bs-body-color, #212529);
  font-weight: 600;
}

.empty-state-description {
  color: var(--bs-secondary-color, #6c757d);
  line-height: 1.5;
}

.empty-state-context {
  font-size: 0.9rem;
  line-height: 1.4;
}

.empty-state-actions {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
}

/* Dark mode support */
[data-theme="dark"] .empty-state {
  background: var(--bs-dark-bg-subtle, #212529);
  border-color: var(--bs-border-color, #495057);
}

[data-theme="dark"] .empty-state-title {
  color: var(--bs-body-color, #ffffff);
}

[data-theme="dark"] .empty-state-description,
[data-theme="dark"] .empty-state-context {
  color: var(--bs-secondary-color, #adb5bd);
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .empty-state {
    padding: 2rem 1rem;
  }
  
  .empty-state-icon i {
    font-size: 2.5rem;
  }
  
  .empty-state-actions {
    flex-direction: column;
    align-items: center;
  }
  
  .empty-state-actions .btn {
    width: 100%;
    max-width: 200px;
  }
}
</style>