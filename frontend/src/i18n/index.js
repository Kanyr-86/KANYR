/**
 * Internationalization (i18n) module for KANYR application
 * 
 * Provides centralized access to all localized messages.
 * Currently supports Hungarian (hu) only, but structured for future expansion.
 * 
 * @module i18n
 */

import MESSAGES from './messages.js'

/**
 * Current locale - defaults to Hungarian
 * Can be changed dynamically for future i18n support
 */
let currentLocale = 'hu'

/**
 * Available locales
 */
export const AVAILABLE_LOCALES = {
  hu: 'Magyar',
  // en: 'English', // Future expansion
}

/**
 * Get the current locale
 * @returns {string} Current locale code
 */
export function getCurrentLocale() {
  return currentLocale
}

/**
 * Set the current locale
 * @param {string} locale - Locale code to set
 */
export function setLocale(locale) {
  if (AVAILABLE_LOCALES[locale]) {
    currentLocale = locale
  } else {
    console.warn(`Locale '${locale}' is not available. Falling back to '${currentLocale}'.`)
  }
}

/**
 * Get a message by its path (e.g., 'ERROR.NETWORK_ERROR')
 * Supports dynamic values for message functions
 * 
 * @param {string} path - Dot-notation path to the message
 * @param {...any} args - Arguments for dynamic message functions
 * @returns {string} The localized message
 * 
 * @example
 * import { t } from '@/i18n'
 * 
 * // Simple message
 * t('ERROR.NETWORK_ERROR') // 'Hálózati hiba...'
 * 
 * // Message with dynamic value
 * t('VALIDATION.MIN_LENGTH', 5) // 'Legalább 5 karakter szükséges'
 */
export function t(path, ...args) {
  const keys = path.split('.')
  let value = MESSAGES

  for (const key of keys) {
    if (value && typeof value === 'object' && key in value) {
      value = value[key]
    } else {
      console.warn(`Message not found: ${path}`)
      return path
    }
  }

  // If the message is a function, call it with the provided arguments
  if (typeof value === 'function') {
    return value(...args)
  }

  return value
}

/**
 * Get an error message, falling back to a generic error if not found
 * @param {string} path - Path to the error message
 * @param {...any} args - Arguments for dynamic messages
 * @returns {string} Error message
 */
export function getErrorMessage(path, ...args) {
  const message = t(`ERROR.${path}`, ...args)
  if (message === `ERROR.${path}`) {
    return t('ERROR.UNKNOWN_ERROR')
  }
  return message
}

/**
 * Get a success message
 * @param {string} path - Path to the success message
 * @param {...any} args - Arguments for dynamic messages
 * @returns {string} Success message
 */
export function getSuccessMessage(path, ...args) {
  const message = t(`SUCCESS.${path}`, ...args)
  if (message === `SUCCESS.${path}`) {
    return 'Sikeres művelet'
  }
  return message
}

/**
 * Get a validation message
 * @param {string} path - Path to the validation message
 * @param {...any} args - Arguments for dynamic messages
 * @returns {string} Validation message
 */
export function getValidationMessage(path, ...args) {
  const message = t(`VALIDATION.${path}`, ...args)
  if (message === `VALIDATION.${path}`) {
    return 'Érvénytelen érték'
  }
  return message
}

/**
 * Get a UI label
 * @param {string} path - Path to the UI label
 * @returns {string} UI label
 */
export function getUILabel(path) {
  const label = t(`UI.${path}`)
  if (label === `UI.${path}`) {
    return path
  }
  return label
}

// Re-export all message constants for direct access
export { MESSAGES }
export * from './messages.js'

// Default export for convenience
export default {
  t,
  getErrorMessage,
  getSuccessMessage,
  getValidationMessage,
  getUILabel,
  getCurrentLocale,
  setLocale,
  AVAILABLE_LOCALES,
  MESSAGES,
}
