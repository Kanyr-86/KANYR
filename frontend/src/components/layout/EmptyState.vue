<template>
  <div class="empty-state text-center py-5">
    <!-- Icon -->
    <div class="empty-state-icon mb-3">
      <slot name="icon">
        <svg v-if="icon" xmlns="http://www.w3.org/2000/svg" width="64" height="64" fill="currentColor" class="text-muted" viewBox="0 0 16 16">
          <path d="M14 1a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1h12zM2 0a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2H2z"/>
          <path v-if="icon === 'inbox'" d="M3 4.5a.5.5 0 0 1 .5-.5h9a.5.5 0 0 1 0 1H3.5a.5.5 0 0 1-.5-.5zm0 3a.5.5 0 0 1 .5-.5h9a.5.5 0 0 1 0 1H3.5a.5.5 0 0 1-.5-.5zm0 3a.5.5 0 0 1 .5-.5h5a.5.5 0 0 1 0 1h-5a.5.5 0 0 1-.5-.5z"/>
          <path v-else-if="icon === 'users'" d="M15 14s1 0 1-1-1-4-5-4-5 3-5 4 1 1 1 1h8zm-7.978-1A.261.261 0 0 1 7 12.996c.001-.264.167-1.03.76-1.72C8.312 10.629 9.282 10 11 10c1.717 0 2.687.63 3.24 1.276.593.69.758 1.457.76 1.72l-.008.002a.274.274 0 0 1-.014.002H7.022zM11 7a2 2 0 1 0 0-4 2 2 0 0 0 0 4zm3-2a3 3 0 1 1-6 0 3 3 0 0 1 6 0zM6.936 9.28a5.88 5.88 0 0 0-1.23-.247A7.35 7.35 0 0 0 5 9c-4 0-5 3-5 4 0 .667.333 1 1 1h4.216A2.238 2.238 0 0 1 5 12.5c0-1.264.666-2.754 1.936-3.22zM5.001 7a2 2 0 1 0 0-4 2 2 0 0 0 0 4z"/>
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

    <!-- Action Button -->
    <div v-if="actionText && (actionRoute || $slots.action)" class="empty-state-action">
      <slot name="action">
        <router-link
          v-if="actionRoute"
          :to="actionRoute"
          class="btn btn-primary"
        >
          {{ actionText }}
        </router-link>
      </slot>
    </div>
  </div>
</template>

<script>
import { defineComponent } from 'vue'

/**
 * EmptyState - Shows when no data is available
 * 
 * @example Basic usage
 * ```vue
 * <EmptyState
 *   icon="inbox"
 *   title="Nincsenek diákok"
 *   description="Még nem regisztráltak diákok a rendszerbe."
 *   actionText="Diák hozzáadása"
 *   action-route="/students/new"
 * />
 * ```
 * 
 * @example Without action
 * ```vue
 * <EmptyState
 *   title="Nincs találat"
 *   description="A keresés nem eredményezett találatot."
 * />
 * ```
 */
export default defineComponent({
  name: 'EmptyState',

  props: {
    /**
     * Icon name (inbox, users, or default plus icon)
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
    }
  }
})
</script>

<style scoped>
.empty-state {
  max-width: 400px;
  margin: 0 auto;
}

.empty-state-icon {
  opacity: 0.6;
}

.empty-state-title {
  font-weight: 600;
  color: var(--text-primary, #212529);
}

.empty-state-description {
  font-size: 0.875rem;
  max-width: 300px;
  margin-left: auto;
  margin-right: auto;
}
</style>