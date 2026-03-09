import { reactive, computed } from 'vue'
import { VALIDATION_MESSAGES } from '@/i18n'

/**
 * Validációs hibaüzenetek - központosított lokalizáció használatával
 * A függvények a teljesítmény érdekében memoizáltak
 */
const ERROR_MESSAGES = {
  required: VALIDATION_MESSAGES.REQUIRED,
  minLength: VALIDATION_MESSAGES.MIN_LENGTH,
  maxLength: VALIDATION_MESSAGES.MAX_LENGTH,
  min: VALIDATION_MESSAGES.MIN_VALUE,
  max: VALIDATION_MESSAGES.MAX_VALUE,
  email: VALIDATION_MESSAGES.EMAIL_INVALID,
  pattern: VALIDATION_MESSAGES.PATTERN_INVALID
}

/**
 * Beépített validátorok memoizálással
 */
const validators = {
  /**
   * Kötelező mező validátor
   * @param {*} value - Mező értéke
   * @returns {boolean}
   */
  required: (value) => {
    if (value === null || value === undefined || value === '') {
      return false
    }
    if (typeof value === 'string') {
      return value.trim().length > 0
    }
    return true
  },

  /**
   * Minimális hossz validátor
   * @param {string} value - Mező értéke
   * @param {number} minLength - Minimális hossz
   * @returns {boolean}
   */
  minLength: (value, minLength) => {
    if (!value || typeof value !== 'string') return false
    return value.length >= minLength
  },

  /**
   * Maximális hossz validátor
   * @param {string} value - Mező értéke
   * @param {number} maxLength - Maximális hossz
   * @returns {boolean}
   */
  maxLength: (value, maxLength) => {
    if (!value || typeof value !== 'string') return true
    return value.length <= maxLength
  },

  /**
   * Minimum value validator (for numbers)
   * @param {number} value - Field value
   * @param {number} min - Minimum value
   * @returns {boolean}
   */
  min: (value, min) => {
    if (value === null || value === undefined || value === '') return false
    const num = Number(value)
    if (isNaN(num)) return false
    return num >= min
  },

  /**
   * Maximum value validator (for numbers)
   * @param {number} value - Field value
   * @param {number} max - Maximum value
   * @returns {boolean}
   */
  max: (value, max) => {
    if (value === null || value === undefined || value === '') return true
    const num = Number(value)
    if (isNaN(num)) return false
    return num <= max
  },

  /**
   * Email validator
   * @param {string} value - Email address
   * @returns {boolean}
   */
  email: (value) => {
    if (!value || typeof value !== 'string') return false
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(value.trim())
  },

  /**
   * Pattern validator
   * @param {string} value - Field value
   * @param {RegExp} pattern - Regex pattern
   * @returns {boolean}
   */
  pattern: (value, pattern) => {
    if (!value || typeof value !== 'string') return false
    return pattern.test(value)
  }
}

/**
 * Debounced validation function to prevent excessive validation calls
 */
let validationTimeout = null

/**
 * useFormValidation - A composable for form validation with performance optimizations
 * 
 * Provides reactive validation state and methods for validating form fields.
 * Includes debouncing for better performance and memoization for validation rules.
 * 
 * @param {Object} rules - Validation rules object
 * @param {Object} options - Optional configuration
 * @param {number} options.debounceDelay - Debounce delay in milliseconds (default: 300)
 * @returns {Object} Validation state and methods
 * @returns {Object} returns.errors - Reactive errors object
 * @returns {Function} returns.validate - Validate all fields
 * @returns {Function} returns.validateField - Validate single field (debounced)
 * @returns {Function} returns.clearErrors - Clear all errors
 * @returns {Computed<boolean>} returns.isValid - True if form is valid
 * @returns {Function} returns.validateFieldImmediate - Validate single field immediately
 * 
 * @example Student form validation
 * ```javascript
 * import { useFormValidation } from '@/composables/useFormValidation'
 * 
 * const rules = {
 *   nev: { required: true, minLength: 2, maxLength: 100 },
 *   email: { required: true, email: true },
*   kor: { required: true, min: 18, max: 100 }
* }
 * 
 * const { errors, validate, isValid, validateFieldImmediate } = useFormValidation(rules)
* 
* const form = reactive({
 *   nev: '',
*   email: '',
*   kor: null
* })
* 
 * // Validate all fields
* if (validate(form)) {
*   // Submit form
* }
* 
* // Validate single field immediately (for real-time validation)
* validateFieldImmediate('email', form.email)
* ```
 * 
 * @example With custom pattern validation and debouncing
 * ```javascript
* const rules = {
*   phone: { 
*     required: true, 
*     pattern: /^[0-9+\-\s]+$/,
*     patternMessage: 'Érvénytelen telefonszám'
*   }
* }
* 
* const { validateField } = useFormValidation(rules, { debounceDelay: 500 })
* ```
 */
