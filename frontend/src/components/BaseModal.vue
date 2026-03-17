<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="show"
        class="modal-overlay"
        @click.self="handleBackdropClick"
      >
        <div
          ref="modalRef"
          class="modal-dialog"
          :class="sizeClass"
          role="dialog"
          aria-modal="true"
          :aria-labelledby="titleId"
          :aria-describedby="descriptionId"
          :aria-label="ariaLabel || title"
        >
          <div class="modal-content">
            <!-- Header -->
            <div class="modal-header">
              <slot name="header">
                <h5 :id="titleId" class="modal-title">
                  {{ title }}
                </h5>
                <button
                  type="button"
                  class="btn-close"
                  :aria-label="closeButtonLabel"
                  :title="closeButtonLabel"
                  @click="close"
                  @keydown="handleCloseKeydown"
                ></button>
              </slot>
            </div>

            <!-- Body -->
            <div class="modal-body">
              <slot></slot>
            </div>

            <!-- Footer -->
            <div v-if="!hideFooter" class="modal-footer">
              <slot name="footer">
                <button
                  type="button"
                  class="btn btn-secondary"
                  :aria-label="closeButtonLabel"
                  @click="close"
                  @keydown="handleCloseKeydown"
                >
                  {{ closeButtonText }}
                </button>
              </slot>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script>
import { defineComponent, computed, watch, ref, onMounted, onUnmounted } from 'vue'

/**
 * BaseModal - A reusable modal component with Bootstrap 5 styling
 * 
 * Usage Examples (see below in comments for full code examples):
 * 
 * Basic usage:
 * - Use v-model:show to control visibility
 * - Use title prop for header text
 * - Listen to @close event for cleanup
 * 
 * Form submission pattern:
 * - Wrap form elements in body slot
 * - Use #footer slot for custom action buttons
 * - Handle loading states and validation errors
 * 
 * @example Basic usage
 * // In template:
 * // <BaseModal v-model:show="showModal" title="Confirm" @close="handleClose">
 * //   <p>Are you sure?</p>
 * // </BaseModal>
 */
