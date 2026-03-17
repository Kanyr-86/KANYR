<template>
  <Teleport to="body">
    <Transition name="fade">
      <div
        v-if="show"
        class="loading-overlay"
        :style="{ backgroundColor: `rgba(0, 0, 0, ${opacity})` }"
      >
        <div class="loading-content">
          <!-- Enhanced spinner with type-specific styling -->
          <div 
            class="spinner-border" 
            role="status"
            :class="getSpinnerClass()"
            :style="{ width: spinnerSize, height: spinnerSize }"
          >
            <span class="visually-hidden">{{ getAriaLabel() }}</span>
          </div>
          
          <!-- Context-aware message -->
          <div class="loading-message-container">
            <h3 v-if="message" class="loading-title">
              {{ message }}
            </h3>
            <p v-if="subMessage" class="loading-subtitle">
              {{ subMessage }}
            </p>
            <div v-if="showProgress" class="progress-container">
              <div class="progress" style="height: 4px;">
                <div 
                  class="progress-bar" 
                  :class="getProgressBarClass()"
                  :style="{ width: progress + '%' }"
                ></div>
              </div>
              <small class="text-muted mt-1 d-block">{{ progressText }}</small>
            </div>
          </div>
          
          <!-- Estimated time indicator for long operations -->
          <div v-if="estimatedTime" class="time-estimate">
            <small class="text-muted">{{ estimatedTime }}</small>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script>
import { defineComponent } from 'vue'

/**
 * LoadingOverlay - An enhanced full-screen loading overlay with context-aware messages
 * 
 * Displays a centered spinner with contextual messages, progress indicators,
 * and estimated time for different types of operations. Uses Teleport to render
 * at body level for consistent overlay behavior.
 * 
 * Props:
 * - show: Boolean to control visibility
 * - message: Main loading message
 * - subMessage: Additional context or description
 * - type: Loading type for visual styling (fetching, saving, deleting, transferring)
 * - opacity: Backdrop opacity (0.0 to 1.0, default 0.5)
 * - showProgress: Show progress bar
 * - progress: Progress percentage (0-100)
 * - progressText: Text to display with progress
 * - estimatedTime: Estimated completion time
 * - size: Spinner size (small, medium, large)
 * 
 * Usage:
 * - Basic: <LoadingOverlay :show="isLoading" message="Diákok betöltése..." />
 * - With type: <LoadingOverlay :show="saving" message="Mentés folyamatban..." type="saving" />
 * - With progress: <LoadingOverlay :show="transferring" message="Költöztetés..." showProgress :progress="50" progressText="Feldolgozás alatt..." />
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
     * Main loading message
     * @type {string}
     */
    message: {
      type: String,
      default: ''
    },

    /**
     * Additional context or description
     * @type {string}
     */
    subMessage: {
      type: String,
      default: ''
    },

    /**
     * Loading type for visual styling and context
     * @type {string}
     */
    type: {
      type: String,
      default: 'fetching',
      validator: (value) => ['fetching', 'saving', 'deleting', 'transferring', 'authenticating'].includes(value)
    },

    /**
     * Backdrop opacity (0.0 to 1.0)
     * @type {number}
     */
    opacity: {
      type: Number,
      default: 0.5,
      validator: (value) => value >= 0 && value <= 1
    },

    /**
     * Show progress bar
     * @type {boolean}
     */
    showProgress: {
      type: Boolean,
      default: false
    },

    /**
     * Progress percentage (0-100)
     * @type {number}
     */
    progress: {
      type: Number,
      default: 0,
      validator: (value) => value >= 0 && value <= 100
    },

    /**
     * Text to display with progress
     * @type {string}
     */
    progressText: {
      type: String,
      default: ''
    },

    /**
     * Estimated completion time
     * @type {string}
     */
    estimatedTime: {
      type: String,
      default: ''
    },

    /**
     * Spinner size
     * @type {string}
     */
    size: {
      type: String,
      default: 'medium',
      validator: (value) => ['small', 'medium', 'large'].includes(value)
    }
  },

  computed: {
    /**
     * Get appropriate spinner size based on size prop
     */
    spinnerSize() {
      const sizes = {
        small: '2rem',
        medium: '3rem',
        large: '4rem'
      }
      return sizes[this.size] || sizes.medium
    }
  },

  methods: {
    /**
     * Get spinner CSS class based on loading type
     */
    getSpinnerClass() {
      const typeClasses = {
        fetching: 'text-primary',
        saving: 'text-success',
        deleting: 'text-danger',
        transferring: 'text-warning',
        authenticating: 'text-info'
      }
      return typeClasses[this.type] || typeClasses.fetching
    },

    /**
     * Get progress bar CSS class based on loading type
     */
    getProgressBarClass() {
      const typeClasses = {
        fetching: 'bg-primary',
        saving: 'bg-success',
        deleting: 'bg-danger',
        transferring: 'bg-warning',
        authenticating: 'bg-info'
      }
      return typeClasses[this.type] || typeClasses.fetching
    },

    /**
     * Get appropriate ARIA label for screen readers
     */
    getAriaLabel() {
      const typeLabels = {
        fetching: 'Adatok betöltése folyamatban',
        saving: 'Mentés folyamatban',
        deleting: 'Törlés folyamatban',
        transferring: 'Áthelyezés folyamatban',
        authenticating: 'Hitelesítés folyamatban'
      }
      return typeLabels[this.type] || 'Betöltés folyamatban'
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
  gap: 1.5rem;
  text-align: center;
}

.spinner-border {
  animation: spinner-border 0.75s linear infinite;
  will-change: transform;
}

/* Loading message container styles */
.loading-message-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
}

.loading-title {
  color: var(--text-primary);
  font-size: 1.25rem;
  font-weight: 600;
  margin: 0;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
}

.loading-subtitle {
  color: var(--text-secondary);
  font-size: 0.9rem;
  margin: 0;
  opacity: 0.8;
}

/* Progress bar container */
.progress-container {
  width: 100%;
  max-width: 300px;
}

.progress {
  background-color: rgba(255, 255, 255, 0.2);
  border-radius: 2px;
}

.progress-bar {
  transition: width 0.3s ease;
}

/* Time estimate */
.time-estimate {
  margin-top: 0.5rem;
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
  
  .progress-bar {
    transition: none !important;
  }
}

/* High contrast theme support */
[data-theme="high-contrast"] .loading-overlay {
  background-color: rgba(0, 0, 0, 0.8) !important;
}

[data-theme="high-contrast"] .loading-title {
  color: var(--text-inverse) !important;
  text-shadow: none !important;
}

[data-theme="high-contrast"] .loading-subtitle {
  color: var(--text-inverse) !important;
}

[data-theme="high-contrast"] .progress {
  background-color: rgba(255, 255, 255, 0.1) !important;
}

/* Dark theme support */
[data-theme="dark"] .loading-title {
  color: var(--text-primary) !important;
}

[data-theme="dark"] .loading-subtitle {
  color: var(--text-secondary) !important;
}
</style>