export function useFormValidation(rules, options = {}) {
  const errors = reactive({})
  const rulesRef = rules
  const { debounceDelay = 300 } = options

  // Memoized validation results to prevent unnecessary re-validation
  const validationCache = new Map()

  /**
   * Computed property - true if no errors
   */
  const isValid = computed(() => {
    return Object.keys(errors).every(key => !errors[key])
  })

  /**
   * Validate all fields in a form object
   * @param {Object} formData - Form data to validate
   * @returns {boolean} True if valid
   */
  function validate(formData) {
    let isFormValid = true
    clearErrors()

    for (const field of Object.keys(rulesRef)) {
      const fieldRules = rulesRef[field]
      const value = formData[field]
      
      const error = validateFieldWithRules(field, value, fieldRules, true)
      if (error) {
        errors[field] = error
        isFormValid = false
      }
    }

    return isFormValid
  }

  /**
   * Validate a single field with debouncing
   * @param {string} field - Field name
   * @param {*} value - Field value
   */
  function validateField(field, value) {
    const fieldRules = rulesRef[field]
    if (!fieldRules) return

    if (validationTimeout) {
      clearTimeout(validationTimeout)
    }

    validationTimeout = setTimeout(() => {
      const error = validateFieldWithRules(field, value, fieldRules)
      errors[field] = error || ''
    }, debounceDelay)
  }

  /**
   * Validate a single field immediately (without debouncing)
   * @param {string} field - Field name
   * @param {*} value - Field value
   * @returns {string|null} Error message or null
   */
  function validateFieldImmediate(field, value) {
    const fieldRules = rulesRef[field]
    if (!fieldRules) return null

    const error = validateFieldWithRules(field, value, fieldRules, true)
    errors[field] = error || ''
    return error
  }

  /**
   * Validate field with specific rules
   * @param {string} field - Field name
   * @param {*} value - Field value
   * @param {Object} fieldRules - Rules for this field
   * @param {boolean} forceValidation - Whether to force validation (skip cache)
   * @returns {string|null} Error message or null
   */
  function validateFieldWithRules(field, value, fieldRules, forceValidation = false) {
    // Create cache key for memoization
    const cacheKey = `${field}:${JSON.stringify(value)}:${JSON.stringify(fieldRules)}`
    
    // Return cached result if available and not forcing validation
    if (!forceValidation && validationCache.has(cacheKey)) {
      return validationCache.get(cacheKey)
    }

    let error = null

    // Check required
    if (fieldRules.required && !validators.required(value)) {
      error = ERROR_MESSAGES.required
    }
    // Check minLength
    else if (fieldRules.minLength !== undefined && !validators.minLength(value, fieldRules.minLength)) {
      error = ERROR_MESSAGES.minLength(fieldRules.minLength)
    }
    // Check maxLength
    else if (fieldRules.maxLength !== undefined && !validators.maxLength(value, fieldRules.maxLength)) {
      error = ERROR_MESSAGES.maxLength(fieldRules.maxLength)
    }
    // Check min (numeric)
    else if (fieldRules.min !== undefined && !validators.min(value, fieldRules.min)) {
      error = ERROR_MESSAGES.min(fieldRules.min)
    }
    // Check max (numeric)
    else if (fieldRules.max !== undefined && !validators.max(value, fieldRules.max)) {
      error = ERROR_MESSAGES.max(fieldRules.max)
    }
    // Check email
    else if (fieldRules.email && !validators.email(value)) {
      error = ERROR_MESSAGES.email
    }
    // Check pattern
    else if (fieldRules.pattern !== undefined && !validators.pattern(value, fieldRules.pattern)) {
      error = fieldRules.patternMessage || ERROR_MESSAGES.pattern
    }

    // Cache the result
    validationCache.set(cacheKey, error)
    return error
  }

  /**
   * Clear all errors and reset cache
   */
  function clearErrors() {
    Object.keys(errors).forEach(key => delete errors[key])
    validationCache.clear()
  }

  /**
   * Clear validation cache for a specific field
   * @param {string} field - Field name
   */
  function clearFieldCache(field) {
    // Clear cache entries for this field
    for (const key of validationCache.keys()) {
      if (key.startsWith(`${field}:`)) {
        validationCache.delete(key)
      }
    }
  }

  /**
   * Clear validation cache for all fields
   */
  function clearCache() {
    validationCache.clear()
  }

  return {
    errors,
    validate,
    validateField,
    validateFieldImmediate,
    clearErrors,
    clearFieldCache,
    clearCache,
    isValid
  }
}

export default useFormValidation
