import { defineStore } from 'pinia'

export const useToastStore = defineStore('toast', {
  state: () => ({
    toasts: []
  }),

  getters: {
    // Get toast by ID
    getToastById: (state) => (id) => {
      return state.toasts.find(toast => toast.id === id)
    }
  },

  actions: {
    /**
     * Add a new toast notification
     * @param {string} message - The message to display
     * @param {string} type - Type of toast: 'success', 'error', 'warning', 'info'
     * @param {number} duration - Duration in milliseconds before auto-remove
     * @returns {number} The ID of the created toast
     */
    addToast(message, type = 'info', duration = 3000) {
      const id = Date.now() + Math.random()
      
      const toast = {
        id,
        message,
        type: this.validateType(type),
        duration
      }

      this.toasts.push(toast)

      // Auto-remove toast after duration
      if (duration > 0) {
        setTimeout(() => {
          this.removeToast(id)
        }, duration)
      }

      return id
    },

    /**
     * Remove a toast by ID
     * @param {number} id - The ID of the toast to remove
     */
    removeToast(id) {
      const index = this.toasts.findIndex(toast => toast.id === id)
      if (index !== -1) {
        this.toasts.splice(index, 1)
      }
    },

    /**
     * Clear all toasts
     */
    clearAll() {
      this.toasts = []
    },

    /**
     * Validate and normalize toast type
     * @param {string} type - The type to validate
     * @returns {string} Validated type
     */
    validateType(type) {
      const validTypes = ['success', 'error', 'warning', 'info']
      return validTypes.includes(type) ? type : 'info'
    },

    // Convenience methods for different toast types
    success(message, duration = 3000) {
      return this.addToast(message, 'success', duration)
    },

    error(message, duration = 3000) {
      return this.addToast(message, 'error', duration)
    },

    warning(message, duration = 3000) {
      return this.addToast(message, 'warning', duration)
    },

    info(message, duration = 3000) {
      return this.addToast(message, 'info', duration)
    }
  }
})