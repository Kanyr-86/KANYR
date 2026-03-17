import { ref, computed, watch } from 'vue'
import { toast } from 'vue3-toastify'

/**
 * Inline validation composable for form fields
 * Provides real-time validation with debouncing and smart error messages
 * 
 * @param {Object} validationRules - Object with field validation functions
 * @param {Object} options - Configuration options
 * @returns {Object} Validation state and methods
 */
export function useInlineValidation(validationRules = {}, options = {}) {
  const {
    debounceTime = 500,           // Debounce time for validation
    enableRealTime = true,        // Enable real-time validation
    enableToast = false,          // Show toast notifications
    enableSummary = true,         // Enable validation summary
    showSuccess = false,          // Show success states
    maxErrors = 5                 // Maximum errors to show
  } = options

  // State
  const errors = ref({})
  const isValidating = ref({})
  const validationStates = ref({})
  const touched = ref({})
  const validationSummary = ref([])

  // Computed state
  const isValid = computed(() => {
    return Object.values(errors.value).every(error => !error)
  })

  const hasErrors = computed(() => {
    return Object.values(errors.value).some(error => error)
  })

  const errorCount = computed(() => {
    return Object.values(errors.value).filter(error => error).length
  })

  const validationProgress = computed(() => {
    const totalFields = Object.keys(validationRules).length
    const validFields = Object.values(errors.value).filter(error => !error).length
    return totalFields > 0 ? Math.round((validFields / totalFields) * 100) : 0
  })

  /**
   * Validate a single field
   */
  const validateField = async (field, value, options = {}) => {
    const { immediate = false, showSuccess = false } = options
    
    if (!validationRules[field]) {
      return null
    }

    // Mark field as touched
    touched.value[field] = true

    // Skip validation if not enabled or field is empty and not required
    if (!enableRealTime && !immediate) {
      return null
    }

    // Clear previous validation state
    isValidating.value[field] = true
    validationStates.value[field] = 'validating'

    try {
      const error = await validationRules[field](value)
      errors.value[field] = error
      
      if (error) {
        validationStates.value[field] = 'error'
        if (enableToast) {
          toast.error(`${getFieldLabel(field)}: ${error}`, {
            autoClose: 3000,
            position: toast.POSITION.BOTTOM_RIGHT
          })
        }
      } else {
        validationStates.value[field] = showSuccess ? 'success' : 'valid'
        if (showSuccess && enableToast) {
          toast.success(`${getFieldLabel(field)} érvényes`, {
            autoClose: 2000,
            position: toast.POSITION.BOTTOM_RIGHT
          })
        }
      }

      // Update validation summary
      if (enableSummary) {
        updateValidationSummary()
      }

      return error
    } catch (error) {
      const errorMessage = error.message || 'Validációs hiba'
      errors.value[field] = errorMessage
      validationStates.value[field] = 'error'
      
      if (enableToast) {
        toast.error(`${getFieldLabel(field)}: ${errorMessage}`, {
          autoClose: 5000,
          position: toast.POSITION.BOTTOM_RIGHT
        })
      }

      return errorMessage
    } finally {
      isValidating.value[field] = false
    }
  }

  /**
   * Validate all fields
   */
  const validateAll = async (formData) => {
    const fieldPromises = Object.keys(validationRules).map(field => 
      validateField(field, formData[field], { immediate: true })
    )
    
    const results = await Promise.all(fieldPromises)
    return results.every(result => !result)
  }

  /**
   * Clear validation for a specific field
   */
  const clearField = (field) => {
    errors.value[field] = null
    validationStates.value[field] = 'idle'
    touched.value[field] = false
    isValidating.value[field] = false
    
    if (enableSummary) {
      updateValidationSummary()
    }
  }

  /**
   * Clear all validation
   */
  const clearAll = () => {
    Object.keys(validationRules).forEach(field => {
      errors.value[field] = null
      validationStates.value[field] = 'idle'
      touched.value[field] = false
      isValidating.value[field] = false
    })
    
    validationSummary.value = []
  }

  /**
   * Get field validation state
   */
  const getFieldState = (field) => {
    return {
      error: errors.value[field],
      isValidating: isValidating.value[field],
      state: validationStates.value[field],
      isTouched: touched.value[field],
      isValid: !errors.value[field] && validationStates.value[field] === 'valid'
    }
  }

  /**
   * Get field CSS classes for styling
   */
  const getFieldClasses = (field) => {
    const state = getFieldState(field)
    return {
      'is-invalid': state.error,
      'is-valid': state.isValid && showSuccess,
      'is-validating': state.isValidating,
      'is-touched': state.isTouched
    }
  }

  /**
   * Get field validation message
   */
  const getFieldMessage = (field) => {
    const state = getFieldState(field)
    if (state.isValidating) return 'Ellenőrzés...'
    if (state.error) return state.error
    if (state.isValid && showSuccess) return 'Érvényes'
    return ''
  }

  /**
   * Update validation summary
   */
  const updateValidationSummary = () => {
    const summary = []
    
    Object.keys(validationRules).forEach(field => {
      const error = errors.value[field]
      if (error) {
        summary.push({
          field,
          label: getFieldLabel(field),
          error,
          state: validationStates.value[field]
        })
      }
    })

    // Sort by severity and limit
    validationSummary.value = summary
      .sort((a, b) => {
        if (a.state === 'error' && b.state !== 'error') return -1
        if (a.state !== 'error' && b.state === 'error') return 1
        return a.label.localeCompare(b.label)
      })
      .slice(0, maxErrors)
  }

  /**
   * Get field label for user-friendly messages
   */
  const getFieldLabel = (field) => {
    const labels = {
      'nev': 'Név',
      'email': 'Email cím',
      'telefonszam': 'Telefonszám',
      'szuletesi_datum': 'Születési dátum',
      'nem': 'Nem',
      'szemelyi_igazolvany_szam': 'Személyi igazolvány szám',
      'taj_szam': 'TAJ szám',
      'diakigazolvany_szam': 'Diákigazolvány szám',
      'kapcsolat_tipusa': 'Kapcsolat típusa',
      'szoba_szama': 'Szoba száma',
      'emelet': 'Emelet',
      'kapacitas': 'Kapacitás',
      'foglaltsag': 'Foglaltság'
    }
    return labels[field] || field
  }

  /**
   * Create debounced validation function
   */
  const createDebouncedValidator = (field) => {
    let timeoutId = null
    
    return (value) => {
      if (timeoutId) {
        clearTimeout(timeoutId)
      }
      
      timeoutId = setTimeout(() => {
        validateField(field, value)
      }, debounceTime)
    }
  }

  /**
   * Watch for form data changes and validate
   */
  const watchForm = (formData) => {
    Object.keys(validationRules).forEach(field => {
      watch(() => formData[field], (newValue) => {
        if (enableRealTime) {
          validateField(field, newValue)
        }
      }, { immediate: false })
    })
  }

  /**
   * Create validation summary component props
   */
  const getSummaryProps = () => {
    return {
      isValid: isValid.value,
      hasErrors: hasErrors.value,
      errorCount: errorCount.value,
      progress: validationProgress.value,
      errors: validationSummary.value
    }
  }

  return {
    // State
    errors,
    isValidating,
    validationStates,
    touched,
    validationSummary,
    isValid,
    hasErrors,
    errorCount,
    validationProgress,

    // Methods
    validateField,
    validateAll,
    clearField,
    clearAll,
    getFieldState,
    getFieldClasses,
    getFieldMessage,
    updateValidationSummary,
    createDebouncedValidator,
    watchForm,
    getSummaryProps,

    // Utilities
    getFieldLabel
  }
}

