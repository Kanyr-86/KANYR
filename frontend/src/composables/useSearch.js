import { ref, watch } from 'vue'
import { useDebounce } from './useDebounce'
import { getErrorMessage } from '@/i18n'

/**
 * useSearch - A composable for debounced search functionality
 * 
 * Provides a complete search solution with debouncing, loading state,
 * error handling, and reactive results. Automatically handles the
 * search lifecycle including cleanup on component unmount.
 * 
 * @param {Function} searchFn - Async function that performs the search, receives query string
 * @param {number} delay - Debounce delay in milliseconds (default: 300ms)
 * @returns {Object} Search state and methods
 * @returns {Ref<string>} returns.searchQuery - Reactive search input value
 * @returns {Ref<Array>} returns.searchResults - Search results array
 * @returns {Ref<boolean>} returns.isSearching - Loading state
 * @returns {Ref<string|null>} returns.error - Error message if search failed
 * @returns {Function} returns.clearSearch - Clear search query and results
 * @returns {Function} returns.search - Manually trigger search
 * 
 * @example Basic search input
 * ```vue
 * <template>
 *   <div>
 *     <input
 *       v-model="searchQuery"
 *       type="text"
 *       class="form-control"
 *       placeholder="Search students..."
 *     />
 *     
 *     <div v-if="isSearching" class="text-muted mt-2">
 *       Searching...
 *     </div>
 *     
 *     <div v-else-if="error" class="text-danger mt-2">
 *       {{ error }}
 *     </div>
 *     
 *     <ul v-else-if="searchResults.length" class="list-group mt-2">
 *       <li v-for="result in searchResults" :key="result.id" class="list-group-item">
 *         {{ result.name }} - {{ result.email }}
 *       </li>
 *     </ul>
 *     
 *     <div v-else-if="searchQuery && !searchResults.length" class="text-muted mt-2">
 *       No results found
 *     </div>
 *   </div>
 * </template>
 * 
 * <script setup>
 * import { useSearch } from '@/composables/useSearch'
 * import api from '@/services/api'
 * 
 * const { searchQuery, searchResults, isSearching, error } = useSearch(
 *   async (query) => {
 *     const response = await api.get('/students/search', { params: { q: query } })
 *     return response.data
 *   }
 * )
 * </script>
 * ```
 * 
 * @example With initial results and custom delay
 * ```javascript
 * const { searchQuery, searchResults, isSearching, error } = useSearch(
 *   async (query) => {
 *     const response = await api.searchStudents(query)
 *     return response.data.students
 *   },
 *   500 // 500ms delay
 * )
 * ```
 * 
 * @example With clear button
 * ```vue
 * <template>
 *   <div class="input-group">
 *     <input v-model="searchQuery" class="form-control" placeholder="Search..." />
 *     <button 
 *       v-if="searchQuery" 
 *       class="btn btn-outline-secondary"
 *       @click="clearSearch"
 *     >
 *       Clear
 *     </button>
 *   </div>
 * </template>
 * 
 * <script setup>
 * const { searchQuery, searchResults, clearSearch } = useSearch(searchApi)
 * </script>
 * ```
 * 
 * @example Manual search trigger
 * ```javascript
 * const { searchQuery, search, searchResults, isSearching } = useSearch(searchApi)
 * 
 * // Programmatically trigger search
 * searchQuery.value = 'initial query'
 * // Or use the search method for manual trigger
 * search('custom query')
 * ```
 * 
 * @example With result transformation
 * ```javascript
 * const { searchQuery, searchResults, isSearching } = useSearch(
 *   async (query) => {
 *     const response = await api.search(query)
 *     // Transform results before displaying
 *     return response.data.map(item => ({
 *       id: item.id,
 *       label: `${item.firstName} ${item.lastName}`,
 *       email: item.email
 *     }))
 *   }
 * )
 * ```
 */
export function useSearch(searchFn, delay = 300) {
  const searchQuery = ref('')
  const searchResults = ref([])
  const isSearching = ref(false)
  const error = ref(null)

  /**
   * Perform the search operation
   * @param {string} query - Search query string
   */
  async function performSearch(query) {
    // Clear results and don't search if query is empty
    if (!query || query.trim() === '') {
      searchResults.value = []
      isSearching.value = false
      return
    }

    isSearching.value = true
    error.value = null

    try {
      const results = await searchFn(query.trim())
      searchResults.value = results || []
    } catch (err) {
      error.value = err.response?.data?.message || err.message || getErrorMessage('LOAD_ERROR')
      searchResults.value = []
    } finally {
      isSearching.value = false
    }
  }

  // Create debounced search function
  const { debouncedFn: debouncedSearch, cancel: cancelDebounce } = useDebounce(
    performSearch,
    delay
  )

  /**
   * Manually trigger search with optional query
   * @param {string} [query] - Optional query to search (uses searchQuery.value if not provided)
   */
  function search(query) {
    if (query !== undefined) {
      searchQuery.value = query
    }
    performSearch(searchQuery.value)
  }

  /**
   * Clear search query and results
   */
  function clearSearch() {
    cancelDebounce()
    searchQuery.value = ''
    searchResults.value = []
    error.value = null
    isSearching.value = false
  }

  // Watch for changes in searchQuery and trigger debounced search
  watch(searchQuery, (newQuery) => {
    if (newQuery.trim() === '') {
      // Immediately clear results for empty query
      searchResults.value = []
      error.value = null
      isSearching.value = false
      cancelDebounce()
    } else {
      // Debounce the search
      isSearching.value = true // Show loading immediately for UX
      debouncedSearch(newQuery)
    }
  })

  return {
    searchQuery,
    searchResults,
    isSearching,
    error,
    clearSearch,
    search
  }
}

export default useSearch