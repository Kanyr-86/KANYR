<template>
  <div class="login-page">
    <div class="login-container">
      <div class="card shadow-sm">
        <div class="card-header bg-material-blue text-white">
          <h5 class="text-center mb-0">KANYR Bejelentkezés</h5>
        </div>
        <div class="card-body p-3">
          <form @submit.prevent="handleLogin">
            <div class="mb-2">
              <label for="email" class="form-label mb-1 small">Email cím</label>
              <input 
                type="email" 
                class="form-control form-control-sm" 
                id="email" 
                v-model="email"
                placeholder="pelda@email.hu"
                required
              >
            </div>
            <div class="mb-2">
              <label for="password" class="form-label mb-1 small">Jelszó</label>
              <input 
                type="password" 
                class="form-control form-control-sm" 
                id="password" 
                v-model="password"
                placeholder="••••••••"
                required
              >
            </div>
            <div class="d-grid">
              <button type="submit" class="btn btn-primary btn-sm" :disabled="loading">
                {{ loading ? 'Bejelentkezés...' : 'Bejelentkezés' }}
              </button>
            </div>
          </form>
          
          <hr class="my-2">
          
          <div class="text-center">
            <p class="text-muted mb-1 small" style="font-size: 0.8rem;">Vagy használjon teszt admin tokent:</p>
            <button 
              class="btn btn-outline-secondary btn-xs" 
              @click="useTestToken"
              :disabled="loading"
              style="font-size: 0.75rem; padding: 0.2rem 0.5rem;"
            >
              {{ loading ? 'Token generálása...' : 'Teszt admin token' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Sötét kék háttér - illeszkedik az alkalmazás témájához */
.login-page {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #2c4a5a;
}

.login-container {
  width: 100%;
  max-width: 400px;
  padding: 1rem;
}

.card {
  border: none;
  border-radius: 8px;
  margin: 0;
  background-color: #ffffff;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
}

.card-header {
  border-radius: 8px 8px 0 0 !important;
  padding: 0.75rem 1rem;
}

/* Material Design kék háttér a bejelentkező oldalhoz */
.bg-material-blue {
  background-color: #1e88e5 !important;
}

.card-header h5 {
  font-size: 1.1rem;
  line-height: 1.2;
}

.card-body {
  padding: 1rem;
}

.form-label {
  margin-bottom: 0.25rem;
  font-size: 0.875rem;
}

.form-control-sm {
  padding: 0.375rem 0.75rem;
  font-size: 0.9rem;
  line-height: 1.3;
}

.btn-sm {
  padding: 0.4rem 0.8rem;
  font-size: 0.9rem;
}

hr {
  margin: 0.75rem 0;
}

@media (max-width: 575px) {
  .login-container {
    padding: 0.5rem;
    max-width: 100%;
  }
  
  .card-header h5 {
    font-size: 1rem;
  }
  
  .card-body {
    padding: 0.75rem;
  }
}

/* Nagyon kis képernyőn még kompaktabb */
@media (max-height: 500px) {
  .card-header {
    padding: 0.5rem 0.75rem;
  }
  
  .card-body {
    padding: 0.5rem 0.75rem;
  }
  
  .mb-2 {
    margin-bottom: 0.5rem !important;
  }
  
  hr {
    margin: 0.5rem 0;
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