export default defineComponent({
  name: 'BaseModal',

  props: {
    /**
     * Modal header title
     * @type {string}
     */
    title: {
      type: String,
      default: ''
    },

    /**
     * Controls modal visibility (use with v-model:show)
     * @type {boolean}
     */
    show: {
      type: Boolean,
      default: false
    },

    /**
     * Modal size: 'sm', 'md', 'lg', 'xl'
     * @type {string}
     */
    size: {
      type: String,
      default: 'md',
      validator: (value) => ['sm', 'md', 'lg', 'xl'].includes(value)
    },

    /**
     * Hide the default footer
     * @type {boolean}
     */
    hideFooter: {
      type: Boolean,
      default: false
    },

    /**
     * Allow closing by clicking on backdrop
     * @type {boolean}
     */
    closeOnBackdrop: {
      type: Boolean,
      default: true
    },

    /**
     * Allow closing by pressing Escape key
     * @type {boolean}
     */
    closeOnEscape: {
      type: Boolean,
      default: true
    }
  },

  emits: ['close', 'update:show'],

  setup(props, { emit }) {
    const modalRef = ref(null)
    const titleId = computed(() => `modal-title-${Math.random().toString(36).substr(2, 9)}`)
    const descriptionId = computed(() => `modal-description-${Math.random().toString(36).substr(2, 9)}`)
    
    // Store the element that triggered the modal for focus restoration
    const triggerElement = ref(null)

    const sizeClass = computed(() => {
      const sizeMap = {
        sm: 'modal-sm',
        md: '',
        lg: 'modal-lg',
        xl: 'modal-xl'
      }
      return sizeMap[props.size] || ''
    })

    /**
     * Close button label for accessibility
     */
    const closeButtonLabel = computed(() => {
      return props.title ? `Bezárás: ${props.title}` : 'Bezárás'
    })

    /**
     * Close button text
     */
    const closeButtonText = computed(() => {
      return props.title ? 'Bezárás' : 'Close'
    })

    /**
     * ARIA label for the modal
     */
    const ariaLabel = computed(() => {
      return props.title ? `${props.title} párbeszédablak` : undefined
    })

    /**
     * Get all focusable elements within the modal
     */
    function getFocusableElements() {
      if (!modalRef.value) return []
      
      const focusableSelector = [
        'a[href]',
        'button:not([disabled])',
        'input:not([disabled])',
        'textarea:not([disabled])',
        'select:not([disabled])',
        '[tabindex]:not([tabindex="-1"])',
        '[contenteditable="true"]'
      ].join(', ')
      
      return Array.from(modalRef.value.querySelectorAll(focusableSelector))
        .filter(el => {
          // Filter out elements that are not visible or have zero dimensions
          const style = window.getComputedStyle(el)
          return style.display !== 'none' && 
                 style.visibility !== 'hidden' && 
                 el.offsetWidth > 0 && 
                 el.offsetHeight > 0
        })
    }

    /**
     * Focus the first focusable element in the modal
     */
    function focusFirstElement() {
      const focusableElements = getFocusableElements()
      if (focusableElements.length > 0) {
        focusableElements[0].focus()
      } else {
        // If no focusable elements, focus the modal itself
        modalRef.value.focus()
      }
    }

    /**
     * Focus the last focusable element in the modal
     */
    function focusLastElement() {
      const focusableElements = getFocusableElements()
      if (focusableElements.length > 0) {
        focusableElements[focusableElements.length - 1].focus()
      } else {
        modalRef.value.focus()
      }
    }

    /**
     * Handle tab key to trap focus within modal
     */
    function handleTabKey(event) {
      if (event.key !== 'Tab') return
      
      const focusableElements = getFocusableElements()
      if (focusableElements.length === 0) return

      const firstElement = focusableElements[0]
      const lastElement = focusableElements[focusableElements.length - 1]
      const activeElement = document.activeElement

      if (event.shiftKey) {
        // Shift + Tab: if focus is on first element, focus last
        if (activeElement === firstElement) {
          event.preventDefault()
          lastElement.focus()
        }
      } else {
        // Tab: if focus is on last element, focus first
        if (activeElement === lastElement) {
          event.preventDefault()
          firstElement.focus()
        }
      }
    }

    /**
     * Handle keydown events on close button
     */
    function handleCloseKeydown(event) {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault()
        close()
      }
    }

    /**
     * Handle keydown events for focus trapping
     */
    function handleKeydown(event) {
      if (props.show && modalRef.value) {
        handleTabKey(event)
      }
    }

    /**
     * Close the modal
     */
    function close() {
      emit('close')
      emit('update:show', false)
    }

    /**
     * Handle click on backdrop
     */
    function handleBackdropClick() {
      if (props.closeOnBackdrop) {
        close()
      }
    }

    /**
     * Handle Escape key press
     */
    function handleEscapeKey(event) {
      if (props.closeOnEscape && event.key === 'Escape' && props.show) {
        close()
      }
    }

    /**
     * Prevent body scroll when modal is open
     */
    function preventBodyScroll(prevent) {
      if (prevent) {
        document.body.style.overflow = 'hidden'
      } else {
        document.body.style.overflow = ''
      }
    }

    // Watch for show prop changes
    watch(
      () => props.show,
      (newValue, oldValue) => {
        preventBodyScroll(newValue)
        
        if (newValue && !oldValue && modalRef.value) {
          // Store the triggering element for focus restoration
          triggerElement.value = document.activeElement
          
          // Focus the modal when opened
          modalRef.value.focus()
          
          // Then focus the first interactive element
          setTimeout(() => {
            focusFirstElement()
          }, 50)
        } else if (!newValue && oldValue && triggerElement.value) {
          // Restore focus to the triggering element when modal closes
          setTimeout(() => {
            if (triggerElement.value && typeof triggerElement.value.focus === 'function') {
              triggerElement.value.focus()
            }
            triggerElement.value = null
          }, 50)
        }
      },
      { immediate: true }
    )

    // Add/remove event listeners
    onMounted(() => {
      document.addEventListener('keydown', handleEscapeKey)
      document.addEventListener('keydown', handleKeydown)
    })

    onUnmounted(() => {
      document.removeEventListener('keydown', handleEscapeKey)
      document.removeEventListener('keydown', handleKeydown)
      preventBodyScroll(false)
    })

    return {
      modalRef,
      titleId,
      descriptionId,
      sizeClass,
      closeButtonLabel,
      closeButtonText,
      ariaLabel,
      handleCloseKeydown,
      close,
      handleBackdropClick
    }
  }
})
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  /* Modern replacement for top/left/right/bottom: 0 */
  background-color: rgba(0, 0, 0, 0.5);
  display: grid;
  place-items: center;
  /* Ensures proper centering on all screen sizes */
  z-index: var(--z-modal);
  padding: 1rem;
}

