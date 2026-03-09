// Egyszerű cache implementáció TTL-lel
const cache = new Map()
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

const useApiCache = () => {
  const getCachedData = (key) => {
    const cached = cache.get(key)
    if (cached) {
      const now = Date.now()
      if (now - cached.timestamp < CACHE_TTL) {
        return cached.data
      } else {
        cache.delete(key)
      }
    }
    return null
  }

  const setCachedData = (key, data) => {
    cache.set(key, {
      data,
      timestamp: Date.now()
    })
  }

  const clearCache = (pattern = null) => {
    if (pattern) {
      for (const key of cache.keys()) {
        if (key.includes(pattern)) {
          cache.delete(key)
        }
      }
    } else {
      cache.clear()
    }
  }

  const fetchData = async (key, fetchFunction, options = {}) => {
    const { useCache = true, invalidateCache = false } = options

    try {
      // Először a cache ellenőrzése (kivéve, ha invalidálunk)
      if (useCache && !invalidateCache) {
        const cachedData = getCachedData(key)
        if (cachedData) {
          return cachedData
        }
      }

      // Adatok lekérése
      const data = await fetchFunction()
      
      // Eredmény cache-elése, ha nem invalidálunk
      if (useCache && !invalidateCache) {
        setCachedData(key, data)
      }

      return data
    } catch (error) {
      throw error
    }
  }

  const invalidateCache = (pattern) => {
    clearCache(pattern)
  }

  return {
    fetchData,
    invalidateCache,
    clearCache
  }
}

export default useApiCache