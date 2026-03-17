import { ref, watch, computed, onUnmounted } from 'vue'
import { toast } from 'vue3-toastify'

/**
 * Auto-save composable for form data protection
 * Provides debounced auto-save functionality with visual feedback and error handling
 * 
 * @param {Object} formState - Reactive form state object
 * @param {Function} saveFunction - Function to save the form data
 * @param {Object} options - Configuration options
 * @returns {Object} Auto-save state and methods
 */
export function useAutoSave(formState, saveFunction, options = {}) {
  const {
    debounceTime = 2000,           // Debounce time in milliseconds
    enableLocalStorage = true,     // Enable local storage fallback
    enableNotifications = true,    // Show toast notifications
    localStorageKey = null,        // Custom localStorage key
    maxRetries = 3,               // Maximum retry attempts
    retryDelay = 1000             // Delay between retries
  } = options

  // State
  const isDirty = ref(false)
  const isSaving = ref(false)
  const lastSaved = ref(null)
  const lastError = ref(null)
  const retryCount = ref(0)
  const saveTimer = ref(null)

  // Computed state
  const saveStatus = computed(() => {
    if (isSaving.value) return 'saving'
    if (lastError.value) return 'error'
    if (isDirty.value) return 'unsaved'
    return 'saved'
  })

  const statusText = computed(() => {
    switch (saveStatus.value) {
      case 'saving': return 'Mentés folyamatban...'
      case 'saved': return 'Mentve'
      case 'unsaved': return 'Nincs mentve'
      case 'error': return 'Mentési hiba'
      default: return ''
    }
  })

  const statusIcon = computed(() => {
    switch (saveStatus.value) {
      case 'saving': return 'bi bi-arrow-clockwise'
      case 'saved': return 'bi bi-check-circle'
      case 'unsaved': return 'bi bi-circle'
      case 'error': return 'bi bi-exclamation-triangle'
      default: return ''
    }
  })

  const statusClass = computed(() => {
    switch (saveStatus.value) {
      case 'saving': return 'text-warning'
      case 'saved': return 'text-success'
      case 'unsaved': return 'text-muted'
      case 'error': return 'text-danger'
      default: return ''
    }
  })

  /**
   * Debounced save function with retry logic
   */
  const debouncedSave = async () => {
    if (isSaving.value) return

    isSaving.value = true
    lastError.value = null

    try {
      await saveFunction()
      isDirty.value = false
      lastSaved.value = new Date()
      retryCount.value = 0
      
      if (enableNotifications) {
        toast.success('Adatok automatikusan elmentve', {
          autoClose: 2000,
          position: toast.POSITION.BOTTOM_RIGHT
        })
      }

      // Clear local storage on successful save
      if (enableLocalStorage && localStorageKey) {
        localStorage.removeItem(localStorageKey)
      }
    } catch (error) {
      lastError.value = error
      retryCount.value++
      
      if (enableNotifications) {
        toast.error(`Mentési hiba: ${error.message || 'Ismeretlen hiba'}`, {
          autoClose: 5000,
          position: toast.POSITION.BOTTOM_RIGHT
        })
      }

      // Retry logic
      if (retryCount.value < maxRetries) {
        setTimeout(() => {
          debouncedSave()
        }, retryDelay * retryCount.value)
      }
    } finally {
      isSaving.value = false
    }
  }

  /**
   * Manual save function
   */
  const manualSave = async () => {
    if (isSaving.value) return

    isSaving.value = true
    lastError.value = null

    try {
      await saveFunction()
      isDirty.value = false
      lastSaved.value = new Date()
      retryCount.value = 0
      
      if (enableNotifications) {
        toast.success('Adatok elmentve', {
          autoClose: 3000,
          position: toast.POSITION.BOTTOM_RIGHT
        })
      }

      // Clear local storage on successful save
      if (enableLocalStorage && localStorageKey) {
        localStorage.removeItem(localStorageKey)
      }
    } catch (error) {
      lastError.value = error
      
      if (enableNotifications) {
        toast.error(`Mentési hiba: ${error.message || 'Ismeretlen hiba'}`, {
          autoClose: 5000,
          position: toast.POSITION.BOTTOM_RIGHT
        })
      }
    } finally {
      isSaving.value = false
    }
  }

  /**
   * Clear auto-save state
   */
  const clearState = () => {
    isDirty.value = false
    isSaving.value = false
    lastSaved.value = null
    lastError.value = null
    retryCount.value = 0
    
    if (saveTimer.value) {
      clearTimeout(saveTimer.value)
      saveTimer.value = null
    }
  }

  /**
   * Restore from local storage
   */
  const restoreFromStorage = () => {
    if (!enableLocalStorage || !localStorageKey) return null

    try {
      const stored = localStorage.getItem(localStorageKey)
      if (stored) {
        const data = JSON.parse(stored)
        // Check if data is recent (within last hour)
        if (data.timestamp && Date.now() - data.timestamp < 3600000) {
          return data.data
        } else {
          // Expired data, remove it
          localStorage.removeItem(localStorageKey)
        }
      }
    } catch (error) {
      console.warn('Failed to restore from localStorage:', error)
      localStorage.removeItem(localStorageKey)
    }

    return null
  }

  /**
   * Save to local storage immediately
   */
  const saveToStorage = () => {
    if (!enableLocalStorage || !localStorageKey) return

    try {
      const data = {
        data: JSON.parse(JSON.stringify(formState)),
        timestamp: Date.now()
      }
      localStorage.setItem(localStorageKey, JSON.stringify(data))
    } catch (error) {
      console.warn('Failed to save to localStorage:', error)
    }
  }

  /**
   * Handle form state changes
   */
  const handleFormChange = () => {
    isDirty.value = true
    lastError.value = null

    // Save to local storage immediately for offline protection
    saveToStorage()

    // Clear existing timer
    if (saveTimer.value) {
      clearTimeout(saveTimer.value)
    }

    // Set new timer for auto-save
    saveTimer.value = setTimeout(() => {
      debouncedSave()
    }, debounceTime)
  }

  // Watch for form state changes
  watch(formState, handleFormChange, { deep: true })

  // Handle page unload to save data
  const handleBeforeUnload = (event) => {
    if (isDirty.value && !isSaving.value) {
      event.preventDefault()
      event.returnValue = 'Vannak nem mentett változások. Biztosan el akarja hagyni az oldalt?'
      return event.returnValue
    }
  }

  // Add event listener for page unload
  window.addEventListener('beforeunload', handleBeforeUnload)

  // Cleanup on component unmount
  onUnmounted(() => {
    window.removeEventListener('beforeunload', handleBeforeUnload)
    if (saveTimer.value) {
      clearTimeout(saveTimer.value)
    }
  })

  return {
    // State
    isDirty,
    isSaving,
    lastSaved,
    lastError,
    retryCount,
    saveStatus,
    statusText,
    statusIcon,
    statusClass,

    // Methods
    manualSave,
    clearState,
    restoreFromStorage,
    saveToStorage,
    handleFormChange
  }
}

/**
 * Auto-save configuration for different form types
 */
export const AUTO_SAVE_CONFIGS = {
  // Short forms with simple data
  quick: {
    debounceTime: 1000,
    enableLocalStorage: true,
    enableNotifications: false
  },

  // Long forms with complex data
  detailed: {
    debounceTime: 3000,
    enableLocalStorage: true,
    enableNotifications: true
  },

  // Critical forms requiring immediate save
  critical: {
    debounceTime: 500,
    enableLocalStorage: true,
    enableNotifications: true,
    maxRetries: 5
  },

  // Offline-capable forms
  offline: {
    debounceTime: 2000,
    enableLocalStorage: true,
    enableNotifications: true,
    maxRetries: 10,
    retryDelay: 2000
  }
}