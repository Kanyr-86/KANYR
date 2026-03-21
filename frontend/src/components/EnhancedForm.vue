<template>
  <form 
    :class="formClasses"
    @submit.prevent="handleSubmit"
    @reset="handleReset"
  >
    <!-- Auto-save indicator -->
    <div v-if="showAutoSave" class="form-auto-save mb-3">
      <AutoSaveIndicator
        v-bind="autoSaveState"
        :show-manual-save="showManualSave"
        :position="autoSavePosition"
        @manual-save="manualSave"
      />
    </div>

    <!-- Validation summary -->
    <div v-if="showValidationSummary" class="form-validation-summary mb-3">
      <ValidationSummary
        v-bind="validationSummaryProps"
        @clear-field="clearField"
        @clear-all="clearAll"
        @scroll-to-field="scrollToField"
      />
    </div>

    <!-- Form content -->
    <div class="form-content">
      <slot></slot>
    </div>

    <!-- Form actions -->
    <div v-if="showActions" class="form-actions mt-4">
      <div class="row">
        <div class="col-md-6">
          <div class="d-flex gap-2">
            <button
              type="submit"
              class="btn btn-primary"
              :disabled="isSubmitting || !isValid"
              :class="{ 'btn-loading': isSubmitting }"
            >
              <span v-if="isSubmitting" class="spinner-border spinner-border-sm me-2" role="status"></span>
              {{ submitText }}
            </button>
            
            <button
              type="button"
              class="btn btn-outline-secondary"
              @click="handleReset"
              :disabled="isSubmitting"
            >
              <i class="bi bi-arrow-clockwise me-1"></i>Alaphelyzet
            </button>
            
            <button
              v-if="showCancel"
              type="button"
              class="btn btn-outline-danger"
              @click="handleCancel"
              :disabled="isSubmitting"
            >
              <i class="bi bi-x-circle me-1"></i>Mégse
            </button>
          </div>
        </div>
        
        <div v-if="showStats" class="col-md-6 text-md-end">
<small style="color: var(--text-muted)">
            <span class="badge bg-light text-dark me-2">
              {{ fieldCount }} mező
            </span>
            <span class="badge bg-success-subtle text-success me-2">
              {{ validFieldCount }} érvényes
            </span>
            <span v-if="hasErrors" class="badge bg-danger-subtle text-danger">
              {{ errorCount }} hiba
            </span>
          </small>
        </div>
      </div>
    </div>
  </form>
</template>

<script setup>
import { computed, ref, provide, onMounted, onUnmounted } from 'vue'
import { useAutoSave } from '../composables/useAutoSave'
import { useInlineValidation } from '../composables/useInlineValidation'
import AutoSaveIndicator from './AutoSaveIndicator.vue'
import ValidationSummary from './ValidationSummary.vue'

const props = defineProps({
  // Form configuration
  modelValue: {
    type: Object,
    required: true
  },
  
  // Auto-save configuration
  enableAutoSave: {
    type: Boolean,
    default: true
  },
  autoSaveConfig: {
    type: Object,
    default: () => ({})
  },
  autoSavePosition: {
    type: String,
    default: 'top-right'
  },
  showManualSave: {
    type: Boolean,
    default: false
  },
  
  // Validation configuration
  validationRules: {
    type: Object,
    default: () => ({})
  },
  enableValidation: {
    type: Boolean,
    default: true
  },
  showValidationSummary: {
    type: Boolean,
    default: true
  },
  validationConfig: {
    type: Object,
    default: () => ({})
  },
  
  // Form actions
  showActions: {
    type: Boolean,
    default: true
  },
  showStats: {
    type: Boolean,
    default: true
  },
  showCancel: {
    type: Boolean,
    default: true
  },
  submitText: {
    type: String,
    default: 'Mentés'
  },
  
  // Form behavior
  validateOnSubmit: {
    type: Boolean,
    default: true
  },
  resetOnSubmit: {
    type: Boolean,
    default: false
  },
  scrollToError: {
    type: Boolean,
    default: true
  },
  
  // Styling
  variant: {
    type: String,
    default: 'default', // 'default', 'card', 'inline'
    validator: (value) => ['default', 'card', 'inline'].includes(value)
  }
})

const emit = defineEmits([
  'submit',
  'reset',
  'cancel',
  'update:modelValue',
  'validationChange',
  'autoSaveChange'
])

// State
const isSubmitting = ref(false)
const formErrors = ref({})

// Auto-save setup
const autoSaveState = ref(null)
const autoSaveEnabled = computed(() => props.enableAutoSave && props.autoSaveConfig.saveFunction)

if (autoSaveEnabled.value) {
  autoSaveState.value = useAutoSave(
    props.modelValue,
    props.autoSaveConfig.saveFunction,
    {
      ...props.autoSaveConfig,
      localStorageKey: props.autoSaveConfig.localStorageKey || `form-${Math.random().toString(36).substr(2, 9)}`
    }
  )
}

// Validation setup
const validationState = ref(null)
const validationEnabled = computed(() => props.enableValidation && Object.keys(props.validationRules).length > 0)

if (validationEnabled.value) {
  validationState.value = useInlineValidation(
    props.validationRules,
    props.validationConfig
  )
}

// Computed properties
const formClasses = computed(() => {
  return [
    'enhanced-form',
    `variant-${props.variant}`,
    {
      'has-auto-save': autoSaveEnabled.value,
      'has-validation': validationEnabled.value,
      'is-submitting': isSubmitting.value,
      'is-valid': isValid.value,
      'has-errors': hasErrors.value
    }
  ]
})

