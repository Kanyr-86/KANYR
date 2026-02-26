import { defineStore } from 'pinia'

export const useThemeStore = defineStore('theme', {
  state: () => ({
    theme: localStorage.getItem('theme') || 'light'
  }),

  getters: {
    isDark: (state) => state.theme === 'dark',
    isLight: (state) => state.theme === 'light',
    isHighContrast: (state) => state.theme === 'high-contrast'
  },

  actions: {
    /**
     * Set the theme
     * @param {'light' | 'dark' | 'high-contrast'} theme - Theme to set
     */
    setTheme(theme) {
      // Validate theme value
      const validThemes = ['light', 'dark', 'high-contrast']
      if (!validThemes.includes(theme)) {
        console.warn(`Invalid theme: ${theme}. Using 'light' as fallback.`)
        theme = 'light'
      }
      
      this.theme = theme
      localStorage.setItem('theme', theme)
      this.applyTheme()
    },

    /**
     * Toggle between light and dark theme (high contrast stays as is)
     */
    toggleTheme() {
      if (this.theme === 'high-contrast') {
        // If currently in high contrast, switch to light
        this.setTheme('light')
      } else {
        // Toggle between light and dark
        const newTheme = this.theme === 'light' ? 'dark' : 'light'
        this.setTheme(newTheme)
      }
    },

    /**
     * Apply theme to document
     */
    applyTheme() {
      // Remove all theme attributes first
      document.documentElement.removeAttribute('data-theme')
      document.body.classList.remove('dark')
      
      // Apply current theme
      if (this.theme === 'dark') {
        document.documentElement.setAttribute('data-theme', 'dark')
        document.body.classList.add('dark')
      } else if (this.theme === 'high-contrast') {
        document.documentElement.setAttribute('data-theme', 'high-contrast')
        document.body.classList.add('high-contrast')
      } else {
        // Light theme - no special attributes needed
        document.body.classList.remove('dark', 'high-contrast')
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
      } else {
        this.theme = 'light' // Default to light theme
      }
      this.applyTheme()
    }
  }
})
