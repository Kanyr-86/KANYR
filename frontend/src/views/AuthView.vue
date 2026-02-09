<template>
  <div class="container auth-container">
    <div class="row justify-content-center align-items-center min-vh-100">
      <div class="col-12 col-sm-10 col-md-8 col-lg-5 col-xl-4">
        <div class="card shadow">
          <div class="card-header bg-primary text-white">
            <h3 class="text-center mb-0">KANYR Bejelentkezés</h3>
          </div>
          <div class="card-body p-4">
            <form @submit.prevent="handleLogin">
              <div class="mb-3">
                <label for="email" class="form-label">Email cím</label>
                <input 
                  type="email" 
                  class="form-control form-control-lg" 
                  id="email" 
                  v-model="email"
                  placeholder="pelda@email.hu"
                  required
                >
              </div>
              <div class="mb-4">
                <label for="password" class="form-label">Jelszó</label>
                <input 
                  type="password" 
                  class="form-control form-control-lg" 
                  id="password" 
                  v-model="password"
                  placeholder="••••••••"
                  required
                >
              </div>
              <div class="d-grid">
                <button type="submit" class="btn btn-primary btn-lg" :disabled="loading">
                  {{ loading ? 'Bejelentkezés...' : 'Bejelentkezés' }}
                </button>
              </div>
            </form>
            
            <hr class="my-4">
            
            <div class="text-center">
              <p class="text-muted mb-3">Vagy használjon teszt admin tokent:</p>
              <button 
                class="btn btn-outline-secondary" 
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

<style scoped>
.auth-container {
  padding-top: 1rem;
  padding-bottom: 1rem;
}

@media (min-width: 576px) {
  .auth-container {
    padding-top: 2rem;
    padding-bottom: 2rem;
  }
}

@media (min-width: 768px) {
  .auth-container {
    padding-top: 0;
    padding-bottom: 0;
  }
}

.card {
  border: none;
  border-radius: 12px;
}

.card-header {
  border-radius: 12px 12px 0 0 !important;
  padding: 1.5rem;
}

.card-header h3 {
  font-size: 1.5rem;
  word-wrap: break-word;
}

@media (max-width: 575px) {
  .card-header h3 {
    font-size: 1.25rem;
  }
  
  .card-body {
    padding: 1.5rem !important;
  }
}
</style>

<script>
import { ref } from 'vue'
import { useAuthStore } from '../store/auth'
import { authService } from '../services/authService'
import { useRouter } from 'vue-router'
import { toast } from 'vue3-toastify'

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
        const response = await authStore.login(email.value, password.value)
        if (response.success) {
          toast.success('Sikeres bejelentkezés!')
          router.push('/dashboard')
        } else {
          toast.error(response.error || 'Hibás bejelentkezési adatok')
        }
      } catch (error) {
        console.error('Login error:', error)
        toast.error(error.error || 'Hiba a bejelentkezés során')
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
          toast.success('Teszt admin token sikeresen generálva!')
          router.push('/dashboard')
        } else {
          toast.error(response.error || 'Hiba a teszt token generálása közben')
        }
      } catch (error) {
        console.error('Test token error:', error)
        toast.error(error.error || 'Hiba a teszt token generálása közben')
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
