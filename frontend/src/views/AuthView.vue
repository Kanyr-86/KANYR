<template>
  <div class="login-page">
    <div class="login-container">
      <!-- Theme switcher -->
      <div class="theme-switcher-wrapper">
        <ThemeSwitcher />
      </div>
      
      <div class="card shadow-sm">
        <div class="card-header bg-material-blue text-white">
          <h5 class="text-center mb-0">
            <i class="bi bi-building me-2"></i>KANYR Bejelentkezés
          </h5>
          <p class="text-center mb-0 mt-1 small opacity-75">Kollégiumi Nyilvántartó Rendszer</p>
        </div>
        <div class="card-body p-3">
          <form @submit.prevent="handleLogin" novalidate>
            <div class="mb-3">
              <label for="email" class="form-label">Email cím</label>
              <div class="input-group">
                <span class="input-group-text">
                  <i class="bi bi-envelope"></i>
                </span>
                <input 
                  type="email" 
                  class="form-control" 
                  id="email" 
                  v-model="email"
                  placeholder="pelda@email.hu"
                  required
                  autocomplete="email"
                  :aria-invalid="emailError ? 'true' : undefined"
                  aria-describedby="email-error"
                  @input="emailError = false"
                >
              </div>
              <FormValidationError 
                :show="emailError && !email" 
                message="Az email cím megadása kötelező" 
              />
            </div>
            
            <div class="mb-3">
              <label for="password" class="form-label">Jelszó</label>
              <div class="input-group">
                <span class="input-group-text">
                  <i class="bi bi-lock"></i>
                </span>
                <input 
                  :type="showPassword ? 'text' : 'password'" 
                  class="form-control" 
                  id="password" 
                  v-model="password"
                  placeholder="••••••••"
                  required
                  autocomplete="current-password"
                  :aria-invalid="passwordError ? 'true' : undefined"
                  aria-describedby="password-error"
                  @input="passwordError = false"
                >
                <button 
                  type="button" 
                  class="btn btn-outline-secondary"
                  @click="showPassword = !showPassword"
                  :aria-label="showPassword ? 'Jelszó elrejtése' : 'Jelszó megjelenítése'"
                >
                  <i :class="showPassword ? 'bi bi-eye-slash' : 'bi bi-eye'"></i>
                </button>
              </div>
              <FormValidationError 
                :show="passwordError && !password" 
                message="A jelszó megadása kötelező" 
              />
            </div>
            
            <div class="d-grid">
              <button 
                type="submit" 
                class="btn btn-primary" 
                :disabled="loading"
              >
                <span v-if="loading" class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                <i v-else class="bi bi-box-arrow-in-right me-2"></i>
                {{ loading ? 'Bejelentkezés...' : 'Bejelentkezés' }}
              </button>
            </div>
          </form>
          
          <hr class="my-3">
          
          <div class="text-center">
            <p class="text-muted mb-2 small">Teszt fiókok fejlesztéshez:</p>
            <div class="d-flex gap-2 justify-content-center flex-wrap">
              <button 
                class="btn btn-outline-secondary btn-sm" 
                @click="useTestToken"
                :disabled="loading"
              >
                <i class="bi bi-person-badge me-1"></i>Teszt admin
              </button>
              <button 
                class="btn btn-outline-secondary btn-sm" 
                @click="useTestUser"
                :disabled="loading"
              >
                <i class="bi bi-person me-1"></i>Teszt diák
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Footer -->
      <div class="login-footer text-center mt-3">
        <small class="text-muted">© 2024 KANYR - Kollégiumi Nyilvántartó Rendszer</small>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Yale Blue háttér - KANYR téma */
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
  background-color: var(--yale-blue, #304d6d);
  transition: background-color 0.3s ease;
}

.login-container {
  width: 100%;
  max-width: 400px;
  padding: 1rem;
  position: relative;
}

.theme-switcher-wrapper {
  position: fixed;
  top: 1rem;
  right: 1rem;
  z-index: 1000;
}

