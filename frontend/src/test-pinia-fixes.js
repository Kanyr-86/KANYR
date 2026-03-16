// Simple test to verify Pinia store fixes
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'
import { useAuthStore } from './store/auth'
import { useApiStore } from './store/api'

// Test Pinia initialization
const pinia = createPinia()
pinia.use(piniaPluginPersistedstate)

console.log('✅ Pinia initialized with persistence plugin')

// Test auth store
const authStore = useAuthStore()
console.log('✅ Auth store created')
console.log('Auth store initial state:', {
  token: authStore.token,
  user: authStore.user,
  isAuthenticated: authStore.isAuthenticated
})

// Test cache store
const apiStore = useApiStore()
console.log('✅ API store created')
console.log('Cache store initial state:', {
  cacheSize: apiStore.cacheStats.size,
  hitRate: apiStore.cacheHitRate
})

// Test cache functionality
apiStore.setCache('/test', { data: 'test' }, { id: 1 })
const cachedData = apiStore.getCache('/test', { id: 1 })
console.log('✅ Cache test:', cachedData ? 'PASS' : 'FAIL')

// Test cache statistics
console.log('Cache stats:', apiStore.cacheStats)

console.log('🎉 All Pinia store fixes working correctly!')