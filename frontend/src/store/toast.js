import { defineStore } from 'pinia'

export const useToastStore = defineStore('toast', {
  state: () => ({
    toasts: []
  }),

  getters: {
    // Toast lekérdezése azonosító alapján
    getToastById: (state) => (id) => {
      return state.toasts.find(toast => toast.id === id)
    }
  },

  actions: {
    /**
     * Új toast értesítés hozzáadása
     * @param {string} message - A megjelenítendő üzenet
     * @param {string} type - A toast típusa: 'success', 'error', 'warning', 'info'
     * @param {number} duration - Időtartam milliszekundumban az automatikus eltávolítás előtt
     * @returns {number} A létrehozott toast azonosítója
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

      // Toast automatikus eltávolítása az időtartam után
      if (duration > 0) {
        setTimeout(() => {
          this.removeToast(id)
        }, duration)
      }

      return id
    },

    /**
     * Toast eltávolítása azonosító alapján
     * @param {number} id - Az eltávolítandó toast azonosítója
     */
    removeToast(id) {
      const index = this.toasts.findIndex(toast => toast.id === id)
      if (index !== -1) {
        this.toasts.splice(index, 1)
      }
    },

    /**
     * Összes toast törlése
     */
    clearAll() {
      this.toasts = []
    },

    /**
     * Toast típus érvényesítése és normalizálása
     * @param {string} type - Az érvényesítendő típus
     * @returns {string} Érvényesített típus
     */
    validateType(type) {
      const validTypes = ['success', 'error', 'warning', 'info']
      return validTypes.includes(type) ? type : 'info'
    },

    // Kényelmi metódusok különböző toast típusokhoz
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