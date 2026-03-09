import { onUnmounted } from 'vue'

/**
 * useDebounce - Composable függvényhívások debouncing-jához
 * 
 * Létrehoz egy debounced verziót egy függvényből, amely késlelteti a végrehajtást,
 * amíg a megadott késleltetési idő le nem telik az utolsó hívás óta.
 * Automatikusan takarítja a függőben lévő időzítőket a komponens unmount-olásakor.
 * 
 * @param {Function} fn - A debounce-olandó függvény
 * @param {number} delay - Késleltetés milliszekundumban (alapértelmezett: 300ms)
 * @returns {Object} Debounced függvény és vezérlő metódusok
 * @returns {Function} returns.debouncedFn - A függvény debounced verziója
 * @returns {Function} returns.cancel - Bármely függőben lévő végrehajtás megszakítása
 * @returns {Function} returns.flush - Függőben lévő függvény azonnali végrehajtása
 * 
 * @example Alapvető használat
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
 * @example Cancel és flush használata
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
 * @example Komponensben bemenet kezeléssel
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
 * @example Űrlap automatikus mentése
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
   * Debounced függvény - késlelteti a végrehajtást a késleltetési idő után
   * @param {...any} args - Az eredeti függvénynek átadandó argumentumok
   */
  function debouncedFn(...args) {
    lastArgs = args
    lastThis = this

    // Bármely meglévő időkorlát törlése
    if (timeoutId) {
      clearTimeout(timeoutId)
    }

    // Új időkorlát beállítása
    timeoutId = setTimeout(() => {
      fn.apply(lastThis, lastArgs)
      timeoutId = null
      lastArgs = null
      lastThis = null
    }, delay)
  }

  /**
   * Bármely függőben lévő végrehajtás megszakítása
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
   * Függőben lévő függvény azonnali végrehajtása az utolsó argumentumokkal
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

  // Takarítás a komponens unmount-olásakor
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