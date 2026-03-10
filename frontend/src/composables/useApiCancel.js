import { onUnmounted } from 'vue'

/**
 * Composable for managing API request cancellation using AbortController.
 * Automatically aborts pending requests when the component unmounts.
 * 
 * @returns {Object} Object containing createAbortController helper
 * @example
 * // In a view component:
 * const { createAbortController, abortAll } = useApiCancel()
 * 
 * const fetchData = async () => {
 *   const { signal, abort } = createAbortController()
 *   try {
 *     const response = await api.get('/students', { signal })
 *     students.value = response.data
 *   } catch (err) {
 *     if (err.name !== 'AbortError') throw err
 *   }
 * }
 * 
 * // Or for multiple concurrent requests:
 * onUnmounted(() => {
 *   abortAll()
 * })
 */
export function useApiCancel() {
  const controllers = new Set()

  /**
   * Creates a new AbortController and tracks it for cleanup
   * @returns {Object} { signal: AbortSignal, abort: Function, controller: AbortController }
   */
  const createAbortController = () => {
    const controller = new AbortController()
    controllers.add(controller)
    
    return {
      signal: controller.signal,
      abort: () => {
        controller.abort()
        controllers.delete(controller)
      },
      controller
    }
  }

  /**
   * Aborts all tracked requests
   */
  const abortAll = () => {
    controllers.forEach(controller => {
      if (!controller.signal.aborted) {
        controller.abort()
      }
    })
    controllers.clear()
  }

  /**
   * Checks if an error is an abort error
   * @param {Error} error - The error to check
   * @returns {boolean}
   */
  const isAbortError = (error) => {
    return error && (error.name === 'AbortError' || error.name === 'CanceledError')
  }

  // Automatically abort all pending requests when component unmounts
  onUnmounted(() => {
    abortAll()
  })

  return {
    createAbortController,
    abortAll,
    isAbortError
  }
}

export default useApiCancel
