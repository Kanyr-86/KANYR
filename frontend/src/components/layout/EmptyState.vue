<template>
  <div class="empty-state text-center py-5">
    <!-- Icon -->
    <div class="empty-state-icon mb-3">
      <slot name="icon">
        <svg v-if="icon" xmlns="http://www.w3.org/2000/svg" width="64" height="64" fill="currentColor" class="empty-state-icon-svg" :class="getIconClass()" viewBox="0 0 16 16">
          <!-- Notification icon -->
          <path v-if="icon === 'inbox'" d="M3 4.5a.5.5 0 0 1 .5-.5h9a.5.5 0 0 1 0 1H3.5a.5.5 0 0 1-.5-.5zm0 3a.5.5 0 0 1 .5-.5h9a.5.5 0 0 1 0 1H3.5a.5.5 0 0 1-.5-.5zm0 3a.5.5 0 0 1 .5-.5h5a.5.5 0 0 1 0 1h-5a.5.5 0 0 1-.5-.5z"/>
          <!-- Users icon -->
          <path v-else-if="icon === 'users'" d="M15 14s1 0 1-1-1-4-5-4-5 3-5 4 1 1 1 1h8zm-7.978-1A.261.261 0 0 1 7 12.996c.001-.264.167-1.03.76-1.72C8.312 10.629 9.282 10 11 10c1.717 0 2.687.63 3.24 1.276.593.69.758 1.457.76 1.72l-.008.002a.274.274 0 0 1-.014.002H7.022zM11 7a2 2 0 1 0 0-4 2 2 0 0 0 0 4zm3-2a3 3 0 1 1-6 0 3 3 0 0 1 6 0zM6.936 9.28a5.88 5.88 0 0 0-1.23-.247A7.35 7.35 0 0 0 5 9c-4 0-5 3-5 4 0 .667.333 1 1 1h4.216A2.238 2.238 0 0 1 5 12.5c0-1.264.666-2.754 1.936-3.22zM5.001 7a2 2 0 1 0 0-4 2 2 0 0 0 0 4z"/>
          <!-- Search icon -->
          <path v-else-if="icon === 'search'" d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001c.03.04.062.078.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1.007 1.007 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0z"/>
          <!-- Lock icon -->
          <path v-else-if="icon === 'lock'" d="M8 1a2 2 0 0 1 2 2v4H6V3a2 2 0 0 1 2-2zm3 6V3a3 3 0 0 0-6 0v4a2 2 0 0 0-2 2v5a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2zM5 8h6V3a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v5z"/>
          <!-- Default plus icon -->
          <path v-else d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4z"/>
        </svg>
      </slot>
    </div>

    <!-- Title -->
    <h5 v-if="title" class="empty-state-title mb-2">
      {{ title }}
    </h5>

    <!-- Description -->
    <p v-if="description" class="empty-state-description text-muted mb-4">
      {{ description }}
    </p>

    <!-- Contextual guidance -->
    <div v-if="contextText" class="empty-state-context mb-4">
      <small class="text-muted">{{ contextText }}</small>
    </div>

    <!-- Action Button -->
    <div v-if="actionText && (actionRoute || $slots.action)" class="empty-state-action">
      <slot name="action">
        <router-link
          v-if="actionRoute"
          :to="actionRoute"
          class="btn btn-primary btn-lg"
        >
          <i v-if="actionIcon" :class="actionIcon" class="me-2"></i>
          {{ actionText }}
        </router-link>
      </slot>
    </div>

    <!-- Secondary actions -->
    <div v-if="$slots.secondaryActions" class="empty-state-secondary-actions mt-3">
      <slot name="secondaryActions"></slot>
    </div>
  </div>
</template>

<script>
import { defineComponent } from 'vue'

/**
 * Enhanced EmptyState - Shows when no data is available with contextual guidance
 * 
 * Provides contextual empty states with appropriate icons, helpful descriptions,
 * and actionable guidance based on the context.
 * 
 * @example Basic usage
 * ```vue
 * <EmptyState
 *   icon="inbox"
 *   title="Nincsenek értesítések"
 *   description="Még nem érkezett új értesítés."
 *   contextText="Az értesítések akkor jelennek meg, amikor fontos változás történik a szobával vagy a diák adataival kapcsolatban."
 *   actionText="Diákok megtekintése"
 *   action-route="/students"
 *   action-icon="bi bi-people"
 * />
 * ```
 * 
 * @example Search results
 * ```vue
 * <EmptyState
 *   icon="search"
 *   title="Nincs találat"
 *   description="A keresési feltételeknek nincs megfelelő eredmény."
 *   contextText="Próbálja meg más kulcsszavakkal vagy módosítsa a szűrőfeltételeket."
 * />
 * ```
 * 
 * @example Permission-based
 * ```vue
 * <EmptyState
 *   icon="lock"
 *   title="Hozzáférés korlátozva"
 *   description="Nincs engedélye a tartalom megtekintéséhez."
 *   contextText="Kérjen hozzáférést a rendszergazdától, vagy lépjen be másik fiókkal."
 * />
 * ```
 */
