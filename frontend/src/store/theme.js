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
     * Téma beállítása
     * @param {'light' | 'dark'} theme - A beállítandó téma
     */
    setTheme(theme) {
      // Téma érték érvényesítése
      const validThemes = ['light', 'dark']
      if (!validThemes.includes(theme)) {
        console.warn(`Invalid theme: ${theme}. Using 'light' as fallback.`)
        theme = 'light'
      }
      
      this.theme = theme
      localStorage.setItem('theme', theme)
      this.applyTheme()
    },

    /**
     * Váltás világos és sötét téma között
     */
    toggleTheme() {
      const newTheme = this.theme === 'light' ? 'dark' : 'light'
      this.setTheme(newTheme)
    },

    /**
     * Téma alkalmazása a dokumentumra
     */
    applyTheme() {
      // Először minden téma attribútum eltávolítása
      document.documentElement.removeAttribute('data-theme')
      document.body.classList.remove('dark')
      
      // Aktuális téma alkalmazása
      if (this.theme === 'dark') {
        document.documentElement.setAttribute('data-theme', 'dark')
        document.body.classList.add('dark')
      } else {
        // Világos téma - nincs szükség különleges attribútumokra
        document.body.classList.remove('dark')
      }
    },

    /**
     * Téma inicializálása az alkalmazás betöltésekor
     */
    initializeTheme() {
      // Először a localStorage ellenőrzése, majd a rendszer preferencia
      const savedTheme = localStorage.getItem('theme')
      if (savedTheme) {
        this.theme = savedTheme
      } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        this.theme = 'dark'
      } else {
        this.theme = 'light' // Alapértelmezett világos téma
      }
      this.applyTheme()
    }
  }
})
