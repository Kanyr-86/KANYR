<template>
  <div class="field-hint" :class="hintClasses">
    <!-- Main hint text -->
    <div v-if="text" class="hint-text">
      <i v-if="icon" :class="icon" class="me-1"></i>
      <span>{{ text }}</span>
    </div>
    
    <!-- Examples -->
    <div v-if="examples.length" class="hint-examples">
      <span class="example-label" v-if="showLabel">Példák:</span>
      <div class="examples-list">
        <span 
          v-for="(example, index) in examples" 
          :key="index"
          class="badge"
          :class="exampleBadgeClass"
        >
          {{ example }}
        </span>
      </div>
    </div>
    
    <!-- Validation rules -->
    <div v-if="validationRules.length" class="hint-rules">
      <span class="rules-label" v-if="showLabel">Követelmények:</span>
      <ul class="rules-list">
        <li 
          v-for="(rule, index) in validationRules" 
          :key="index"
          class="rule-item"
        >
          <i :class="rule.icon || 'bi bi-check-circle'" class="me-1"></i>
          <span>{{ rule.text }}</span>
        </li>
      </ul>
    </div>
    
    <!-- Interactive demo -->
    <div v-if="interactiveDemo" class="hint-interactive">
      <div class="demo-input-group">
        <label class="form-label text-muted small">{{ demoLabel || 'Próbálja ki:' }}</label>
        <div class="input-group">
          <input
            type="text"
            class="form-control form-control-sm"
            :placeholder="demoPlaceholder || 'Írja be a mintát...'"
            v-model="demoInput"
            @input="validateDemoInput"
          >
          <button 
            class="btn btn-outline-secondary btn-sm"
            type="button"
            @click="clearDemo"
            title="Törlés"
          >
            <i class="bi bi-x"></i>
          </button>
        </div>
        <div v-if="demoValidation" class="form-text" :class="demoValidationClass">
          {{ demoValidation.message }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue'

const props = defineProps({
  // Main hint text
  text: {
    type: String,
    default: ''
  },
  
  // Icon for the hint
  icon: {
    type: String,
    default: 'bi bi-info-circle'
  },
  
  // Examples array
  examples: {
    type: Array,
    default: () => []
  },
  
  // Validation rules array
  validationRules: {
    type: Array,
    default: () => []
  },
  
  // Interactive demo
  interactiveDemo: {
    type: Boolean,
    default: false
  },
  
  demoLabel: {
    type: String,
    default: ''
  },
  
  demoPlaceholder: {
    type: String,
    default: ''
  },
  
  demoValidator: {
    type: Function,
    default: null
  },
  
  // Configuration
  showLabel: {
    type: Boolean,
    default: true
  },
  
  position: {
    type: String,
    default: 'bottom', // 'top', 'bottom', 'left', 'right'
    validator: (value) => ['top', 'bottom', 'left', 'right'].includes(value)
  },
  
  variant: {
    type: String,
    default: 'info', // 'info', 'success', 'warning', 'danger'
    validator: (value) => ['info', 'success', 'warning', 'danger'].includes(value)
  }
})

// Demo input state
const demoInput = ref('')
const demoValidation = ref(null)

// Computed classes
const hintClasses = computed(() => {
  return [
    `position-${props.position}`,
    `variant-${props.variant}`,
    {
      'has-examples': props.examples.length > 0,
      'has-rules': props.validationRules.length > 0,
      'has-interactive': props.interactiveDemo
    }
  ]
})

const exampleBadgeClass = computed(() => {
  switch (props.variant) {
    case 'success': return 'bg-success-subtle text-success'
    case 'warning': return 'bg-warning-subtle text-warning'
    case 'danger': return 'bg-danger-subtle text-danger'
    default: return 'bg-info-subtle text-info'
  }
})

const demoValidationClass = computed(() => {
  if (!demoValidation.value) return ''
  return demoValidation.value.isValid ? 'text-success' : 'text-danger'
})

// Demo validation
const validateDemoInput = () => {
  if (!props.demoValidator || !demoInput.value) {
    demoValidation.value = null
    return
  }
  
  const result = props.demoValidator(demoInput.value)
  demoValidation.value = {
    isValid: result.isValid,
    message: result.message || (result.isValid ? 'Érvényes formátum' : 'Érvénytelen formátum')
  }
}

// Clear demo input
const clearDemo = () => {
  demoInput.value = ''
  demoValidation.value = null
}

// Watch for changes in demo validator
watch(() => props.demoValidator, () => {
  if (demoInput.value && props.demoValidator) {
    validateDemoInput()
  }
})
</script>

<style scoped>
.field-hint {
  font-size: 0.875rem;
  line-height: 1.4;
  transition: all 0.3s ease;
}

/* Position variants */
.position-top {
  margin-bottom: 8px;
}

.position-bottom {
  margin-top: 8px;
}

.position-left {
  margin-right: 12px;
  display: inline-block;
}

.position-right {
  margin-left: 12px;
  display: inline-block;
}

/* Variant colors */
.variant-info {
  color: var(--info-700);
  background-color: rgba(56, 189, 248, 0.1);
  border: 1px solid rgba(56, 189, 248, 0.3);
  border-radius: var(--border-radius-sm);
  padding: 8px 10px;
}

.variant-success {
  color: var(--success-700);
  background-color: rgba(34, 197, 94, 0.1);
  border: 1px solid rgba(34, 197, 94, 0.3);
  border-radius: var(--border-radius-sm);
  padding: 8px 10px;
}

.variant-warning {
  color: var(--warning-700);
  background-color: rgba(251, 191, 36, 0.1);
  border: 1px solid rgba(251, 191, 36, 0.3);
  border-radius: var(--border-radius-sm);
  padding: 8px 10px;
}

.variant-danger {
  color: var(--danger-700);
  background-color: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: var(--border-radius-sm);
  padding: 8px 10px;
}

/* Hint text */
.hint-text {
  display: flex;
  align-items: center;
  gap: 6px;
  font-weight: 500;
}

.hint-text i {
  font-size: 1rem;
  opacity: 0.8;
}

/* Examples */
.hint-examples {
  margin-top: 6px;
}

.example-label {
  display: block;
  font-weight: 600;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--text-tertiary);
  margin-bottom: 4px;
}