/**
 * Common validation rules for different field types
 */
export const VALIDATION_RULES = {
  // Email validation
  email: (value) => {
    if (!value || value.trim() === '') return 'Az email cím megadása kötelező'
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(value.trim())) return 'Érvénytelen email formátum'
    return null
  },

  // Hungarian phone number validation
  phone: (value) => {
    if (!value || value.trim() === '') return 'A telefonszám megadása kötelező'
    const normalized = value.replace(/\s/g, '')
    const phoneRegex = /^(\+36|06)[1-9][0-9]{7,8}$/
    if (!phoneRegex.test(normalized)) {
      return 'Érvénytelen telefonszám (pl. +36201234567 vagy 06201234567)'
    }
    return null
  },

  // Name validation
  name: (value) => {
    if (!value || value.trim() === '') return 'A név megadása kötelező'
    if (value.trim().length < 2) return 'A névnek legalább 2 karakterből kell állnia'
    if (value.trim().length > 100) return 'A név maximum 100 karakter lehet'
    const nameRegex = /^[\p{L}\s\-'.]+$/u
    if (!nameRegex.test(value.trim())) {
      return 'A név csak betűket, szóközt és kötőjelet tartalmazhat'
    }
    return null
  },

  // Date validation
  date: (value) => {
    if (!value) return 'A dátum megadása kötelező'
    const date = new Date(value)
    const now = new Date()
    if (isNaN(date.getTime())) return 'Érvénytelen dátum formátum'
    if (date > now) return 'A dátum nem lehet a jövőben'
    const age = now.getFullYear() - date.getFullYear()
    if (age < 15) return 'A személynek legalább 15 évesnek kell lennie'
    if (age > 120) return 'Érvénytelen születési dátum'
    return null
  },

  // Gender validation
  gender: (value) => {
    if (!value || value.trim() === '') return 'A nem megadása kötelező'
    if (!['férfi', 'nő'].includes(value)) return 'Érvénytelen nem érték'
    return null
  },

  // ID card number validation (6 digits + 2 letters)
  idCard: (value) => {
    if (!value || value.trim() === '') return 'A személyi igazolvány szám megadása kötelező'
    const normalized = value.trim().toUpperCase()
    const idRegex = /^[0-9]{6}[A-Z]{2}$/
    if (!idRegex.test(normalized)) {
      return 'Érvénytelen formátum (6 számjegy + 2 nagybetű, pl: 123456AA)'
    }
    return null
  },

  // TAJ number validation (9 digits)
  taj: (value) => {
    if (!value || value.trim() === '') return 'A TAJ szám megadása kötelező'
    const normalized = value.replace(/\s/g, '')
    const tajRegex = /^[0-9]{9}$/
    if (!tajRegex.test(normalized)) {
      return 'A TAJ szám pontosan 9 számjegyből áll'
    }
    
    // TAJ checksum validation
    const digits = normalized.split('').map(Number)
    const weights = [3, 7, 3, 7, 3, 7, 3, 7]
    let sum = 0
    for (let i = 0; i < 8; i++) {
      sum += digits[i] * weights[i]
    }
    const checksum = sum % 10
    if (checksum !== digits[8]) {
      return 'Érvénytelen TAJ szám (hibás ellenőrző számjegy)'
    }
    return null
  },

  // Student ID validation (8 digits)
  studentId: (value) => {
    if (!value || value.trim() === '') return 'A diákigazolvány szám megadása kötelező'
    const normalized = value.replace(/\s/g, '')
    const studentIdRegex = /^[0-9]{8}$/
    if (!studentIdRegex.test(normalized)) {
      return 'A diákigazolvány szám pontosan 8 számjegyből áll'
    }
    return null
  },

  // Room number validation
  roomNumber: (value) => {
    if (!value || value.trim() === '') return 'A szoba számának megadása kötelező'
    if (value.length > 10) return 'A szoba száma maximum 10 karakter lehet'
    return null
  },

  // Capacity validation
  capacity: (value) => {
    if (!value) return 'A kapacitás megadása kötelező'
    const num = parseInt(value, 10)
    if (isNaN(num)) return 'A kapacitásnak számnak kell lennie'
    if (num < 1) return 'A kapacitásnak legalább 1-nek kell lennie'
    if (num > 100) return 'A kapacitás maximum 100 lehet'
    return null
  },

  // Required field validation
  required: (value) => {
    if (!value || (typeof value === 'string' && value.trim() === '')) {
      return 'Ez a mező kötelező'
    }
    return null
  },

  // Minimum length validation
  minLength: (min) => (value) => {
    if (!value || value.length < min) {
      return `Minimum ${min} karakter szükséges`
    }
    return null
  },

  // Maximum length validation
  maxLength: (max) => (value) => {
    if (value && value.length > max) {
      return `Maximum ${max} karakter lehetséges`
    }
    return null
  },

  // Custom regex validation
  pattern: (regex, message) => (value) => {
    if (value && !regex.test(value)) {
      return message || 'Érvénytelen formátum'
    }
    return null
  }
}

