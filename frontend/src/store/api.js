import { defineStore } from 'pinia'

export const useApiStore = defineStore('api', {
  state: () => ({
    cache: new Map(),
    loadingStates: new Map()
  }),
  
  actions: {
    setCache(key, data) {
      this.cache.set(key, {
        data,
        timestamp: Date.now()
      })
    },
    
    getCache(key) {
      const cached = this.cache.get(key)
      if (cached) {
        const now = Date.now()
        if (now - cached.timestamp < 5 * 60 * 1000) { // 5 minutes TTL
          return cached.data
        } else {
          this.cache.delete(key)
        }
      }
      return null
    },
    
    clearCache(pattern = null) {
      if (pattern) {
        for (const key of this.cache.keys()) {
          if (key.includes(pattern)) {
            this.cache.delete(key)
          }
        }
      } else {
        this.cache.clear()
      }
    },
    
    setLoading(key, loading) {
      this.loadingStates.set(key, loading)
    },
    
    getLoading(key) {
      return this.loadingStates.get(key) || false
    }
  }
})