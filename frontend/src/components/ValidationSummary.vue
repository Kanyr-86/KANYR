<template>
  <div class="validation-summary" :class="summaryClasses">
    <!-- Summary header -->
    <div class="summary-header">
      <div class="header-content">
        <i :class="headerIcon" class="me-2"></i>
        <span class="summary-title">{{ summaryTitle }}</span>
        <span class="summary-count" v-if="errorCount > 0">
          ({{ errorCount }} {{ errorCount === 1 ? 'hiba' : 'hiba' }})
        </span>
      </div>
      
      <!-- Actions -->
      <div class="summary-actions">
        <button 
          v-if="errorCount > 0"
          class="btn btn-outline-danger btn-sm"
          @click="clearAll"
          title="Összes hiba törlése"
        >
          <i class="bi bi-x-circle me-1"></i>Törlés
        </button>
        <button 
          v-if="errorCount > 0"
          class="btn btn-outline-primary btn-sm"
          @click="scrollToFirstError"
          title="Ugrás az első hibához"
        >
          <i class="bi bi-arrow-down me-1"></i>Első hiba
        </button>
      </div>
    </div>

    <!-- Progress bar -->
    <div v-if="showProgress" class="summary-progress">
      <div class="progress" style="height: 8px;">
        <div 
          class="progress-bar" 
          :class="progressBarClass"
          :style="{ width: progress + '%' }"
          :aria-valuenow="progress"
          aria-valuemin="0"
          aria-valuemax="100"
        ></div>
      </div>
<small style="color: var(--text-muted)">{{ progress }}% érvényes</small>
    </div>

    <!-- Error list -->
    <div v-if="errorCount > 0" class="summary-errors">
      <div 
        v-for="(error, index) in errors" 
        :key="index"
        class="error-item"
        :class="errorItemClasses(error)"
        @click="scrollToField(error.field)"
      >
        <div class="error-content">
          <i :class="errorIcon(error)" class="me-2"></i>
          <div class="error-text">
            <strong>{{ error.label }}</strong>
            <div class="error-message">{{ error.error }}</div>
          </div>
        </div>
        <div class="error-actions">
          <button 
            class="btn btn-sm btn-outline-secondary"
            @click.stop="clearField(error.field)"
            title="Hiba törlése"
          >
            <i class="bi bi-x"></i>
          </button>
        </div>
      </div>
    </div>

    <!-- Success message -->
    <div v-else-if="isValid && showSuccess" class="summary-success">
      <i class="bi bi-check-circle text-success me-2"></i>
      <span>Minden mező érvényes!</span>
    </div>

    <!-- Empty state -->
    <div v-else-if="!isValid && errorCount === 0" class="summary-empty">
      <i class="bi bi-info-circle text-info me-2"></i>
      <span>Kezdje el kitölteni az űrlapot</span>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  // Validation state
  isValid: {
    type: Boolean,
    required: true
  },
  hasErrors: {
    type: Boolean,
    required: true
  },
  errorCount: {
    type: Number,
    required: true
  },
  progress: {
    type: Number,
    default: 0
  },
  errors: {
    type: Array,
    default: () => []
  },
  
  // Configuration
  showProgress: {
    type: Boolean,
    default: true
  },
  showSuccess: {
    type: Boolean,
    default: true
  },
  showActions: {
    type: Boolean,
    default: true
  },
  variant: {
    type: String,
    default: 'default', // 'default', 'minimal', 'compact'
    validator: (value) => ['default', 'minimal', 'compact'].includes(value)
  },
  position: {
    type: String,
    default: 'top', // 'top', 'bottom', 'side'
    validator: (value) => ['top', 'bottom', 'side'].includes(value)
  }
})

const emit = defineEmits(['clearField', 'clearAll', 'scrollToField'])

// Computed classes
const summaryClasses = computed(() => {
  return [
    `variant-${props.variant}`,
    `position-${props.position}`,
    {
      'has-errors': props.hasErrors,
      'is-valid': props.isValid,
      'is-invalid': !props.isValid
    }
  ]
})

const summaryTitle = computed(() => {
  if (props.isValid) return 'Űrlap érvényes'
  if (props.errorCount === 0) return 'Űrlap ellenőrzése'
  return `${props.errorCount} hiba van az űrlapon`
})

const headerIcon = computed(() => {
  if (props.isValid) return 'bi bi-check-circle text-success'
  if (props.hasErrors) return 'bi bi-exclamation-triangle text-danger'
  return 'bi bi-info-circle text-info'
})

const progressBarClass = computed(() => {
  if (props.progress === 100) return 'bg-success'
  if (props.progress >= 80) return 'bg-warning'
  return 'bg-danger'
})

// Error item classes
const errorItemClasses = (error) => {
  return {
    'error-severity-high': error.state === 'error',
    'error-severity-medium': error.state === 'warning',
    'error-severity-low': error.state === 'info'
  }
}

const errorIcon = (error) => {
  switch (error.state) {
    case 'error': return 'bi bi-exclamation-triangle text-danger'
    case 'warning': return 'bi bi-exclamation-triangle text-warning'
    case 'info': return 'bi bi-info-circle text-info'
    default: return 'bi bi-exclamation-triangle text-danger'
  }
}

// Methods
const clearField = (field) => {
  emit('clearField', field)
}

const clearAll = () => {
  emit('clearAll')
}

const scrollToField = (field) => {
  emit('scrollToField', field)
}

const scrollToFirstError = () => {
  if (props.errors.length > 0) {
    scrollToField(props.errors[0].field)
  }
}
</script>

<style scoped>
.validation-summary {
  border-radius: var(--border-radius-md);
  transition: all 0.3s ease;
  border: 1px solid transparent;
}