/**
 * Validation configuration presets for common form types
 */
export const VALIDATION_PRESETS = {
  // Student form validation
  student: {
    nev: [VALIDATION_RULES.required, VALIDATION_RULES.name],
    email: [VALIDATION_RULES.required, VALIDATION_RULES.email],
    telefonszam: [VALIDATION_RULES.required, VALIDATION_RULES.phone],
    szuletesi_datum: [VALIDATION_RULES.required, VALIDATION_RULES.date],
    nem: [VALIDATION_RULES.required, VALIDATION_RULES.gender],
    szemelyi_igazolvany_szam: [VALIDATION_RULES.required, VALIDATION_RULES.idCard],
    taj_szam: [VALIDATION_RULES.required, VALIDATION_RULES.taj],
    diakigazolvany_szam: [VALIDATION_RULES.required, VALIDATION_RULES.studentId],
    kapcsolat_tipusa: [VALIDATION_RULES.required]
  },

  // Room form validation
  room: {
    szoba_szama: [VALIDATION_RULES.required, VALIDATION_RULES.roomNumber],
    emelet: [VALIDATION_RULES.required, VALIDATION_RULES.maxLength(2)],
    kapacitas: [VALIDATION_RULES.required, VALIDATION_RULES.capacity],
    foglaltsag: [VALIDATION_RULES.required]
  },

  // Parent form validation
  parent: {
    nev: [VALIDATION_RULES.required, VALIDATION_RULES.name],
    email: [VALIDATION_RULES.email],
    telefonszam: [VALIDATION_RULES.phone],
    kapcsolat_tipusa: [VALIDATION_RULES.required]
  }
}

/**
 * Create validation function from rules array
 */
export function createValidationFunction(rules) {
  return async (value) => {
    for (const rule of rules) {
      const error = await rule(value)
      if (error) {
        return error
      }
    }
    return null
  }
}