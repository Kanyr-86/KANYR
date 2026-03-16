import { ref, watch } from 'vue'
import { useDebounce } from './useDebounce'
import { getErrorMessage } from '@/i18n'

/**
 * useSearch - Composable debounced keresési funkcionalitáshoz
 * 
 * Teljes keresési megoldást biztosít debouncing-gal, betöltési állapottal,
 * hibakezeléssel és reaktív eredményekkel. Automatikusan kezeli a
 * keresés életciklusát, beleértve a komponens unmount-olásakor történő takarítást.
 * 
 * @param {Function} searchFn - Async függvény, amely végrehajtja a keresést, megkapja a lekérdezési sztringet
 * @param {number} delay - Debounce késleltetés milliszekundumban (alapértelmezett: 300ms)
 * @returns {Object} Keresési állapot és metódusok
 * @returns {Ref<string>} returns.searchQuery - Reaktív keresési bemeneti érték
 * @returns {Ref<Array>} returns.searchResults - Keresési eredmények tömbje
 * @returns {Ref<boolean>} returns.isSearching - Betöltési állapot
 * @returns {Ref<string|null>} returns.error - Hibaüzenet, ha a keresés sikertelen
 * @returns {Function} returns.clearSearch - Keresési lekérdezés és eredmények törlése
 * @returns {Function} returns.search - Keresés kézi indítása
 * 
 * @example Alap keresési bemenet
 * ```vue
 * <template>
 *   <div>
 *     <input
 *       v-model="searchQuery"
 *       type="text"
 *       class="form-control"
 *       placeholder="Diákok keresése..."
 *     />
 *     
 *     <div v-if="isSearching" class="text-muted mt-2">
 *       Keresés...
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
 *       Nincs találat
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
 * @example Kezdeti eredményekkel és egyedi késleltetéssel
 * ```javascript
 * const { searchQuery, searchResults, isSearching, error } = useSearch(
 *   async (query) => {
 *     const response = await api.searchStudents(query)
 *     return response.data.students
 *   },
 *   500 // 500ms késleltetés
 * )
 * ```
 * 
 * @example Törlés gombbal
 * ```vue
 * <template>
 *   <div class="input-group">
 *     <input v-model="searchQuery" class="form-control" placeholder="Keresés..." />
 *     <button 
 *       v-if="searchQuery" 
 *       class="btn btn-outline-secondary"
 *       @click="clearSearch"
 *     >
 *       Törlés
 *     </button>
 *   </div>
 * </template>
 * 
 * <script setup>
 * const { searchQuery, searchResults, clearSearch } = useSearch(searchApi)
 * </script>
 * ```
 * 
 * @example Kézi keresés indítása
 * ```javascript
 * const { searchQuery, search, searchResults, isSearching } = useSearch(searchApi)
 * 
 * // Keresés programozott indítása
 * searchQuery.value = 'kezdeti lekérdezés'
 * // Vagy a search metódus használata kézi indításhoz
 * search('egyedi lekérdezés')
 * ```
 * 
 * @example Eredmény transzformációval
 * ```javascript
 * const { searchQuery, searchResults, isSearching } = useSearch(
 *   async (query) => {
 *     const response = await api.search(query)
 *     // Eredmények transzformálása megjelenítés előtt
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
   * Keresési művelet végrehajtása
   * @param {string} query - Keresési lekérdezés sztring
   */
  async function performSearch(query) {
    // Eredmények törlése és ne keressünk, ha a lekérdezés üres
    if (!query || query.trim() === '') {
      searchResults.value.splice(0, searchResults.value.length)
      isSearching.value = false
      return
    }

    isSearching.value = true
    error.value = null

    try {
      const results = await searchFn(query.trim())
      const data = results || []
      searchResults.value.splice(0, searchResults.value.length, ...data)
    } catch (err) {
      error.value = err.response?.data?.message || err.message || getErrorMessage('LOAD_ERROR')
      searchResults.value.splice(0, searchResults.value.length)
    } finally {
      isSearching.value = false
    }
  }

  // Debounced keresési függvény létrehozása
  const { debouncedFn: debouncedSearch, cancel: cancelDebounce } = useDebounce(
    performSearch,
    delay
  )

  /**
   * Keresés kézi indítása opcionális lekérdezéssel
   * @param {string} [query] - Opcionális lekérdezés (ha nincs megadva, a searchQuery.value-t használja)
   */
  function search(query) {
    if (query !== undefined) {
      searchQuery.value = query
    }
    performSearch(searchQuery.value)
  }

  /**
   * Keresési lekérdezés és eredmények törlése
   */
  function clearSearch() {
    cancelDebounce()
    searchQuery.value = ''
    searchResults.value.splice(0, searchResults.value.length)
    error.value = null
    isSearching.value = false
  }

  // Figyelje a searchQuery változásait és indítsa el a debounced keresést
  watch(searchQuery, (newQuery) => {
    if (newQuery.trim() === '') {
      // Azonnal törölje az eredményeket üres lekérdezés esetén
      searchResults.value.splice(0, searchResults.value.length)
      error.value = null
      isSearching.value = false
      cancelDebounce()
    } else {
      // Keresés debounce-olása
      isSearching.value = true // Betöltés azonnali megjelenítése a jobb felhasználói élményért
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