.examples-list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.examples-list .badge {
  font-size: 0.75rem;
  padding: 4px 6px;
  border: 1px solid transparent;
  transition: all 0.2s ease;
}

.examples-list .badge:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

/* Validation rules */
.hint-rules {
  margin-top: 8px;
}

.rules-label {
  display: block;
  font-weight: 600;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--text-tertiary);
  margin-bottom: 6px;
}

.rules-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.rule-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 2px 0;
  font-size: 0.8rem;
}

.rule-item i {
  font-size: 0.8rem;
  opacity: 0.7;
}

/* Interactive demo */
.hint-interactive {
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px solid rgba(0, 0, 0, 0.1);
}

.demo-input-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.demo-input-group .form-label {
  margin-bottom: 4px;
  font-weight: 600;
}

.demo-input-group .input-group {
  display: flex;
  gap: 6px;
}

.demo-input-group .form-control {
  flex: 1;
}

.demo-input-group .btn {
  padding: 6px 8px;
  font-size: 0.75rem;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .field-hint {
    font-size: 0.8rem;
    padding: 6px 8px;
  }
  
  .examples-list {
    gap: 4px;
  }
  
  .examples-list .badge {
    font-size: 0.7rem;
    padding: 3px 5px;
  }
  
  .rule-item {
    font-size: 0.75rem;
  }
}

/* Dark theme support */
[data-theme="dark"] .field-hint {
  border-color: rgba(255, 255, 255, 0.2);
}

[data-theme="dark"] .variant-info {
  background-color: rgba(56, 189, 248, 0.15);
  border-color: rgba(56, 189, 248, 0.4);
  color: var(--info-300);
}

[data-theme="dark"] .variant-success {
  background-color: rgba(34, 197, 94, 0.15);
  border-color: rgba(34, 197, 94, 0.4);
  color: var(--success-300);
}

[data-theme="dark"] .variant-warning {
  background-color: rgba(251, 191, 36, 0.15);
  border-color: rgba(251, 191, 36, 0.4);
  color: var(--warning-300);
}

[data-theme="dark"] .variant-danger {
  background-color: rgba(239, 68, 68, 0.15);
  border-color: rgba(239, 68, 68, 0.4);
  color: var(--danger-300);
}

[data-theme="dark"] .example-label,
[data-theme="dark"] .rules-label {
  color: var(--text-tertiary);
}

[data-theme="dark"] .rule-item {
  color: var(--text-secondary);
}

[data-theme="dark"] .hint-interactive {
  border-top-color: rgba(255, 255, 255, 0.2);
}

/* High contrast theme support */
[data-theme="high-contrast"] .field-hint {
  border: 2px solid var(--border-primary);
  background-color: var(--bg-page);
  color: var(--text-primary);
  font-weight: 600;
}

[data-theme="high-contrast"] .variant-info {
  border-color: var(--info-600);
  color: var(--info-600);
}

[data-theme="high-contrast"] .variant-success {
  border-color: var(--success-600);
  color: var(--success-600);
}

[data-theme="high-contrast"] .variant-warning {
  border-color: var(--warning-600);
  color: var(--warning-600);
}

[data-theme="high-contrast"] .variant-danger {
  border-color: var(--danger-600);
  color: var(--danger-600);
}

[data-theme="high-contrast"] .example-label,
[data-theme="high-contrast"] .rules-label {
  color: var(--text-primary);
  font-weight: 700;
}

[data-theme="high-contrast"] .rule-item {
  color: var(--text-primary);
}

[data-theme="high-contrast"] .hint-interactive {
  border-top: 2px solid var(--border-primary);
}

/* Accessibility improvements */
.field-hint:focus-within {
  outline: 2px solid var(--primary-500);
  outline-offset: 2px;
}

/* Animation for attention */
.field-hint.has-interactive {
  animation: subtlePulse 3s ease-in-out infinite;
}

@keyframes subtlePulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.02); }
}

/* Print styles */
@media print {
  .field-hint {
    background-color: transparent !important;
    border: 1px solid #000;
    color: #000;
  }
  
  .examples-list .badge {
    background-color: #f8f9fa !important;
    color: #000 !important;
    border: 1px solid #000;
  }
}
</style>