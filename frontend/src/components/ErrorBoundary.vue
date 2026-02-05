<template>
  <div class="container mt-4">
    <div class="alert alert-danger" role="alert">
      <h4 class="alert-heading">Hiba történt az alkalmazásban</h4>
      <p>{{ error?.message || 'Ismeretlen hiba' }}</p>
      <hr>
      <button class="btn btn-danger" @click="handleReload">
        Oldal újratöltése
      </button>
    </div>
  </div>
</template>

<script>
import { defineComponent, ref } from 'vue'

export default defineComponent({
  name: 'ErrorBoundary',
  setup() {
    const hasError = ref(false)
    const error = ref(null)

    const getDerivedStateFromError = (error) => {
      hasError.value = true
      error.value = error
      return { hasError: true, error }
    }

    const componentDidCatch = (error, errorInfo) => {
      console.error('ErrorBoundary caught an error:', error, errorInfo)
    }

    const handleReload = () => {
      window.location.reload()
    }

    return {
      hasError,
      error,
      getDerivedStateFromError,
      componentDidCatch,
      handleReload
    }
  }
})
</script>