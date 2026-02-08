<template>
  <div v-if="hasError" class="container mt-4">
    <div class="alert alert-danger" role="alert">
      <h4 class="alert-heading">Hiba történt az alkalmazásban</h4>
      <p><strong>Hiba üzenet:</strong> {{ errorMessage }}</p>
      <p v-if="errorStack"><strong>Stack trace:</strong></p>
      <pre v-if="errorStack" class="bg-light p-2 rounded text-danger" style="font-size: 11px; max-height: 200px; overflow: auto; white-space: pre-wrap;">{{ errorStack }}</pre>
      <hr>
      <div class="d-flex gap-2">
        <button class="btn btn-danger" @click="handleReload">
          Oldal újratöltése
        </button>
        <button class="btn btn-secondary" @click="showDetails = !showDetails">
          {{ showDetails ? 'Részletek elrejtése' : 'Részletek mutatása' }}
        </button>
      </div>
      <div v-if="showDetails" class="mt-3">
        <h5>Debug információk:</h5>
        <pre class="bg-light p-2 rounded" style="font-size: 11px; max-height: 300px; overflow: auto;">{{ debugInfo }}</pre>
      </div>
    </div>
  </div>
  <slot v-else></slot>
</template>

<script>
import { defineComponent, ref, computed, onErrorCaptured, onMounted } from 'vue'

export default defineComponent({
  name: 'ErrorBoundary',
  setup(props, { slots, emit }) {
    const hasError = ref(false)
    const error = ref(null)
    const errorInfo = ref(null)
    const showDetails = ref(false)

    // Capture errors from child components
    onErrorCaptured((err, instance, info) => {
      console.error('=== ErrorBoundary caught error ===')
      console.error('Error:', err)
      console.error('Component:', instance)
      console.error('Info:', info)
      console.error('Stack:', err?.stack)
      console.error('===================================')
      
      hasError.value = true
      error.value = err
      errorInfo.value = info
      
      // Prevent error from propagating further
      return false
    })

    // Also listen for global errors
    onMounted(() => {
      const handleGlobalError = (event) => {
        console.error('=== Global error caught ===')
        console.error('Error:', event.error)
        console.error('Message:', event.message)
        console.error('Filename:', event.filename)
        console.error('Stack:', event.error?.stack)
        console.error('===========================')
        
        hasError.value = true
        error.value = event.error || new Error(event.message)
      }

      const handleUnhandledRejection = (event) => {
        console.error('=== Unhandled promise rejection ===')
        console.error('Reason:', event.reason)
        console.error('====================================')
        
        hasError.value = true
        error.value = event.reason instanceof Error ? event.reason : new Error(String(event.reason))
      }

      window.addEventListener('error', handleGlobalError)
      window.addEventListener('unhandledrejection', handleUnhandledRejection)

      // Cleanup
      return () => {
        window.removeEventListener('error', handleGlobalError)
        window.removeEventListener('unhandledrejection', handleUnhandledRejection)
      }
    })

    const errorMessage = computed(() => {
      if (!error.value) return 'Ismeretlen hiba'
      return error.value.message || String(error.value) || 'Ismeretlen hiba'
    })

    const errorStack = computed(() => {
      return error.value?.stack || ''
    })

    const debugInfo = computed(() => {
      return JSON.stringify({
        message: errorMessage.value,
        stack: errorStack.value,
        component: errorInfo.value,
        errorType: error.value?.constructor?.name,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent
      }, null, 2)
    })

    const handleReload = () => {
      window.location.reload()
    }

    return {
      hasError,
      error,
      errorInfo,
      showDetails,
      errorMessage,
      errorStack,
      debugInfo,
      handleReload
    }
  }
})
</script>