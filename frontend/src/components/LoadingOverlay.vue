<template>
  <Teleport to="body">
    <Transition name="fade">
      <div
        v-if="show"
        class="loading-overlay"
        :style="{ backgroundColor: `rgba(0, 0, 0, ${opacity})` }"
      >
        <div class="loading-content">
          <div class="spinner-border text-light" role="status">
            <span class="visually-hidden">Loading...</span>
          </div>
          <p v-if="message" class="loading-message">
            {{ message }}
          </p>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script>
import { defineComponent } from 'vue'

/**
 * LoadingOverlay - A full-screen loading overlay with spinner
 * 
 * Displays a centered Bootstrap 5 spinner with an optional message
 * over a semi-transparent backdrop. Uses Teleport to render at body level.
 * 
 * Props:
 * - show: Boolean to control visibility
 * - message: Optional text to display below spinner
 * - opacity: Backdrop opacity (0.0 to 1.0, default 0.5)
 * 
 * Usage:
 * - Import and use: <LoadingOverlay :show="isLoading" message="Loading..." />
 * - Combine with useLoading composable for automatic state management
 */
export default defineComponent({
  name: 'LoadingOverlay',

  props: {
    /**
     * Controls the visibility of the overlay
     * @type {boolean}
     */
    show: {
      type: Boolean,
      default: false
    },

    /**
     * Optional message to display below the spinner
     * @type {string}
     */
    message: {
      type: String,
      default: ''
    },

    /**
     * Backdrop opacity (0.0 to 1.0)
     * @type {number}
     */
    opacity: {
      type: Number,
      default: 0.5,
      validator: (value) => value >= 0 && value <= 1
    }
  }
})
</script>

<style scoped>
.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
}

.loading-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.spinner-border {
  width: 3rem;
  height: 3rem;
}

.loading-message {
  color: var(--text-primary);
  font-size: 1rem;
  font-weight: 500;
  margin: 0;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
}

/* Transition animations - Performance optimized */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
  will-change: opacity;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* Ensure spinner animation is smooth */
.spinner-border {
  animation: spinner-border 0.75s linear infinite;
  will-change: transform;
}

@keyframes spinner-border {
  to {
    transform: rotate(360deg);
  }
}

/* Reduced motion support for accessibility */
@media (prefers-reduced-motion: reduce) {
  .fade-enter-active,
  .fade-leave-active {
    transition: none !important;
  }

  .fade-enter-from,
  .fade-leave-to {
    opacity: 1 !important;
  }

  .spinner-border {
    animation: none !important;
    border: 3px solid currentColor;
    border-top-color: transparent;
  }
}
</style>