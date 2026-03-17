<template>
  <span class="accessible-status" :class="statusClass">
    <!-- Visual indicator with semantic icon -->
    <span class="status-indicator" :class="indicatorClass">
      <span class="status-icon" aria-hidden="true">{{ icon }}</span>
      <span class="sr-only-status">{{ textLabel }}</span>
    </span>
    
    <!-- Text label for screen readers and additional context -->
    <span class="status-text" v-if="showText">{{ textLabel }}</span>
  </span>
</template>

<script>
import { defineComponent, computed } from 'vue'

/**
 * AccessibleStatus - An accessible status indicator component
 * 
 * Provides both visual (color + icon) and text indicators for status information.
 * Ensures accessibility for colorblind users and screen reader users.
 * 
 * @example Basic usage
 * ```vue
 * <AccessibleStatus status="active" />
 * <AccessibleStatus status="inactive" showText />
 * <AccessibleStatus status="pending" label="Függőben" />
 * ```
 * 
 * @example With custom label
 * ```vue
 * <AccessibleStatus 
 *   status="success" 
 *   label="Sikeresen mentve" 
 *   showText 
 * />
 * ```
 */
export default defineComponent({
  name: 'AccessibleStatus',

  props: {
    /**
     * Status type
     * @type {'active' | 'inactive' | 'pending' | 'success' | 'error' | 'warning' | 'info'}
     */
    status: {
      type: String,
      required: true,
      validator: (value) => [
        'active', 'inactive', 'pending', 'success', 'error', 'warning', 'info'
      ].includes(value)
    },

    /**
     * Custom label text (overrides default)
     * @type {string}
     */
    label: {
      type: String,
      default: ''
    },

    /**
     * Show text label alongside icon
     * @type {boolean}
     */
    showText: {
      type: Boolean,
      default: false
    }
  },

  setup(props) {
    /**
     * Status class for styling
     */
    const statusClass = computed(() => {
      return `status-${props.status}`
    })

    /**
     * Indicator class for styling
     */
    const indicatorClass = computed(() => {
      return `indicator-${props.status}`
    })

    /**
     * Icon character based on status
     */
    const icon = computed(() => {
      const icons = {
        active: '✓',
        inactive: '✗',
        pending: '⏳',
        success: '✓',
        error: '✗',
        warning: '⚠',
        info: 'ℹ'
      }
      return icons[props.status] || '•'
    })

    /**
     * Text label for accessibility
     */
    const textLabel = computed(() => {
      if (props.label) {
        return props.label
      }

      const labels = {
        active: 'Aktív',
        inactive: 'Inaktív',
        pending: 'Függőben',
        success: 'Sikeres',
        error: 'Hiba',
        warning: 'Figyelmeztetés',
        info: 'Információ'
      }
      return labels[props.status] || 'Státusz'
    })

    return {
      statusClass,
      indicatorClass,
      icon,
      textLabel
    }
  }
})
</script>

<style scoped>
.accessible-status {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  font-weight: 600;
}

.status-indicator {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.25rem;
  height: 1.25rem;
  border-radius: 50%;
  font-size: 0.875rem;
  font-weight: bold;
  color: white;
  position: relative;
}

.status-icon {
  display: inline-block;
  text-align: center;
  line-height: 1;
}

.status-text {
  color: var(--text-secondary);
}

/* Status-specific styling */
.indicator-active {
  background-color: var(--success-600);
  box-shadow: 0 2px 4px rgba(25, 135, 84, 0.3);
}

.indicator-inactive {
  background-color: var(--danger-600);
  box-shadow: 0 2px 4px rgba(220, 53, 69, 0.3);
}

.indicator-pending {
  background-color: var(--warning-600);
  box-shadow: 0 2px 4px rgba(255, 193, 7, 0.3);
  animation: pulse 2s infinite;
}

.indicator-success {
  background-color: var(--success-600);
  box-shadow: 0 2px 4px rgba(25, 135, 84, 0.3);
}

.indicator-error {
  background-color: var(--danger-600);
  box-shadow: 0 2px 4px rgba(220, 53, 69, 0.3);
}

.indicator-warning {
  background-color: var(--warning-600);
  box-shadow: 0 2px 4px rgba(255, 193, 7, 0.3);
}

.indicator-info {
  background-color: var(--info-600);
  box-shadow: 0 2px 4px rgba(13, 202, 240, 0.3);
}

/* Pulse animation for pending status */
@keyframes pulse {
  0% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.1);
    opacity: 0.8;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

/* Screen reader only text */
.sr-only-status {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

/* High contrast theme support */
[data-theme="high-contrast"] .status-indicator {
  border: 2px solid var(--border-primary);
  background-color: #000000 !important;
  color: #ffffff !important;
}

[data-theme="high-contrast"] .status-text {
  color: #ffffff !important;
  font-weight: 700;
}

[data-theme="high-contrast"] .indicator-pending {
  animation: none;
}

/* Dark theme support */
[data-theme="dark"] .status-text {
  color: var(--text-secondary);
}

/* Responsive design */
@media (max-width: 768px) {
  .accessible-status {
    font-size: 0.8rem;
  }
  
  .status-indicator {
    width: 1rem;
    height: 1rem;
    font-size: 0.75rem;
  }
}
</style>