.card {
  border: none;
  border-radius: 12px;
  margin: 0;
  background-color: var(--card-bg, #ffffff);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
  transition: background-color 0.3s ease;
}

.card-header {
  border-radius: 12px 12px 0 0 !important;
  padding: 1rem 1.5rem;
}

/* Blue Slate háttér a bejelentkező oldalhoz - KANYR téma */
.bg-material-blue {
  background-color: var(--blue-slate, #545e75) !important;
}

.card-header h5 {
  font-size: 1.1rem;
  line-height: 1.2;
}

.card-body {
  padding: 1.5rem;
}

.form-label {
  margin-bottom: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--text-primary);
}

.input-group-text {
  background-color: var(--bg-secondary, #f0f4f8);
  border-color: var(--input-border, #c3d3e1);
}

.form-control {
  min-height: 44px;
  padding: 0.625rem 0.875rem;
  font-size: 1rem;
}

.form-control:focus {
  border-color: var(--input-focus-border, #63adf2);
  box-shadow: 0 0 0 0.25rem rgba(99, 173, 242, 0.25);
}

.btn {
  min-height: 44px;
  padding: 0.625rem 1rem;
  font-weight: 500;
}

hr {
  margin: 1rem 0;
}

.login-footer small {
  color: rgba(255, 255, 255, 0.7);
}

/* Dark mode */
[data-theme="dark"] .login-page {
  background-color: var(--app-bg, #1a2129);
}

[data-theme="dark"] .card {
  background-color: var(--card-bg, #242c38);
}

[data-theme="dark"] .form-label {
  color: var(--text-secondary, #c3d3e1);
}

[data-theme="dark"] .input-group-text {
  background-color: var(--bg-tertiary, #333d4f);
  border-color: var(--input-border, #445775);
  color: var(--text-secondary, #c3d3e1);
}

[data-theme="dark"] .form-control {
  background-color: var(--input-bg, #333d4f);
  border-color: var(--input-border, #445775);
  color: var(--text-primary, #f0f4f8);
}

[data-theme="dark"] .form-control::placeholder {
  color: var(--text-tertiary, #82a0bc);
}

[data-theme="dark"] .login-footer small {
  color: rgba(255, 255, 255, 0.5);
}

@media (max-width: 575px) {
  .login-container {
    padding: 0.5rem;
    max-width: 100%;
  }
  
  .theme-switcher-wrapper {
    top: 0.5rem;
    right: 0.5rem;
  }
  
  .card-header h5 {
    font-size: 1rem;
  }
  
  .card-body {
    padding: 1rem;
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
  
  .mb-3 {
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
import FormValidationError from '../components/FormValidationError.vue'
import ThemeSwitcher from '../components/ThemeSwitcher.vue'

export default {
  name: 'AuthView',
  components: {
    FormValidationError,
    ThemeSwitcher
  },
  setup() {
    const authStore = useAuthStore()
    const router = useRouter()
    
    const email = ref('')
    const password = ref('')
    const loading = ref(false)
    const showPassword = ref(false)
    const emailError = ref(false)
    const passwordError = ref(false)

    const handleLogin = async () => {
      // Validáció - külön hibastátusz minden mezőhöz
      emailError.value = !email.value
      passwordError.value = !password.value
      
      if (!email.value || !password.value) {
        return
      }
      
      loading.value = true
      emailError.value = false
      passwordError.value = false
      try {
        const response = await authStore.login(email.value, password.value)
        if (response.success) {
          toast.success('Sikeres bejelentkezés!')
          router.push(authStore.getDashboardRoute())
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

    // Quick-login as admin using the seeded admin credentials
    const useTestToken = async () => {
      loading.value = true
      try {
        const response = await authStore.login('admin@kanyr.hu', 'admin123')
        if (response.success) {
          toast.success('Teszt admin bejelentkezés sikeres!')
          router.push(authStore.getDashboardRoute())
        } else {
          toast.error(response.error || 'Hiba a teszt bejelentkezés közben')
        }
      } catch (error) {
        console.error('Test admin login error:', error)
        toast.error(error.error || 'Hiba a teszt bejelentkezés közben')
      } finally {
        loading.value = false
      }
    }

    // Quick-login as student via the dev-only token endpoint
    const useTestUser = async () => {
      loading.value = true
      try {
        const response = await authService.getTestUserToken()
        if (response.success) {
          authStore.setToken(response.data.token)
          authStore.setUser({ userId: response.data.userId, admin: false })
          toast.success('Teszt user token sikeresen generálva!')
          router.push(authStore.getDashboardRoute())
        } else {
          toast.error(response.error || 'Hiba a teszt token generálása közben')
        }
      } catch (error) {
        console.error('Test user token error:', error)
        toast.error(error.error || 'Hiba a teszt token generálása közben')
      } finally {
        loading.value = false
      }
    }

    return {
      email,
      password,
      loading,
      showPassword,
      emailError,
      passwordError,
      handleLogin,
      useTestToken,
      useTestUser
    }
  }
}
</script>
