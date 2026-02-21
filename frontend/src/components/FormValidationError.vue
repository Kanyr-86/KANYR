<template>
  <div 
    v-if="show && errorMessage" 
    class="form-validation-error"
    role="alert"
    aria-live="polite"
  >
    <i class="bi bi-exclamation-circle me-1"></i>
    <span>{{ errorMessage }}</span>
  </div>
</template>

<script>
import { defineComponent, computed } from 'vue'

export default defineComponent({
  name: 'FormValidationError',
  props: {
    show: {
      type: Boolean,
      default: false
    },
    message: {
      type: String,
      default: ''
    },
    errors: {
      type: [Array, Object],
      default: null
    },
    field: {
      type: String,
      default: ''
    }
  },
  setup(props) {
    // Ha van errors object és field megadva, abból olvassa ki a hibát
    const errorMessage = computed(() => {
      if (props.message) return props.message
      
      if (props.errors && props.field) {
        if (Array.isArray(props.errors)) {
          const error = props.errors.find(e => e.field === props.field)
          return error?.message || ''
        } else if (typeof props.errors === 'object') {
          return props.errors[props.field]?.[0] || props.errors[props.field] || ''
        }
      }
      
      return ''
    })

    // A show csak a props.show alapján dönt, a message vizsgálat a template-ben van
    const show = computed(() => {
      return props.show
    })

    return {
      errorMessage,
      show
    }
  }
})
</script>

<style scoped>
.form-validation-error {
  display: flex;
  align-items: center;
  color: var(--danger-color, #ef4444);
  font-size: 0.875rem;
  margin-top: 0.25rem;
  padding: 0.25rem 0;
  animation: fadeIn 0.2s ease;
}

.form-validation-error i {
  font-size: 0.875rem;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-4px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  .form-validation-error {
    animation: none;
  }
}
</style>