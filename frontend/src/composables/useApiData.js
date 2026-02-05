import { ref, onMounted, onUnmounted } from 'vue'
import api from '../services/api'

const useApiData = (apiCall, dependencies = [], options = {}) => {
  const { useCache = true, shouldInvalidateCache = false, keyPrefix = '' } = options
  const data = ref(null)
  const loading = ref(true)
  const error = ref(null)
  
  const fetchData = async () => {
    if (!apiCall) return

    loading.value = true
    error.value = null

    try {
      const result = await apiCall()
      data.value = result.data
    } catch (err) {
      error.value = err.response?.data?.error || err.message || 'Failed to fetch data'
    } finally {
      loading.value = false
    }
  }

  const refetch = () => {
    fetchData()
  }

  onMounted(() => {
    fetchData()
  })

  return {
    data,
    loading,
    error,
    refetch
  }
}

export default useApiData