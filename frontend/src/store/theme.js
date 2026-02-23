import { defineStore } from 'pinia'

export const useThemeStore = defineStore('theme', {
  state: () => ({
    theme: localStorage.getItem('theme') || 'light'
  }),

  getters: {
    isDark: (state) => state.theme === 'dark',
    isLight: (state) => state.theme === 'light'
  },

  actions: {
    /**
     * Set the theme
     * @param {'light' | 'dark'} theme - Theme to set
     */
    setTheme(theme) {
      this.theme = theme
      localStorage.setItem('theme', theme)
      this.applyTheme()
    },

    /**
     * Toggle between light and dark theme
     */
    toggleTheme() {
      const newTheme = this.theme === 'light' ? 'dark' : 'light'
      this.setTheme(newTheme)
    },

    /**
     * Apply theme to document
     */
    applyTheme() {
      if (this.theme === 'dark') {
        document.documentElement.setAttribute('data-theme', 'dark')
        document.body.classList.add('dark')
      } else {
        document.documentElement.removeAttribute('data-theme')
        document.body.classList.remove('dark')
      }
    },

    /**
     * Initialize theme on app load
     */
    initializeTheme() {
      // Check localStorage first, then system preference
      const savedTheme = localStorage.getItem('theme')
      if (savedTheme) {
        this.theme = savedTheme
      } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        this.theme = 'dark'
      }
      this.applyTheme()
    }
  }
})