<template>
  <Teleport to="body">
    <transition name="modal">
      <div 
        v-if="isVisible" 
        class="confirm-dialog-overlay"
        role="dialog"
        aria-modal="true"
        :aria-labelledby="`dialog-title-${uid}`"
        :aria-describedby="`dialog-message-${uid}`"
        @click.self="cancel"
      >
        <div class="confirm-dialog" :class="variantClass">
          <div class="confirm-dialog-header">
            <h5 :id="`dialog-title-${uid}`" class="confirm-dialog-title">
              <i v-if="icon" :class="iconClass" class="me-2"></i>
              {{ title }}
            </h5>
          </div>
          
          <div class="confirm-dialog-body">
            <p :id="`dialog-message-${uid}`" class="confirm-dialog-message">
              {{ message }}
            </p>
            <p v-if="details" class="confirm-dialog-details text-muted">
              {{ details }}
            </p>
          </div>
          
          <div class="confirm-dialog-footer">
            <button 
              type="button"
              class="btn btn-secondary"
              @click="cancel"
              :disabled="loading"
              ref="cancelButton"
            >
              {{ cancelText }}
            </button>
            <button 
              type="button"
              class="btn"
              :class="confirmButtonClass"
              @click="confirm"
              :disabled="loading"
            >
              <span v-if="loading" class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
              {{ confirmText }}
            </button>
          </div>
        </div>
      </div>
    </transition>
  </Teleport>
</template>

<script>
import { defineComponent, computed, ref, watch, nextTick } from 'vue'

export default defineComponent({
  name: 'ConfirmDialog',
  props: {
    modelValue: {
      type: Boolean,
      default: false
    },
    title: {
      type: String,
      default: 'Megerősítés'
    },
    message: {
      type: String,
      default: 'Biztosan folytatja?'
    },
    details: {
      type: String,
      default: ''
    },
    confirmText: {
      type: String,
      default: 'Megerősít'
    },
    cancelText: {
      type: String,
      default: 'Mégse'
    },
    variant: {
      type: String,
      default: 'primary',
      validator: (value) => ['primary', 'danger', 'warning', 'success', 'info'].includes(value)
    },
    icon: {
      type: Boolean,
      default: true
    },
    loading: {
      type: Boolean,
      default: false
    }
  },
  emits: ['update:modelValue', 'confirm', 'cancel'],
  setup(props, { emit }) {
    const uid = Math.random().toString(36).substring(2, 9)
    const cancelButton = ref(null)

    const isVisible = computed({
      get: () => props.modelValue,
      set: (value) => emit('update:modelValue', value)
    })

    const variantClass = computed(() => `variant-${props.variant}`)

    const iconClass = computed(() => {
      const icons = {
        primary: 'bi bi-question-circle',
        danger: 'bi bi-exclamation-triangle',
        warning: 'bi bi-exclamation-circle',
        success: 'bi bi-check-circle',
        info: 'bi bi-info-circle'
      }
      return icons[props.variant] || icons.primary
    })

    const confirmButtonClass = computed(() => {
      const classes = {
        primary: 'btn-primary',
        danger: 'btn-danger',
        warning: 'btn-warning',
        success: 'btn-success',
        info: 'btn-info'
      }
      return classes[props.variant] || 'btn-primary'
    })

    const confirm = () => {
      emit('confirm')
    }

    const cancel = () => {
      if (!props.loading) {
        isVisible.value = false
        emit('cancel')
      }
    }

    // Focus the cancel button when dialog opens
    watch(isVisible, async (value) => {
      if (value) {
        await nextTick()
        cancelButton.value?.focus()
        
        // Trap focus within dialog
        document.addEventListener('keydown', handleKeydown)
      } else {
        document.removeEventListener('keydown', handleKeydown)
      }
    })

    const handleKeydown = (event) => {
      if (event.key === 'Escape' && !props.loading) {
        cancel()
      }
    }

    return {
      uid,
      isVisible,
      variantClass,
      iconClass,
      confirmButtonClass,
      cancelButton,
      confirm,
      cancel
    }
  }
})
</script>

<style scoped>
.confirm-dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: var(--modal-overlay, rgba(0, 0, 0, 0.5));
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1050;
  padding: 1rem;
}

.confirm-dialog {
  background-color: var(--card-bg, #ffffff);
  border-radius: var(--border-radius-lg, 12px);
  box-shadow: var(--shadow-xl, 0 20px 25px -5px rgba(48, 77, 109, 0.15));
  max-width: 500px;
  width: 100%;
  overflow: hidden;
}

.confirm-dialog-header {
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid var(--border-primary, #a5bcd2);
}

.confirm-dialog-title {
  margin: 0;
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--text-primary, #1e252f);
  display: flex;
  align-items: center;
}

.variant-danger .confirm-dialog-title {
  color: var(--danger-color, #ef4444);
}

.variant-warning .confirm-dialog-title {
  color: var(--warning-color, #f59e0b);
}

.variant-success .confirm-dialog-title {
  color: var(--success-color, #10b981);
}

.confirm-dialog-body {
  padding: 1.5rem;
}

.confirm-dialog-message {
  margin: 0;
  color: var(--text-primary, #1e252f);
  font-size: 1rem;
  line-height: 1.5;
}

.confirm-dialog-details {
  margin: 0.75rem 0 0 0;
  font-size: 0.875rem;
}

.confirm-dialog-footer {
  padding: 1rem 1.5rem;
  border-top: 1px solid var(--border-primary, #a5bcd2);
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
}

/* Transitions */
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.2s ease;
}

.modal-enter-active .confirm-dialog,
.modal-leave-active .confirm-dialog {
  transition: transform 0.2s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-from .confirm-dialog,
.modal-leave-to .confirm-dialog {
  transform: scale(0.95);
}

/* Button touch targets */
.confirm-dialog-footer .btn {
  min-height: 44px;
  min-width: 100px;
}

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  .modal-enter-active,
  .modal-leave-active,
  .modal-enter-active .confirm-dialog,
  .modal-leave-active .confirm-dialog {
    transition: none;
  }
}
</style>