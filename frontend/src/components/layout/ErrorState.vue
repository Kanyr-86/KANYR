<template>
  <div class="error-state text-center py-5">
    <!-- Icon -->
    <div class="error-state-icon mb-3">
      <slot name="icon">
        <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" fill="currentColor" class="text-danger" viewBox="0 0 16 16">
          <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
          <path d="M7.002 11a1 1 0 1 1 2 0 1 1 0 0 1-2 0zM7.1 4.995a.905.905 0 1 1 1.8 0l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 4.995z"/>
        </svg>
      </slot>
    </div>

    <!-- Title -->
    <h5 class="error-state-title mb-2">
      {{ title || 'Hiba történt' }}
    </h5>

    <!-- Message -->
    <p class="error-state-message text-muted mb-4">
      {{ message || 'Váratlan hiba történt. Kérjük, próbálja újra.' }}
    </p>

    <!-- Additional Content -->
    <slot></slot>

    <!-- Retry Button -->
    <div v-if="retryAction" class="error-state-action">
      <slot name="action">
        <BaseButton variant="primary" @click="retryAction">
          Újra próbálás
        </BaseButton>
      </slot>
    </div>
  </div>
</template>

<script>
import { defineComponent } from 'vue'
import BaseButton from '../BaseButton.vue'

/**
 * ErrorState - Shows when an error occurs
 * 
 * @example Basic usage
 * ```vue
 * <ErrorState
 *   title="Betöltési hiba"
 *   message="Nem sikerült betölteni az adatokat."
 *   :retry-action="fetchData"
 * />
 * ```
 * 
 * @example Without retry
 * ```vue
 * <ErrorState
 *   title="Hozzáférés megtagadva"
 *   message="Nincs jogosultsága az oldal megtekintéséhez."
 * />
 * ```
 * 
 * @example With custom action
 * ```vue
 * <ErrorState
 *   title="Hiba"
 *   message="Valami elromlott"
 * >
 *   <template #action>
 *     <BaseButton variant="primary" @click="goHome">Vissza a főoldalra</BaseButton>
 *   </template>
 * </ErrorState>
 * ```
 */
export default defineComponent({
  name: 'ErrorState',

  components: {
    BaseButton
  },

  props: {
    /**
     * Error title
     * @type {string}
     */
    title: {
      type: String,
      default: ''
    },

    /**
     * Error message
     * @type {string}
     */
    message: {
      type: String,
      default: ''
    },

    /**
     * Retry action callback
     * @type {Function}
     */
    retryAction: {
      type: Function,
      default: null
    }
  }
})
</script>

<style scoped>
.error-state {
  max-width: 400px;
  margin: 0 auto;
}

.error-state-icon {
  display: flex;
  justify-content: center;
  align-items: center;
}

.error-state-title {
  font-weight: 600;
  color: var(--text-primary, #212529);
}

.error-state-message {
  font-size: 0.875rem;
  max-width: 300px;
  margin-left: auto;
  margin-right: auto;
}

.error-state-action {
  margin-top: 1rem;
}
</style>