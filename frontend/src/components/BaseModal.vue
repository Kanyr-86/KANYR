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
                  aria-label="Close"
                  @click="close"
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
                  @click="close"
                >
                  Close
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
      (newValue) => {
        preventBodyScroll(newValue)
        
        if (newValue && modalRef.value) {
          // Focus the modal when opened
          modalRef.value.focus()
        }
      },
      { immediate: true }
    )

    // Add/remove event listeners
    onMounted(() => {
      document.addEventListener('keydown', handleEscapeKey)
    })

    onUnmounted(() => {
      document.removeEventListener('keydown', handleEscapeKey)
      preventBodyScroll(false)
    })

    return {
      modalRef,
      titleId,
      sizeClass,
      close,
      handleBackdropClick
    }
  }
})
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1050;
  padding: 1rem;
}

.modal-dialog {
  background: none;
  max-height: calc(100vh - 2rem);
  display: flex;
  flex-direction: column;
}

.modal-content {
  background-color: #fff;
  border-radius: 0.375rem;
  box-shadow: 0 0.25rem 0.5rem rgba(0, 0, 0, 0.15);
  max-height: calc(100vh - 2rem);
  overflow-y: auto;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem;
  border-bottom: 1px solid #dee2e6;
}

.modal-title {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 500;
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
  border-top: 1px solid #dee2e6;
  gap: 0.5rem;
}

/* Transition animations */
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s ease;
}

.modal-enter-active .modal-dialog,
.modal-leave-active .modal-dialog {
  transition: transform 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-from .modal-dialog,
.modal-leave-to .modal-dialog {
  transform: scale(0.95) translateY(-20px);
}

/* Responsive adjustments */
@media (max-width: 575.98px) {
  .modal-overlay {
    padding: 0.5rem;
  }

  .modal-dialog {
    margin: 0;
    max-width: 100%;
  }
}
</style>