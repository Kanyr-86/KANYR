import { ref, computed, watch, onBeforeUnmount } from 'vue'
import { onBeforeRouteLeave } from 'vue-router'

/**
 * useDirtyForm - A composable for tracking form dirty state and handling unsaved changes
 * 
 * Provides functionality to:
 * - Track if form has unsaved changes (dirty state)
 * - Reset form to initial values
 * - Warn users when navigating away with unsaved changes
 * - Mark form as clean after successful save
 * 
 * @param {Object} formRef - Reactive form object (ref or reactive)
 * @param {Object} options - Configuration options
 * @param {boolean} options.enableNavigationGuard - Enable onBeforeRouteLeave guard (default: true)
 * @param {string} options.confirmMessage - Custom confirmation message
 * @param {Function} options.onDirtyLeave - Callback when user confirms leaving dirty form
 * @param {Function} options.onStay - Callback when user decides to stay
 * @returns {Object} Dirty form state and methods
 * 
 * @example Basic usage with ref
 * ```javascript
 * const form = ref({ name: '', email: '' })
 * const { isDirty, resetForm, markAsClean } = useDirtyForm(form)
 * ```
 * 
 * @example With navigation guard and custom message
 * ```javascript
 * const form = ref({ name: '', email: '' })
 * const { isDirty, resetForm, markAsClean } = useDirtyForm(form, {
 *   enableNavigationGuard: true,
 *   confirmMessage: 'Mentetlen változtatások vannak. Biztosan elhagyja az oldalt?'
 * })
 * 
 * // After successful save
 * const handleSubmit = async () => {
 *   await api.post('/users', form.value)
 *   markAsClean() // Reset dirty state
 * }
 * ```
 * 
 * @example With reactive object
 * ```javascript
 * const form = reactive({ name: '', email: '' })
 * const { isDirty, resetForm, markAsClean } = useDirtyForm(form)
 * 
 * // Reset form to initial values
 * const handleCancel = () => {
 *   resetForm()
 * }
 * ```
 */
export function useDirtyForm(formRef, options = {}) {
  const {
    enableNavigationGuard = true,
    confirmMessage = 'Mentetlen változtatások vannak. Biztosan elhagyja az oldalt?',
    onDirtyLeave = null,
    onStay = null
  } = options

  // Store initial values
  const initialValues = ref(null)
  
  // Track if form has been modified since last clean state
  const isDirty = computed(() => {
    if (!initialValues.value) return false
    return !deepEqual(getFormValue(), initialValues.value)
  })

  /**
   * Get current form value (handles both ref and reactive)
   */
  function getFormValue() {
    return formRef.value !== undefined ? formRef.value : formRef
  }

  /**
   * Deep clone an object
   */
  function deepClone(obj) {
    if (obj === null || typeof obj !== 'object') return obj
    if (obj instanceof Date) return new Date(obj.getTime())
    if (Array.isArray(obj)) return obj.map(item => deepClone(item))
    if (typeof obj === 'object') {
      const cloned = {}
      for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
          cloned[key] = deepClone(obj[key])
        }
      }
      return cloned
    }
    return obj
  }

  /**
   * Deep equality check
   */
  function deepEqual(obj1, obj2) {
    if (obj1 === obj2) return true
    if (obj1 === null || obj2 === null) return obj1 === obj2
    if (typeof obj1 !== typeof obj2) return false
    if (typeof obj1 !== 'object') return obj1 === obj2
    
    if (Array.isArray(obj1) && Array.isArray(obj2)) {
      if (obj1.length !== obj2.length) return false
      return obj1.every((item, index) => deepEqual(item, obj2[index]))
    }
    
    if (Array.isArray(obj1) !== Array.isArray(obj2)) return false
    
    const keys1 = Object.keys(obj1)
    const keys2 = Object.keys(obj2)
    
    if (keys1.length !== keys2.length) return false
    
    return keys1.every(key => {
      if (!Object.prototype.hasOwnProperty.call(obj2, key)) return false
      return deepEqual(obj1[key], obj2[key])
    })
  }

  /**
   * Capture current form values as initial values
   */
  function captureInitialValues() {
    initialValues.value = deepClone(getFormValue())
  }

  /**
   * Reset form to initial values
   */
  function resetForm() {
    if (!initialValues.value) return
    
    const current = getFormValue()
    const initial = initialValues.value
    
    // Reset each property
    for (const key in initial) {
      if (Object.prototype.hasOwnProperty.call(initial, key)) {
        current[key] = deepClone(initial[key])
      }
    }
    
    // Remove any extra properties not in initial
    for (const key in current) {
      if (Object.prototype.hasOwnProperty.call(current, key) && !(key in initial)) {
        delete current[key]
      }
    }
  }

  /**
   * Mark form as clean (update initial values to current)
   * Call this after successful form submission
   */
  function markAsClean() {
    captureInitialValues()
  }

  /**
   * Check if form is dirty and show confirmation
   * @returns {boolean} true if should proceed, false if should stay
   */
  function confirmLeave() {
    if (!isDirty.value) return true
    return window.confirm(confirmMessage)
  }

  // Capture initial values on mount
  captureInitialValues()

  // Watch for external form changes and recapture initial values if needed
  const unwatch = watch(
    () => getFormValue(),
    (newVal, oldVal) => {
      // If initial values are null (first mount), capture them
      if (!initialValues.value && newVal) {
        captureInitialValues()
      }
    },
    { immediate: true, deep: true }
  )

  // Navigation guard
  let removeNavigationGuard = null
  
  if (enableNavigationGuard) {
    onBeforeRouteLeave((to, from, next) => {
      if (isDirty.value) {
        const shouldLeave = window.confirm(confirmMessage)
        if (shouldLeave) {
          if (onDirtyLeave) onDirtyLeave()
          next()
        } else {
          if (onStay) onStay()
          next(false)
        }
      } else {
        next()
      }
    })
  }

  // Cleanup on unmount
  onBeforeUnmount(() => {
    unwatch()
    if (removeNavigationGuard) {
      removeNavigationGuard()
    }
  })

  return {
    isDirty,
    resetForm,
    markAsClean,
    confirmLeave,
    captureInitialValues
  }
}

/**
 * useDirtyFormArray - Extension for handling arrays of forms (e.g., in tables)
 * 
 * @param {Array} formsRef - Array of reactive form objects
 * @param {Object} options - Same options as useDirtyForm
 * @returns {Object} Dirty state for array of forms
 */
export function useDirtyFormArray(formsRef, options = {}) {
  const dirtyForms = ref(new Set())

  const isDirty = computed(() => dirtyForms.value.size > 0)

  const markFormDirty = (formId) => {
    dirtyForms.value.add(formId)
  }

  const markFormClean = (formId) => {
    dirtyForms.value.delete(formId)
  }

  const markAllClean = () => {
    dirtyForms.value.clear()
  }

  const confirmLeave = () => {
    if (!isDirty.value) return true
    const message = options.confirmMessage || 'Mentetlen változtatások vannak. Biztosan elhagyja az oldalt?'
    return window.confirm(message)
  }

  if (options.enableNavigationGuard !== false) {
    onBeforeRouteLeave((to, from, next) => {
      if (isDirty.value) {
        const shouldLeave = confirmLeave()
        next(shouldLeave)
      } else {
        next()
      }
    })
  }

  return {
    isDirty,
    dirtyForms,
    markFormDirty,
    markFormClean,
    markAllClean,
    confirmLeave
  }
}

export default useDirtyForm
