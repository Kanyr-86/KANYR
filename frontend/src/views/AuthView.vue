<template>
  <div class="container">
    <div class="row justify-content-center">
      <div class="col-md-6">
        <div class="card">
          <div class="card-header">
            <h3 class="text-center">KANYR Bejelentkezés</h3>
          </div>
          <div class="card-body">
            <form @submit.prevent="handleLogin">
              <div class="mb-3">
                <label for="email" class="form-label">Email cím</label>
                <input 
                  type="email" 
                  class="form-control" 
                  id="email" 
                  v-model="email"
                  required
                >
              </div>
              <div class="mb-3">
                <label for="password" class="form-label">Jelszó</label>
                <input 
                  type="password" 
                  class="form-control" 
                  id="password" 
                  v-model="password"
                  required
                >
              </div>
              <div class="d-grid">
                <button type="submit" class="btn btn-primary" :disabled="loading">
                  {{ loading ? 'Bejelentkezés...' : 'Bejelentkezés' }}
                </button>
              </div>
            </form>
            
            <div class="mt-3 text-center">
              <p>Vagy használjon teszt admin tokent:</p>
              <button 
                class="btn btn-secondary" 
                @click="useTestToken"
                :disabled="loading"
              >
                {{ loading ? 'Token generálása...' : 'Teszt admin token' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { useAuthStore } from '../store/auth'
import { authService } from '../services/authService'
import { useRouter } from 'vue-router'

export default {
  name: 'AuthView',
  setup() {
    const authStore = useAuthStore()
    const router = useRouter()
    
    const email = ref('')
    const password = ref('')
    const loading = ref(false)

    const handleLogin = async () => {
      loading.value = true
      try {
        const response = await authService.login(email.value, password.value)
        if (response.success) {
          authStore.setToken(response.data.token)
          authStore.setUser(response.data.user)
          router.push('/dashboard')
        }
      } catch (error) {
        alert('Hibás bejelentkezési adatok')
      } finally {
        loading.value = false
      }
    }

    const useTestToken = async () => {
      loading.value = true
      try {
        const response = await authService.getTestAdminToken()
        if (response.success) {
          authStore.setToken(response.data.token)
          authStore.setUser({ userId: response.data.userId, admin: response.data.admin })
          router.push('/dashboard')
        }
      } catch (error) {
        alert('Hiba a teszt token generálása közben')
      } finally {
        loading.value = false
      }
    }

    return {
      email,
      password,
      loading,
      handleLogin,
      useTestToken
    }
  }
}
</script>