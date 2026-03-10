import { ref, onMounted, onUnmounted } from 'vue'
import api from '../services/api'
import { getErrorMessage } from '@/i18n'

const useApiData = (apiCall, dependencies = [], options = {}) => {
  const { useCache = true, shouldInvalidateCache = false, keyPrefix = '' } = options
  const data = ref(null)
  const loading = ref(true)
  const error = ref(null)
  
  // Create AbortController for request cancellation
  const controller = new AbortController()
  
  const fetchData = async () => {
    if (!apiCall) return

    loading.value = true
    error.value = null

    try {
      // Pass the abort signal to the API call
      const result = await apiCall({ signal: controller.signal })
      data.value = result.data
    } catch (err) {
      // Don't update state if the request was aborted
      if (err.name === 'AbortError' || err.name === 'CanceledError') {
        return
      }
      error.value = err.response?.data?.error || err.message || getErrorMessage('LOAD_ERROR')
    } finally {
      // Only update loading state if not aborted
      if (!controller.signal.aborted) {
        loading.value = false
      }
    }
  }

  const refetch = () => {
    fetchData()
  }

  onMounted(() => {
    fetchData()
  })

  // Cancel the request when component unmounts
  onUnmounted(() => {
    controller.abort()
  })

  return {
    data,
    loading,
    error,
    refetch
  }
}

export default useApiData
