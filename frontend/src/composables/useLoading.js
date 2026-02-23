import { ref } from 'vue'

/**
 * useLoading - A composable for managing loading state in components
 * 
 * Provides a simple way to track loading states for async operations.
 * Can be used in any component that needs to show loading indicators.
 * 
 * @returns {Object} Loading state and control functions
 * @returns {Ref<boolean>} returns.isLoading - Reactive loading state
 * @returns {Function} returns.startLoading - Function to set loading to true
 * @returns {Function} returns.stopLoading - Function to set loading to false
 * @returns {Function} returns.withLoading - Wrapper function for async operations
 * 
 * @example Basic usage
 * ```javascript
 * import { useLoading } from '@/composables/useLoading'
 * 
 * const { isLoading, startLoading, stopLoading } = useLoading()
 * 
 * async function fetchData() {
 *   startLoading()
 *   try {
 *     const result = await api.getData()
 *     data.value = result
 *   } finally {
 *     stopLoading()
 *   }
 * }
 * ```
 * 
 * @example Using withLoading wrapper
 * ```javascript
 * import { useLoading } from '@/composables/useLoading'
 * 
 * const { isLoading, withLoading } = useLoading()
 * 
 * async function saveData() {
 *   await withLoading(async () => {
 *     await api.saveData(formData)
 *     // Success handling
 *   })
 * }
 * ```
 * 
 * @example With error handling
 * ```javascript
 * import { useLoading } from '@/composables/useLoading'
 * import { useToastStore } from '@/store/toast'
 * 
 * const { isLoading, withLoading } = useLoading()
 * const toast = useToastStore()
 * 
 * async function deleteItem(id) {
 *   await withLoading(async () => {
 *     await api.deleteItem(id)
 *     toast.success('Item deleted successfully')
 *     await fetchItems() // Refresh list
 *   }, (error) => {
 *     toast.error('Failed to delete item: ' + error.message)
 *   })
 * }
 * ```
 * 
 * @example In a component with LoadingOverlay
 * ```vue
 * <template>
 *   <div>
 *     <button @click="handleSubmit" :disabled="isLoading">
 *       {{ isLoading ? 'Saving...' : 'Save' }}
 *     </button>
 *     <LoadingOverlay :show="isLoading" message="Saving data..." />
 *   </div>
 * </template>
 * 
 * <script setup>
 * import { useLoading } from '@/composables/useLoading'
 * import LoadingOverlay from '@/components/LoadingOverlay.vue'
 * 
 * const { isLoading, withLoading } = useLoading()
 * 
 * async function handleSubmit() {
 *   await withLoading(async () => {
 *     await api.submitForm(formData)
 *   })
 * }
 * </script>
 * ```
 */
export function useLoading() {
  const isLoading = ref(false)

  /**
   * Set loading state to true
   */
  function startLoading() {
    isLoading.value = true
  }

  /**
   * Set loading state to false
   */
  function stopLoading() {
    isLoading.value = false
  }

  /**
   * Wrap an async function with automatic loading state management
   * 
   * @param {Function} asyncFn - The async function to execute
   * @param {Function} [onError] - Optional error handler
   * @returns {Promise} The result of the async function
   * 
   * @example
   * await withLoading(async () => {
   *   const result = await api.getData()
   *   data.value = result
   * }, (error) => {
   *   console.error('Operation failed:', error)
   * })
   */
  async function withLoading(asyncFn, onError = null) {
    startLoading()
    try {
      const result = await asyncFn()
      return result
    } catch (error) {
      if (onError) {
        onError(error)
      } else {
        // Re-throw if no error handler provided
        throw error
      }
    } finally {
      stopLoading()
    }
  }

  return {
    isLoading,
    startLoading,
    stopLoading,
    withLoading
  }
}

export default useLoading