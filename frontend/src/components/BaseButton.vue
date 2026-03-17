<template>
  <button
    :type="type"
    class="btn base-button"
    :class="buttonClasses"
    :disabled="isDisabled"
    :aria-label="ariaLabel"
    :title="title"
    @click="handleClick"
  >
    <!-- Loading Spinner -->
    <span
      v-if="loading"
      class="spinner-border spinner-border-sm me-1"
      role="status"
      aria-hidden="true"
    ></span>

    <!-- Icon (from prop or slot) -->
    <span v-if="showIcon && !loading" class="button-icon me-1">
      <slot name="icon">
        <i :class="iconClass"></i>
      </slot>
    </span>

    <!-- Button Content -->
    <slot></slot>
  </button>
</template>

<script>
import { defineComponent, computed } from 'vue'

/**
 * All valid Bootstrap 5 button variants
 */
const VALID_VARIANTS = [
  'primary',
  'secondary',
  'success',
  'danger',
  'warning',
  'info',
  'light',
  'dark',
  'link',
  'outline-primary',
  'outline-secondary',
  'outline-success',
  'outline-danger',
  'outline-warning',
  'outline-info',
  'outline-light',
  'outline-dark'
]

/**
 * BaseButton - A reusable button component with Bootstrap 5 styling
 * 
 * Features:
 * - All Bootstrap 5 button variants (solid and outline)
 * - Multiple sizes (sm, md, lg)
 * - Loading state with spinner
 * - Icon support (Bootstrap Icons)
 * - Block layout option
 * - Proper disabled state during loading
 * 
 * @example Basic buttons
 * ```vue
 * <BaseButton variant="primary">Primary</BaseButton>
 * <BaseButton variant="secondary">Secondary</BaseButton>
 * <BaseButton variant="success">Success</BaseButton>
 * <BaseButton variant="danger">Danger</BaseButton>
 * <BaseButton variant="warning">Warning</BaseButton>
 * <BaseButton variant="outline-primary">Outline</BaseButton>
 * ```
 * 
 * @example With loading state
 * ```vue
 * <BaseButton 
 *   variant="primary" 
 *   :loading="isSubmitting"
 *   @click="handleSubmit"
 * >
 *   {{ isSubmitting ? 'Saving...' : 'Save' }}
 * </BaseButton>
 * ```
 * 
 * @example With icon
 * ```vue
 * <BaseButton variant="success" icon="bi-save">
 *   Save Changes
 * </BaseButton>
 * 
 * <BaseButton variant="danger" icon="bi-trash">
 *   Delete
 * </BaseButton>
 * ```
 * 
 * @example Button sizes
 * ```vue
 * <BaseButton variant="primary" size="sm">Small</BaseButton>
 * <BaseButton variant="primary" size="md">Medium</BaseButton>
 * <BaseButton variant="primary" size="lg">Large</BaseButton>
 * ```
 * 
 * @example Block (full width) button
 * ```vue
 * <BaseButton variant="primary" block>
 *   Full Width Button
 * </BaseButton>
 * ```
 * 
 * @example Submit button for forms
 * ```vue
 * <form @submit.prevent="handleSubmit">
 *   <BaseButton type="submit" variant="primary" :loading="isSubmitting">
 *     Submit Form
 * </BaseButton>
 * </form>
 * ```
 * 
 * @example Custom icon slot
 * ```vue
 * <BaseButton variant="primary">
 *   <template #icon>
 *     <svg>...</svg>
 *   </template>
 *   Custom Icon
 * </BaseButton>
 * ```
 */