.modal-dialog {
  background: none;
  max-width: min(90vw, 600px);
  /* Responsive max-width */
  max-height: min(90vh, 800px);
  /* Responsive max-height */
  display: flex;
  flex-direction: column;
  overflow-y: auto;
}

.modal-content {
  background-color: var(--bg-page);
  border-radius: 0.375rem;
  box-shadow: var(--shadow-card);
  max-height: 100%;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem;
  border-bottom: 1px solid var(--border-primary);
}

.modal-title {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 500;
  color: var(--text-primary);
}

.modal-body {
  padding: 1rem;
  flex: 1;
  overflow-y: auto;
}

.modal-footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding: 1rem;
  border-top: 1px solid var(--border-primary);
  gap: 0.5rem;
}

/* Transition animations - Performance optimized with transform/opacity only */
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s ease;
  will-change: opacity;
}

.modal-enter-active .modal-dialog,
.modal-leave-active .modal-dialog {
  transition: transform 0.3s ease;
  will-change: transform;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-from .modal-dialog,
.modal-leave-to .modal-dialog {
  transform: scale(0.95) translateY(-20px);
}

/* Reduced motion support for accessibility */
@media (prefers-reduced-motion: reduce) {
  .modal-enter-active,
  .modal-leave-active {
    transition: none !important;
  }

  .modal-enter-active .modal-dialog,
  .modal-leave-active .modal-dialog {
    transition: none !important;
    transform: none !important;
  }

  .modal-enter-from,
  .modal-leave-to {
    opacity: 1 !important;
  }

  .modal-enter-from .modal-dialog,
  .modal-leave-to .modal-dialog {
    transform: none !important;
  }
}

/* Responsive adjustments */
@media (max-width: 575.98px) {
  .modal-overlay {
    padding: 0.5rem;
  }

  .modal-dialog {
    margin: 0;
    max-width: min(95vw, 600px);
    /* Slightly wider on small screens for better usability */
    max-height: min(95vh, 800px);
  }
}

/* Dark theme overrides */
[data-theme="dark"] .modal-overlay {
  background-color: rgba(0, 0, 0, 0.7);
}

[data-theme="dark"] .modal-content {
  background-color: var(--bg-card);
  border: 1px solid var(--border-primary);
}

[data-theme="dark"] .modal-header {
  background-color: var(--bg-tertiary);
  border-bottom-color: var(--border-primary);
}

[data-theme="dark"] .modal-title {
  color: var(--text-primary);
}

[data-theme="dark"] .modal-body {
  background-color: var(--bg-card);
  color: var(--text-primary);
}

[data-theme="dark"] .modal-footer {
  background-color: var(--bg-tertiary);
  border-top-color: var(--border-primary);
}

/* High contrast theme overrides */
[data-theme="high-contrast"] .modal-overlay {
  background-color: rgba(0, 0, 0, 0.8);
}

[data-theme="high-contrast"] .modal-content {
  background-color: var(--bg-card);
  border: 2px solid var(--border-primary);
}

[data-theme="high-contrast"] .modal-header {
  border-bottom: 2px solid var(--border-primary);
}

[data-theme="high-contrast"] .modal-title {
  color: var(--text-primary);
  font-weight: 700;
}

[data-theme="high-contrast"] .modal-footer {
  border-top: 2px solid var(--border-primary);
}
</style>