const isValid = computed(() => {
  if (validationState.value) {
    return validationState.value.isValid.value
  }
  return true
})

const hasErrors = computed(() => {
  if (validationState.value) {
    return validationState.value.hasErrors.value
  }
  return false
})

const errorCount = computed(() => {
  if (validationState.value) {
    return validationState.value.errorCount.value
  }
  return 0
})

const fieldCount = computed(() => {
  return Object.keys(props.validationRules).length
})

const validFieldCount = computed(() => {
  if (validationState.value) {
    return fieldCount.value - errorCount.value
  }
  return fieldCount.value
})

const validationSummaryProps = computed(() => {
  if (validationState.value) {
    return validationState.value.getSummaryProps()
  }
  return {
    isValid: true,
    hasErrors: false,
    errorCount: 0,
    progress: 100,
    errors: []
  }
})

// Provide context to child components
provide('enhancedForm', {
  modelValue: props.modelValue,
  validationState: validationState.value,
  autoSaveState: autoSaveState.value,
  validationRules: props.validationRules,
  isSubmitting
})

// Methods
const handleSubmit = async (event) => {
  isSubmitting.value = true
  
  try {
    // Validate form if validation is enabled
    if (validationEnabled.value && props.validateOnSubmit) {
      const isValidForm = await validationState.value.validateAll(props.modelValue)
      if (!isValidForm) {
        if (props.scrollToError) {
          scrollToFirstError()
        }
        return
      }
    }
    
    // Emit submit event
    emit('submit', {
      data: props.modelValue,
      isValid: isValid.value,
      errors: validationState.value?.errors.value || {}
    })
    
    // Reset form if configured
    if (props.resetOnSubmit) {
      handleReset()
    }
    
  } catch (error) {
    console.error('Form submission error:', error)
  } finally {
    isSubmitting.value = false
  }
}

const handleReset = () => {
  emit('reset')
  
  // Clear validation state
  if (validationState.value) {
    validationState.value.clearAll()
  }
  
  // Clear auto-save state
  if (autoSaveState.value) {
    autoSaveState.value.clearState()
  }
}

const handleCancel = () => {
  emit('cancel')
  
  // Clear validation state
  if (validationState.value) {
    validationState.value.clearAll()
  }
  
  // Clear auto-save state
  if (autoSaveState.value) {
    autoSaveState.value.clearState()
  }
}

const manualSave = async () => {
  if (autoSaveState.value) {
    await autoSaveState.value.manualSave()
  }
}

const clearField = (field) => {
  if (validationState.value) {
    validationState.value.clearField(field)
  }
}

const clearAll = () => {
  if (validationState.value) {
    validationState.value.clearAll()
  }
}

const scrollToField = (field) => {
  const fieldElement = document.querySelector(`[name="${field}"]`)
  if (fieldElement) {
    fieldElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
    fieldElement.focus()
  }
}

const scrollToFirstError = () => {
  if (validationState.value && validationState.value.validationSummary.value.length > 0) {
    const firstErrorField = validationState.value.validationSummary.value[0].field
    scrollToField(firstErrorField)
  }
}

// Watch for validation changes
if (validationState.value) {
  onMounted(() => {
    // Watch validation state changes
    validationState.value.errors.value = formErrors.value
  })
}

// Cleanup
onUnmounted(() => {
  if (autoSaveState.value) {
    autoSaveState.value.clearState()
  }
})
</script>

<style scoped>
.enhanced-form {
  position: relative;
}

/* Variant styles */
.variant-default {
  /* Default form styling */
}

.variant-card {
  background-color: var(--bg-card);
  border: 1px solid var(--border-light);
  border-radius: var(--border-radius-lg);
  padding: 24px;
}

.variant-inline {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* Auto-save section */
.form-auto-save {
  position: relative;
}

/* Validation summary section */
.form-validation-summary {
  position: relative;
}

/* Form content */
.form-content {
  position: relative;
}

/* Form actions */
.form-actions {
  position: relative;
}

/* Loading state */
.btn-loading {
  position: relative;
  pointer-events: none;
}

.btn-loading .spinner-border {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .variant-card {
    padding: 16px;
  }
  
  .form-actions {
    flex-direction: column;
    gap: 8px;
  }
  
  .form-actions .col-md-6 {
    width: 100%;
  }
  
  .form-actions .col-md-6.text-md-end {
    text-align: left;
  }
}

/* Dark theme support */
[data-theme="dark"] .enhanced-form.variant-card {
  background-color: var(--bg-card);
  border-color: var(--border-dark);
}

/* High contrast theme support */
[data-theme="high-contrast"] .enhanced-form.variant-card {
  border: 2px solid var(--border-primary);
  background-color: var(--bg-page);
}

/* Animation for state changes */
.enhanced-form.is-submitting {
  opacity: 0.8;
  pointer-events: none;
}

.enhanced-form.is-valid {
  animation: formValid 0.3s ease-out;
}

.enhanced-form.has-errors {
  animation: formInvalid 0.3s ease-out;
}

@keyframes formValid {
  0% { transform: scale(1); }
  50% { transform: scale(1.02); }
  100% { transform: scale(1); }
}

@keyframes formInvalid {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-2px); }
  75% { transform: translateX(2px); }
}

/* Print styles */
@media print {
  .enhanced-form {
    border: none;
    background-color: transparent;
  }
  
  .form-auto-save,
  .form-validation-summary,
  .form-actions {
    display: none;
  }
  
  .variant-card {
    padding: 0;
    border: none;
    background-color: transparent;
  }
}
</style>