export default defineComponent({
  name: 'BaseButton',

  props: {
    /**
     * Button style variant
     * @type {'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'info' | 'light' | 'dark' | 'link' | 'outline-primary' | 'outline-secondary' | 'outline-success' | 'outline-danger' | 'outline-warning' | 'outline-info' | 'outline-light' | 'outline-dark'}
     */
    variant: {
      type: String,
      default: 'primary',
      validator: (value) => VALID_VARIANTS.includes(value)
    },

    /**
     * Button size
     * @type {'sm' | 'md' | 'lg'}
     */
    size: {
      type: String,
      default: 'md',
      validator: (value) => ['sm', 'md', 'lg'].includes(value)
    },

    /**
     * Show loading spinner and disable button
     * @type {boolean}
     */
    loading: {
      type: Boolean,
      default: false
    },

    /**
     * Disable the button
     * @type {boolean}
     */
    disabled: {
      type: Boolean,
      default: false
    },

    /**
     * Button type attribute
     * @type {'button' | 'submit' | 'reset'}
     */
    type: {
      type: String,
      default: 'button',
      validator: (value) => ['button', 'submit', 'reset'].includes(value)
    },

    /**
     * Bootstrap icon class (e.g., 'bi-save', 'bi-trash')
     * @type {string}
     */
    icon: {
      type: String,
      default: ''
    },

    /**
     * Make button full width
     * @type {boolean}
     */
    block: {
      type: Boolean,
      default: false
    },

    /**
     * ARIA label for accessibility (overrides auto-generated labels)
     * @type {string}
     */
    ariaLabel: {
      type: String,
      default: ''
    },

    /**
     * Title attribute for tooltip
     * @type {string}
     */
    title: {
      type: String,
      default: ''
    }
  },

  emits: ['click'],

  setup(props, { emit, slots }) {
    /**
     * Computed button classes
     */
    const buttonClasses = computed(() => {
      const classes = [`btn-${props.variant}`]

      // Size class (only add if not 'md' which is default)
      if (props.size !== 'md') {
        classes.push(`btn-${props.size}`)
      }

      // Block class
      if (props.block) {
        classes.push('w-100')
      }

      return classes
    })

    /**
     * Icon class with Bootstrap Icons prefix
     */
    const iconClass = computed(() => {
      if (!props.icon) return ''
      // Add 'bi' class if not already present
      return props.icon.startsWith('bi-') ? `bi ${props.icon}` : props.icon
    })

    /**
     * Check if icon should be shown
     */
    const showIcon = computed(() => {
      return props.icon || slots.icon
    })

    /**
     * Computed disabled state (disabled when loading or explicitly disabled)
     */
    const isDisabled = computed(() => {
      return props.loading || props.disabled
    })

    /**
     * ARIA label for accessibility
     */
    const ariaLabel = computed(() => {
      // If button has explicit aria-label prop, use it
      if (props.ariaLabel) {
        return props.ariaLabel
      }
      
      // If button has icon but no text content, generate label from icon
      if (props.icon && !slots.default) {
        return getAriaLabelFromIcon(props.icon)
      }
      
      // If button has text content, use that as label
      if (slots.default) {
        return undefined // Let screen reader use button text
      }
      
      // Default fallback
      return props.variant === 'primary' ? 'Gomb' : undefined
    })

    /**
     * Title attribute for tooltip
     */
    const title = computed(() => {
      if (props.title) {
        return props.title
      }
      
      // Generate title from icon if no explicit title
      if (props.icon && !props.title) {
        return getAriaLabelFromIcon(props.icon)
      }
      
      return undefined
    })

    /**
     * Get ARIA label from icon class
     */
    function getAriaLabelFromIcon(iconClass) {
      const iconLabels = {
        'bi-save': 'Mentés',
        'bi-trash': 'Törlés',
        'bi-pencil': 'Szerkesztés',
        'bi-eye': 'Megtekintés',
        'bi-plus': 'Hozzáadás',
        'bi-x': 'Bezárás',
        'bi-check': 'Megerősítés',
        'bi-arrow-left': 'Vissza',
        'bi-arrow-right': 'Tovább',
        'bi-search': 'Keresés',
        'bi-download': 'Letöltés',
        'bi-upload': 'Feltöltés',
        'bi-printer': 'Nyomtatás',
        'bi-gear': 'Beállítások',
        'bi-info': 'Információ',
        'bi-question': 'Súgó',
        'bi-exclamation': 'Figyelmeztetés',
        'bi-check-circle': 'Sikeres',
        'bi-x-circle': 'Hiba',
        'bi-exclamation-triangle': 'Figyelmeztetés',
        'bi-info-circle': 'Információ'
      }
      
      return iconLabels[iconClass] || 'Gomb'
    }

    /**
     * Handle click event
     * @param {Event} event
     */
    function handleClick(event) {
      if (!isDisabled.value) {
        emit('click', event)
      }
    }

    return {
      buttonClasses,
      iconClass,
      showIcon,
      isDisabled,
      ariaLabel,
      title,
      handleClick
    }
  }
})
</script>

<style scoped>
.base-button {
  /* Uses standardized CSS variables from variables.css */
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--btn-gap, 0.5rem);
}

.base-button:disabled {
  cursor: not-allowed;
  pointer-events: none;
}

.button-icon {
  display: inline-flex;
  align-items: center;
}

/* Ensure spinner is properly sized */
.spinner-border-sm {
  width: 1rem;
  height: 1rem;
}
</style>
