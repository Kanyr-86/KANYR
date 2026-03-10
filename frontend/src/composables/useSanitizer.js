/**
 * XSS Sanitization Composable
 * 
 * Provides utilities to sanitize user-generated content and prevent XSS attacks.
 * While Vue's {{ }} syntax escapes HTML by default, this composable provides
 * additional protection and explicit sanitization for sensitive use cases.
 */

/**
 * HTML escape special characters to prevent XSS
 * @param {string} text - Text to escape
 * @returns {string} Escaped text safe for HTML insertion
 */
export const escapeHtml = (text) => {
  if (text == null || typeof text !== 'string') {
    return ''
  }
  
  const div = document.createElement('div')
  div.textContent = text
  return div.innerHTML
}

/**
 * Sanitize a string for use in HTML attributes
 * @param {string} text - Text to sanitize
 * @returns {string} Sanitized text safe for HTML attributes
 */
export const sanitizeAttribute = (text) => {
  if (text == null || typeof text !== 'string') {
    return ''
  }
  
  return text
    .replace(/&/g, '&')
    .replace(/"/g, '"')
    .replace(/'/g, '&#39;')
    .replace(/</g, '<')
    .replace(/>/g, '>')
}

/**
 * Sanitize user input to remove potentially dangerous content
 * @param {string} text - User input to sanitize
 * @returns {string} Sanitized text
 */
export const sanitizeUserInput = (text) => {
  if (text == null || typeof text !== 'string') {
    return ''
  }
  
  // Remove script tags and event handlers
  return text
    .replace(/<script[^>]*>.*?<\/script>/gi, '')
    .replace(/<script[^>]*\/>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
}

/**
 * Composable for sanitization functions
 * @returns {Object} Sanitization utilities
 */
export const useSanitizer = () => {
  return {
    escapeHtml,
    sanitizeAttribute,
    sanitizeUserInput
  }
}

export default useSanitizer
