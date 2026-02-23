<template>
  <div class="toast-container">
    <TransitionGroup name="toast" tag="div" class="toast-list">
      <div
        v-for="toast in toasts"
        :key="toast.id"
        :class="['toast-item', 'alert', getAlertClass(toast.type)]"
        role="alert"
      >
        <div class="toast-content">
          <span class="toast-icon" v-html="getIcon(toast.type)"></span>
          <span class="toast-message">{{ toast.message }}</span>
        </div>
        <button
          type="button"
          class="btn-close"
          :class="getCloseButtonClass(toast.type)"
          @click="removeToast(toast.id)"
          aria-label="Close"
        ></button>
      </div>
    </TransitionGroup>
  </div>
</template>

<script>
import { defineComponent, computed } from 'vue'
import { useToastStore } from '../store/toast'

export default defineComponent({
  name: 'ToastContainer',
  setup() {
    const toastStore = useToastStore()
    
    const toasts = computed(() => toastStore.toasts)
    
    const removeToast = (id) => {
      toastStore.removeToast(id)
    }

    /**
     * Get Bootstrap 5 alert class based on toast type
     */
    const getAlertClass = (type) => {
      const classes = {
        success: 'alert-success',
        error: 'alert-danger',
        warning: 'alert-warning',
        info: 'alert-info'
      }
      return classes[type] || 'alert-info'
    }

    /**
     * Get icon SVG based on toast type
     */
    const getIcon = (type) => {
      const icons = {
        success: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16"><path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zm-3.97-3.03a.75.75 0 0 0-1.08.022L7.477 9.417 5.384 7.323a.75.75 0 0 0-1.06 1.06L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-.01-1.05z"/></svg>',
        error: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16"><path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zM5.354 4.646a.5.5 0 1 0-.708.708L7.293 8l-2.647 2.646a.5.5 0 0 0 .708.708L8 8.707l2.646 2.647a.5.5 0 0 0 .708-.708L8.707 8l2.647-2.646a.5.5 0 0 0-.708-.708L8 7.293 5.354 4.646z"/></svg>',
        warning: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16"><path d="M8.982 1.566a1.13 1.13 0 0 0-1.96 0L.165 13.233c-.457.778.091 1.767.98 1.767h13.713c.889 0 1.438-.99.98-1.767L8.982 1.566zM8 5c.535 0 .954.462.9.995l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 5.995A.905.905 0 0 1 8 5zm.002 6a1 1 0 1 1 0 2 1 1 0 0 1 0-2z"/></svg>',
        info: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16"><path d="M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16zm.93-9.412-1 4.705c-.07.34.029.533.304.533.194 0 .487-.07.686-.246l-.088.416c-.287.346-.92.598-1.465.598-.703 0-1.002-.422-.808-1.319l.738-3.468c.064-.293.006-.399-.287-.47l-.451-.081.082-.381 2.29-.287zM8 5.5a1 1 0 1 1 0-2 1 1 0 0 1 0 2z"/></svg>'
      }
      return icons[type] || icons.info
    }

    /**
     * Get close button class based on toast type for better visibility
     */
    const getCloseButtonClass = (type) => {
      // Bootstrap 5 btn-close works well on all alert types
      // Add custom class for styling if needed
      return ''
    }

    return {
      toasts,
      removeToast,
      getAlertClass,
      getIcon,
      getCloseButtonClass
    }
  }
})
</script>

<style scoped>
.toast-container {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 9999;
  max-width: 400px;
  width: calc(100% - 40px);
}

.toast-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.toast-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  margin-bottom: 0;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  border: none;
  min-width: 280px;
}

.toast-content {
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 1;
}

.toast-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.toast-message {
  font-weight: 500;
  word-break: break-word;
}

.btn-close {
  flex-shrink: 0;
  margin-left: 12px;
  opacity: 0.7;
  transition: opacity 0.2s ease;
}

.btn-close:hover {
  opacity: 1;
}

/* Transition animations */
.toast-enter-active {
  animation: slideIn 0.3s ease-out;
}

.toast-leave-active {
  animation: slideOut 0.3s ease-in;
}

.toast-move {
  transition: transform 0.3s ease;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateX(100%);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes slideOut {
  from {
    opacity: 1;
    transform: translateX(0);
  }
  to {
    opacity: 0;
    transform: translateX(100%);
  }
}

/* Responsive adjustments */
@media (max-width: 480px) {
  .toast-container {
    top: 10px;
    right: 10px;
    left: 10px;
    max-width: none;
    width: auto;
  }

  .toast-item {
    min-width: auto;
  }
}
</style>