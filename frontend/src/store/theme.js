import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

export const useThemeStore = defineStore('theme', () => {
  // Alapértelmezett téma: 'light' vagy 'dark'
  const theme = ref('light')

  // Téma betöltése localStorage-ból
  const loadTheme = () => {
    const savedTheme = localStorage.getItem('kanyr-theme')
    if (savedTheme && ['light', 'dark'].includes(savedTheme)) {
      theme.value = savedTheme
    } else {
      // Rendszer beállítás ellenőrzése
      if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        theme.value = 'dark'
      }
    }
    applyTheme()
  }

  // Téma alkalmazása a dokumentumra
  const applyTheme = () => {
    const html = document.documentElement
    if (theme.value === 'dark') {
      html.setAttribute('data-theme', 'dark')
    } else {
      html.removeAttribute('data-theme')
    }
    
    // Bootstrap navbar/cookie sötét mód támogatása
    if (theme.value === 'dark') {
      document.body.classList.add('dark-mode')
    } else {
      document.body.classList.remove('dark-mode')
    }
  }

  // Téma váltása
  const toggleTheme = () => {
    theme.value = theme.value === 'light' ? 'dark' : 'light'
    localStorage.setItem('kanyr-theme', theme.value)
    applyTheme()
  }

  // Téma beállítása közvetlenül
  const setTheme = (newTheme) => {
    if (['light', 'dark'].includes(newTheme)) {
      theme.value = newTheme
      localStorage.setItem('kanyr-theme', newTheme)
      applyTheme()
    }
  }

  // Figyeljük a téma változását
  watch(theme, () => {
    applyTheme()
  })

  // Rendszer téma változás figyelése
  if (window.matchMedia) {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
      if (!localStorage.getItem('kanyr-theme')) {
        theme.value = e.matches ? 'dark' : 'light'
        applyTheme()
      }
    })
  }

  return {
    theme,
    loadTheme,
    toggleTheme,
    setTheme
  }
})