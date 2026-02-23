import { onUnmounted } from 'vue'

/**
 * useDebounce - A composable for debouncing function calls
 * 
 * Creates a debounced version of a function that delays execution
 * until after a specified delay has elapsed since the last call.
 * Automatically cleans up pending timers on component unmount.
 * 
 * @param {Function} fn - The function to debounce
 * @param {number} delay - Delay in milliseconds (default: 300ms)
 * @returns {Object} Debounced function and control methods
 * @returns {Function} returns.debouncedFn - Debounced version of the function
 * @returns {Function} returns.cancel - Cancel any pending execution
 * @returns {Function} returns.flush - Immediately execute pending function
 * 
 * @example Basic usage
 * ```javascript
 * import { useDebounce } from '@/composables/useDebounce'
 * 
 * const saveData = async (data) => {
 *   await api.save(data)
 * }
 * 
 * const { debouncedFn: debouncedSave } = useDebounce(saveData, 500)
 * 
 * // Call multiple times rapidly - only executes once after 500ms
 * debouncedSave({ name: 'John' })
 * debouncedSave({ name: 'Jane' }) // This call overwrites the previous
 * // Executes after 500ms with { name: 'Jane' }
 * ```
 * 
 * @example With cancel and flush
 * ```javascript
 * const { debouncedFn, cancel, flush } = useDebounce(searchApi, 300)
 * 
 * // Normal debounced call
 * debouncedFn('search term')
 * 
 * // Cancel pending execution
 * cancel()
 * 
 * // Or execute immediately
 * flush() // Executes now with last arguments
 * ```
 * 
 * @example In a component with input handling
 * ```vue
 * <template>
 *   <input 
 *     v-model="searchTerm" 
 *     @input="handleInput"
 *     placeholder="Type to search..."
 *   />
 * </template>
 * 
 * <script setup>
 * import { ref } from 'vue'
 * import { useDebounce } from '@/composables/useDebounce'
 * 
 * const searchTerm = ref('')
 * 
 * const performSearch = async (query) => {
 *   const results = await api.search(query)
 *   // Handle results
 * }
 * 
 * const { debouncedFn: debouncedSearch } = useDebounce(performSearch, 300)
 * 
 * const handleInput = () => {
 *   debouncedSearch(searchTerm.value)
 * }
 * </script>
 * ```
 * 
 * @example Form auto-save
 * ```javascript
 * const { debouncedFn: autoSave } = useDebounce(async (formData) => {
 *   await api.updateForm(formData)
 *   toast.success('Auto-saved')
 * }, 1000)
 * 
 * // In form watcher
 * watch(formData, (newData) => {
 *   autoSave(newData)
 * }, { deep: true })
 * ```
 */
export function useDebounce(fn, delay = 300) {
  let timeoutId = null
  let lastArgs = null
  let lastThis = null

  /**
   * Debounced function - delays execution until after delay ms
   * @param {...any} args - Arguments to pass to the original function
   */
  function debouncedFn(...args) {
    lastArgs = args
    lastThis = this

    // Clear any existing timeout
    if (timeoutId) {
      clearTimeout(timeoutId)
    }

    // Set new timeout
    timeoutId = setTimeout(() => {
      fn.apply(lastThis, lastArgs)
      timeoutId = null
      lastArgs = null
      lastThis = null
    }, delay)
  }

  /**
   * Cancel any pending execution
   */
  function cancel() {
    if (timeoutId) {
      clearTimeout(timeoutId)
      timeoutId = null
      lastArgs = null
      lastThis = null
    }
  }

  /**
   * Immediately execute the pending function with last arguments
   */
  function flush() {
    if (timeoutId && lastArgs) {
      clearTimeout(timeoutId)
      fn.apply(lastThis, lastArgs)
      timeoutId = null
      lastArgs = null
      lastThis = null
    }
  }

  // Cleanup on component unmount
  onUnmounted(() => {
    cancel()
  })

  return {
    debouncedFn,
    cancel,
    flush
  }
}

export default useDebounce