export default defineComponent({
  name: 'EmptyState',

  props: {
    /**
     * Icon name (inbox, users, search, lock, or default plus icon)
     * @type {string}
     */
    icon: {
      type: String,
      default: ''
    },

    /**
     * Title text
     * @type {string}
     */
    title: {
      type: String,
      default: ''
    },

    /**
     * Description text
     * @type {string}
     */
    description: {
      type: String,
      default: ''
    },

    /**
     * Contextual guidance text
     * @type {string}
     */
    contextText: {
      type: String,
      default: ''
    },

    /**
     * Action button text
     * @type {string}
     */
    actionText: {
      type: String,
      default: ''
    },

    /**
     * Route for action button
     * @type {string | object}
     */
    actionRoute: {
      type: [String, Object],
      default: ''
    },

    /**
     * Action button icon class
     * @type {string}
     */
    actionIcon: {
      type: String,
      default: ''
    }
  },

  methods: {
    /**
     * Get appropriate icon class based on icon type
     */
    getIconClass() {
      const iconClasses = {
        inbox: 'text-primary',
        users: 'text-success',
        search: 'text-info',
        lock: 'text-warning',
        default: 'text-muted'
      }
      return iconClasses[this.icon] || iconClasses.default
    }
  }
})
</script>

<style scoped>
.empty-state {
  max-width: 500px;
  margin: 0 auto;
  padding: 2rem;
}

.empty-state-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 80px;
  height: 80px;
  background: rgba(0, 0, 0, 0.05);
  border-radius: 50%;
  margin: 0 auto 1.5rem auto;
  transition: all 0.3s ease;
}

.empty-state-icon:hover {
  background: rgba(0, 0, 0, 0.1);
  transform: scale(1.05);
}

.empty-state-icon-svg {
  width: 40px;
  height: 40px;
}

.empty-state-title {
  font-weight: 700;
  color: var(--text-heading);
  font-size: 1.5rem;
  margin-bottom: 1rem;
}

.empty-state-description {
  font-size: 1rem;
  color: var(--text-secondary);
  line-height: 1.5;
  margin-bottom: 1.5rem;
}

.empty-state-context {
  background: var(--bg-tertiary);
  border: 1px solid var(--border-primary);
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 1.5rem;
}

.empty-state-action {
  margin-bottom: 1rem;
}

.empty-state-secondary-actions {
  display: flex;
  gap: 0.5rem;
  justify-content: center;
  flex-wrap: wrap;
}

/* Icon-specific styles */
.empty-state-icon.text-primary {
  background: rgba(13, 110, 253, 0.1);
}

.empty-state-icon.text-success {
  background: rgba(25, 135, 84, 0.1);
}

.empty-state-icon.text-info {
  background: rgba(13, 202, 240, 0.1);
}

.empty-state-icon.text-warning {
  background: rgba(255, 193, 7, 0.1);
}

.empty-state-icon.text-muted {
  background: rgba(108, 117, 125, 0.1);
}

/* High contrast theme support */
[data-theme="high-contrast"] .empty-state-icon {
  background: var(--bg-page);
  border: 2px solid var(--border-primary);
}

[data-theme="high-contrast"] .empty-state-title {
  color: var(--text-inverse);
}

[data-theme="high-contrast"] .empty-state-description {
  color: var(--text-inverse);
}

[data-theme="high-contrast"] .empty-state-context {
  background: var(--bg-page);
  border: 2px solid var(--border-primary);
  color: var(--text-inverse);
}

/* Dark theme support */
[data-theme="dark"] .empty-state-icon {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid var(--border-dark);
}

[data-theme="dark"] .empty-state-title {
  color: var(--text-primary);
}

[data-theme="dark"] .empty-state-description {
  color: var(--text-secondary);
}

[data-theme="dark"] .empty-state-context {
  background: var(--bg-tertiary);
  border-color: var(--border-dark);
  color: var(--text-secondary);
}

/* Responsive design */
@media (max-width: 768px) {
  .empty-state {
    padding: 1.5rem;
    max-width: 100%;
  }
  
  .empty-state-icon {
    width: 70px;
    height: 70px;
  }
  
  .empty-state-icon-svg {
    width: 35px;
    height: 35px;
  }
  
  .empty-state-title {
    font-size: 1.25rem;
  }
  
  .empty-state-description {
    font-size: 0.9rem;
  }
}
</style>
