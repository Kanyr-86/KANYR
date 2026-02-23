import { computed } from 'vue'
import { useThemeStore } from '../store/theme'

/**
 * useTheme - Composable for theme management
 * 
 * Provides reactive access to theme state with computed properties
 * and easy-to-use toggle functionality.
 * 
 * @returns {Object} Theme state and controls
 * @returns {ComputedRef<string>} returns.theme - Current theme ('light' or 'dark')
 * @returns {ComputedRef<boolean>} returns.isDark - True if dark theme is active
 * @returns {ComputedRef<boolean>} returns.isLight - True if light theme is active
 * @returns {Function} returns.toggleTheme - Toggle between themes
 * @returns {Function} returns.setTheme - Set specific theme
 * 
 * @example Basic usage
 * ```javascript
 * import { useTheme } from '@/composables/useTheme'
 * 
 * const { isDark, toggleTheme } = useTheme()
 * 
 * // Toggle theme
 * toggleTheme()
 * ```
 * 
 * @example In a component
 * ```vue
 * <template>
 *   <button @click="toggleTheme">
 *     {{ isDark ? 'Light Mode' : 'Dark Mode' }}
 *   </button>
 * </template>
 * 
 * <script setup>
 * import { useTheme } from '@/composables/useTheme'
 * 
 * const { isDark, toggleTheme } = useTheme()
 * </script>
 * ```
 */
export function useTheme() {
  const themeStore = useThemeStore()

  const theme = computed(() => themeStore.theme)
  const isDark = computed(() => themeStore.isDark)
  const isLight = computed(() => themeStore.isLight)

  function toggleTheme() {
    themeStore.toggleTheme()
  }

  function setTheme(newTheme) {
    themeStore.setTheme(newTheme)
  }

  function initializeTheme() {
    themeStore.initializeTheme()
  }

  return {
    theme,
    isDark,
    isLight,
    toggleTheme,
    setTheme,
    initializeTheme
  }
}

export default useTheme