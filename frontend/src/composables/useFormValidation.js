import { reactive, computed } from 'vue'

/**
 * Hungarian error messages for validation
 */
const ERROR_MESSAGES = {
  required: 'A mező kitöltése kötelező',
  minLength: (min) => `Legalább ${min} karakter szükséges`,
  maxLength: (max) => `Legfeljebb ${max} karakter engedélyezett`,
  min: (min) => `Az érték nem lehet kisebb mint ${min}`,
  max: (max) => `Az érték nem lehet nagyobb mint ${max}`,
  email: 'Érvénytelen email cím',
  pattern: 'Érvénytelen formátum'
}

/**
 * Built-in validators
 */
const validators = {
  /**
   * Required field validator
   * @param {*} value - Field value
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
   * Minimum length validator
   * @param {string} value - Field value
   * @param {number} minLength - Minimum length
   * @returns {boolean}
   */
  minLength: (value, minLength) => {
    if (!value || typeof value !== 'string') return false
    return value.length >= minLength
  },

  /**
   * Maximum length validator
   * @param {string} value - Field value
   * @param {number} maxLength - Maximum length
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
 * useFormValidation - A composable for form validation
 * 
 * Provides reactive validation state and methods for validating form fields.
 * 
 * @param {Object} rules - Validation rules object
 * @returns {Object} Validation state and methods
 * @returns {Object} returns.errors - Reactive errors object
 * @returns {Function} returns.validate - Validate all fields
 * @returns {Function} returns.validateField - Validate single field
 * @returns {Function} returns.clearErrors - Clear all errors
 * @returns {Computed<boolean>} returns.isValid - True if form is valid
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
 * const { errors, validate, isValid } = useFormValidation(rules)
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
* // Validate single field on blur
* errors.email = validateField('email', form.email)
* ```
 * 
 * @example With custom pattern validation
 * ```javascript
* const rules = {
*   phone: { 
*     required: true, 
*     pattern: /^[0-9+\-\s]+$/,
*     patternMessage: 'Érvénytelen telefonszám'
*   }
* }
 * ```
 */
export function useFormValidation(rules) {
  const errors = reactive({})
  const rulesRef = rules

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
      
      const error = validateFieldWithRules(field, value, fieldRules)
      if (error) {
        errors[field] = error
        isFormValid = false
      }
    }

    return isFormValid
  }

  /**
   * Validate a single field
   * @param {string} field - Field name
   * @param {*} value - Field value
   * @returns {string|null} Error message or null
   */
  function validateField(field, value) {
    const fieldRules = rulesRef[field]
    if (!fieldRules) return null
    
    return validateFieldWithRules(field, value, fieldRules)
  }

  /**
   * Validate field with specific rules
   * @param {string} field - Field name
   * @param {*} value - Field value
   * @param {Object} fieldRules - Rules for this field
   * @returns {string|null} Error message or null
   */
  function validateFieldWithRules(field, value, fieldRules) {
    // Check required
    if (fieldRules.required && !validators.required(value)) {
      return ERROR_MESSAGES.required
    }

    // Check minLength
    if (fieldRules.minLength !== undefined) {
      if (!validators.minLength(value, fieldRules.minLength)) {
        return ERROR_MESSAGES.minLength(fieldRules.minLength)
      }
    }

    // Check maxLength
    if (fieldRules.maxLength !== undefined) {
      if (!validators.maxLength(value, fieldRules.maxLength)) {
        return ERROR_MESSAGES.maxLength(fieldRules.maxLength)
      }
    }

    // Check min (numeric)
    if (fieldRules.min !== undefined) {
      if (!validators.min(value, fieldRules.min)) {
        return ERROR_MESSAGES.min(fieldRules.min)
      }
    }

    // Check max (numeric)
    if (fieldRules.max !== undefined) {
      if (!validators.max(value, fieldRules.max)) {
        return ERROR_MESSAGES.max(fieldRules.max)
      }
    }

    // Check email
    if (fieldRules.email && !validators.email(value)) {
      return ERROR_MESSAGES.email
    }

    // Check pattern
    if (fieldRules.pattern !== undefined) {
      if (!validators.pattern(value, fieldRules.pattern)) {
        return fieldRules.patternMessage || ERROR_MESSAGES.pattern
      }
    }

    return null
  }

  /**
   * Clear all errors
   */
  function clearErrors() {
    Object.keys(errors).forEach(key => delete errors[key])
  }

  return {
    errors,
    validate,
    validateField,
    clearErrors,
    isValid
  }
}

export default useFormValidation