<template>
  <div class="auto-save-indicator" :class="indicatorClasses">
    <div class="indicator-content">
      <i :class="statusIcon" class="me-2"></i>
      <span class="indicator-text">{{ statusText }}</span>
      <span v-if="lastSaved && saveStatus === 'saved'" class="last-saved text-muted ms-2">
        ({{ formatTimeAgo(lastSaved) }})
      </span>
    </div>
    
    <!-- Retry button when there's an error -->
    <div v-if="saveStatus === 'error'" class="indicator-actions">
      <button 
        class="btn btn-sm btn-outline-danger"
        @click="retrySave"
        :disabled="isSaving"
        title="Újra próbálkozás"
      >
        <i class="bi bi-arrow-clockwise me-1"></i>Újra
      </button>
    </div>
    
    <!-- Manual save button for critical forms -->
    <div v-if="showManualSave" class="indicator-actions">
      <button 
        class="btn btn-sm btn-outline-primary"
        @click="manualSave"
        :disabled="isSaving || !isDirty"
        title="Kézi mentés"
      >
        <i class="bi bi-save me-1"></i>Mentés
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { formatDistanceToNow } from 'date-fns'
import { hu } from 'date-fns/locale'

const props = defineProps({
  // Auto-save composable state
  isDirty: {
    type: Boolean,
    required: true
  },
  isSaving: {
    type: Boolean,
    required: true
  },
  lastSaved: {
    type: Date,
    default: null
  },
  lastError: {
    type: [Error, Object, null],
    default: null
  },
  retryCount: {
    type: Number,
    default: 0
  },
  saveStatus: {
    type: String,
    required: true,
    validator: (value) => ['saving', 'saved', 'unsaved', 'error'].includes(value)
  },
  statusText: {
    type: String,
    required: true
  },
  statusIcon: {
    type: String,
    required: true
  },
  statusClass: {
    type: String,
    required: true
  },
  
  // Configuration
  showManualSave: {
    type: Boolean,
    default: false
  },
  showRetry: {
    type: Boolean,
    default: true
  },
  position: {
    type: String,
    default: 'top-right', // 'top-right', 'top-left', 'bottom-right', 'bottom-left', 'inline'
    validator: (value) => ['top-right', 'top-left', 'bottom-right', 'bottom-left', 'inline'].includes(value)
  },
  
  // Methods from composable
  manualSave: {
    type: Function,
    required: true
  },
  retrySave: {
    type: Function,
    required: true
  }
})

// Computed classes based on position and status
const indicatorClasses = computed(() => {
  return [
    `position-${props.position}`,
    props.statusClass,
    {
      'is-saving': props.isSaving,
      'is-dirty': props.isDirty,
      'has-error': props.saveStatus === 'error'
    }
  ]
})

// Format time ago in Hungarian
const formatTimeAgo = (date) => {
  if (!date) return ''
  try {
    return formatDistanceToNow(date, { locale: hu, addSuffix: true })
  } catch (error) {
    return 'most'
  }
}
</script>

<style scoped>
.auto-save-indicator {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-radius: var(--border-radius-md);
  font-size: 0.875rem;
  font-weight: 500;
  transition: all 0.3s ease;
  backdrop-filter: blur(4px);
  border: 1px solid transparent;
}

/* Position variants */
.position-top-right {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 1000;
}

.position-top-left {
  position: fixed;
  top: 20px;
  left: 20px;
  z-index: 1000;
}

.position-bottom-right {
  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: 1000;
}

.position-bottom-left {
  position: fixed;
  bottom: 20px;
  left: 20px;
  z-index: 1000;
}

.position-inline {
  position: relative;
  display: inline-flex;
}

/* Status variants */
.auto-save-indicator.text-success {
  background-color: rgba(34, 197, 94, 0.1);
  border-color: rgba(34, 197, 94, 0.3);
  color: var(--success-700);
}

.auto-save-indicator.text-warning {
  background-color: rgba(251, 191, 36, 0.1);
  border-color: rgba(251, 191, 36, 0.3);
  color: var(--warning-700);
}

.auto-save-indicator.text-danger {
  background-color: rgba(239, 68, 68, 0.1);
  border-color: rgba(239, 68, 68, 0.3);
  color: var(--danger-700);
}

.auto-save-indicator.text-muted {
  background-color: rgba(107, 114, 128, 0.1);
  border-color: rgba(107, 114, 128, 0.3);
  color: var(--text-secondary);
}

/* State modifiers */
.auto-save-indicator.is-saving {
  animation: pulse 1s infinite;
}

.auto-save-indicator.is-dirty {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.auto-save-indicator.has-error {
  animation: shake 0.5s ease-in-out;
}

/* Content layout */
.indicator-content {
  display: flex;
  align-items: center;
  gap: 8px;
}

.indicator-text {
  font-weight: 600;
}

.last-saved {
  font-size: 0.75rem;
  font-weight: 400;
}

.indicator-actions {
  display: flex;
  gap: 6px;
}

/* Icons */
.bi {
  font-size: 1rem;
  transition: transform 0.3s ease;
}

.auto-save-indicator.is-saving .bi {
  animation: spin 1s linear infinite;
}

/* Animations */
@keyframes pulse {
  0% { transform: scale(1); }
  50% { transform: scale(1.02); }
  100% { transform: scale(1); }
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-2px); }
  75% { transform: translateX(2px); }
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .position-top-right,
  .position-top-left,
  .position-bottom-right,
  .position-bottom-left {
    top: 10px;
    right: 10px;
    left: 10px;
    bottom: 10px;
    font-size: 0.8rem;
    padding: 6px 8px;
  }
  
  .indicator-actions {
    flex-direction: column;
    gap: 4px;
  }
  
  .btn-sm {
    padding: 4px 6px;
    font-size: 0.75rem;
  }
}

/* Dark theme support */
[data-theme="dark"] .auto-save-indicator {
  backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

[data-theme="dark"] .auto-save-indicator.text-success {
  background-color: rgba(34, 197, 94, 0.15);
  border-color: rgba(34, 197, 94, 0.4);
}

[data-theme="dark"] .auto-save-indicator.text-warning {
  background-color: rgba(251, 191, 36, 0.15);
  border-color: rgba(251, 191, 36, 0.4);
}

[data-theme="dark"] .auto-save-indicator.text-danger {
  background-color: rgba(239, 68, 68, 0.15);
  border-color: rgba(239, 68, 68, 0.4);
}

[data-theme="dark"] .auto-save-indicator.text-muted {
  background-color: rgba(107, 114, 128, 0.15);
  border-color: rgba(107, 114, 128, 0.4);
}

/* High contrast theme support */
[data-theme="high-contrast"] .auto-save-indicator {
  border: 2px solid var(--border-primary);
  background-color: var(--bg-page);
  color: var(--text-primary);
  font-weight: 700;
}

[data-theme="high-contrast"] .auto-save-indicator.text-success {
  border-color: var(--success-600);
  color: var(--success-600);
}

[data-theme="high-contrast"] .auto-save-indicator.text-warning {
  border-color: var(--warning-600);
  color: var(--warning-600);
}

[data-theme="high-contrast"] .auto-save-indicator.text-danger {
  border-color: var(--danger-600);
  color: var(--danger-600);
}

[data-theme="high-contrast"] .auto-save-indicator.text-muted {
  border-color: var(--border-primary);
  color: var(--text-primary);
}

/* Accessibility improvements */
.auto-save-indicator:focus-within {
  outline: 2px solid var(--primary-500);
  outline-offset: 2px;
}

/* Screen reader support */
.sr-only {
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
</style>