/* Variant styles */
.variant-default {
  background-color: var(--bg-card);
  border-color: var(--border-light);
  padding: 16px;
}

.variant-minimal {
  background-color: transparent;
  border: none;
  padding: 8px 0;
}

.variant-compact {
  background-color: var(--bg-card);
  border: 1px solid var(--border-light);
  padding: 12px;
  font-size: 0.875rem;
}

/* Position styles */
.position-top {
  margin-bottom: 16px;
}

.position-bottom {
  margin-top: 16px;
}

.position-side {
  margin-left: 16px;
  min-width: 300px;
  max-width: 400px;
}

/* Header */
.summary-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.header-content {
  display: flex;
  align-items: center;
  gap: 8px;
}

.summary-title {
  font-weight: 600;
  font-size: 1rem;
}

.summary-count {
  font-size: 0.875rem;
  color: var(--text-secondary);
}

.summary-actions {
  display: flex;
  gap: 8px;
}

/* Progress */
.summary-progress {
  margin-bottom: 12px;
  display: flex;
  align-items: center;
  gap: 12px;
}

.summary-progress .progress {
  flex: 1;
}

/* Errors */
.summary-errors {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.error-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 12px;
  border-radius: var(--border-radius-sm);
  border: 1px solid var(--border-light);
  background-color: var(--bg-page);
  cursor: pointer;
  transition: all 0.2s ease;
}

.error-item:hover {
  background-color: var(--bg-hover);
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.error-item.error-severity-high {
  border-color: var(--danger-200);
  background-color: var(--danger-50);
}

.error-item.error-severity-medium {
  border-color: var(--warning-200);
  background-color: var(--warning-50);
}

.error-item.error-severity-low {
  border-color: var(--info-200);
  background-color: var(--info-50);
}

.error-content {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  flex: 1;
}

.error-text {
  flex: 1;
}

.error-text strong {
  display: block;
  font-size: 0.9rem;
  color: var(--text-primary);
}

.error-message {
  font-size: 0.8rem;
  color: var(--text-secondary);
  margin-top: 2px;
}

.error-actions {
  display: flex;
  gap: 6px;
}

/* Success state */
.summary-success {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px;
  background-color: var(--success-50);
  border: 1px solid var(--success-200);
  border-radius: var(--border-radius-sm);
  color: var(--success-700);
  font-weight: 500;
}

/* Empty state */
.summary-empty {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px;
  background-color: var(--info-50);
  border: 1px solid var(--info-200);
  border-radius: var(--border-radius-sm);
  color: var(--info-700);
  font-weight: 500;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .variant-default {
    padding: 12px;
  }
  
  .variant-compact {
    padding: 8px;
    font-size: 0.8rem;
  }
  
  .position-side {
    margin-left: 0;
    margin-top: 16px;
    min-width: auto;
    max-width: none;
  }
  
  .summary-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
  
  .summary-actions {
    align-self: flex-end;
  }
  
  .error-item {
    padding: 8px 10px;
  }
  
  .error-text strong {
    font-size: 0.85rem;
  }
  
  .error-message {
    font-size: 0.75rem;
  }
}

/* Dark theme support */
[data-theme="dark"] .validation-summary {
  background-color: var(--bg-card);
  border-color: var(--border-dark);
}

[data-theme="dark"] .error-item {
  background-color: var(--bg-card);
  border-color: var(--border-dark);
  color: var(--text-primary);
}

[data-theme="dark"] .error-item:hover {
  background-color: var(--bg-hover);
}

[data-theme="dark"] .summary-success {
  background-color: var(--success-900);
  border-color: var(--success-700);
  color: var(--success-100);
}

[data-theme="dark"] .summary-empty {
  background-color: var(--info-900);
  border-color: var(--info-700);
  color: var(--info-100);
}

/* High contrast theme support */
[data-theme="high-contrast"] .validation-summary {
  border: 2px solid var(--border-primary);
  background-color: var(--bg-page);
  color: var(--text-primary);
}

[data-theme="high-contrast"] .error-item {
  border: 2px solid var(--border-primary);
  background-color: var(--bg-page);
  color: var(--text-primary);
}

[data-theme="high-contrast"] .error-item:hover {
  background-color: var(--bg-hover);
  outline: 2px solid var(--primary-500);
}

[data-theme="high-contrast"] .summary-success {
  border: 2px solid var(--success-600);
  color: var(--success-600);
  font-weight: 700;
}

[data-theme="high-contrast"] .summary-empty {
  border: 2px solid var(--info-600);
  color: var(--info-600);
  font-weight: 700;
}

/* Accessibility improvements */
.validation-summary:focus-within {
  outline: 2px solid var(--primary-500);
  outline-offset: 2px;
}

.error-item:focus {
  outline: 2px solid var(--primary-500);
  outline-offset: 2px;
}

/* Animation for state changes */
.validation-summary.is-valid {
  animation: slideInSuccess 0.5s ease-out;
}

.validation-summary.is-invalid {
  animation: shake 0.5s ease-in-out;
}

@keyframes slideInSuccess {
  0% { transform: translateX(-20px); opacity: 0; }
  100% { transform: translateX(0); opacity: 1; }
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-2px); }
  75% { transform: translateX(2px); }
}

/* Print styles */
@media print {
  .validation-summary {
    border: 1px solid #000;
    background-color: #fff;
    color: #000;
  }
  
  .error-item {
    border: 1px solid #000;
    background-color: #fff;
    color: #000;
  }
  
  .summary-success {
    border: 1px solid #000;
    background-color: #e8f5e8;
    color: #000;
  }
  
  .summary-empty {
    border: 1px solid #000;
    background-color: #e8f0ff;
    color: #000;
  }
}
</style>