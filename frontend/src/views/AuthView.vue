<template>
  <div class="login-page">
    <div class="login-container">
      <div class="card shadow-sm">
        <div class="card-header">
          <h5 class="text-center mb-0">KANYR Bejelentkezés</h5>
        </div>
        <div class="card-body p-3">
          <form @submit.prevent="handleLogin">
            <div class="mb-2 form-row">
              <label for="email" class="form-label mb-1 small">E-mail cím</label>
              <input 
                type="email" 
                class="form-control form-control-sm" 
                id="email" 
                v-model="email"
                placeholder="pelda@email.hu"
                required
              >
            </div>
            <div class="mb-2 form-row">
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
  background-color: var(--bg-sidebar);
}

.login-container {
  width: 100%;
  max-width: 400px;
  padding: 1rem;
}

/* Auth view specific card overrides - relies on global card system */

.card {
  /* Only override what's necessary for auth view */
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
}

.card-header {
  border-radius: var(--card-border-radius) var(--card-border-radius) 0 0 !important;
}

.card-header h5 {
  font-size: 1.1rem;
  line-height: 1.2;
  color: var(--text-primary);
}

/* Sötét módban fehér szín */
[data-theme="dark"] .card-header h5 {
  color: var(--text-inverse);
}

/* High contrast módban is fehér */
[data-theme="high-contrast"] .card-header h5 {
  color: var(--text-inverse);
}

.form-label {
  margin-bottom: 0.25rem;
  font-size: 0.875rem;
  color: var(--text-body);
}

/* Form row layout - label és input egy vonalban */
.form-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.form-row .form-label {
  width: 85px;
  margin-bottom: 0;
  flex-shrink: 0;
  text-align: left;
}

.form-row .form-control {
  flex: 1;
}

.form-control-sm {
  padding: 0.375rem 0.75rem;
  font-size: 0.9rem;
  line-height: 1.3;
  background-color: var(--bg-page);
  border-color: var(--border-primary);
  color: var(--text-primary);
}

.form-control-sm:focus {
  border-color: var(--primary-600);
  box-shadow: 0 0 0 0.25rem rgba(99, 102, 241, 0.25);
}

.btn-sm {
  padding: 0.4rem 0.8rem;
  font-size: 0.9rem;
  background: linear-gradient(135deg, var(--primary-600), var(--primary-700));
  border: none;
  color: white;
}

hr {
  margin: 0.75rem 0;
  border-color: var(--border-secondary);
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

/* Dark theme overrides */
[data-theme="dark"] .login-page {
  background-color: var(--secondary-800);
}

[data-theme="dark"] .card {
  background-color: var(--bg-card);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.6);
}

[data-theme="dark"] .card-header {
  background-color: var(--bg-card);
}

[data-theme="dark"] .form-control-sm {
  background-color: var(--bg-secondary);
  border-color: var(--border-primary);
  color: var(--text-primary);
}

[data-theme="dark"] .form-control-sm:focus {
  border-color: var(--primary-600);
  box-shadow: 0 0 0 0.25rem rgba(99, 102, 241, 0.4);
}

/* High contrast theme overrides */
[data-theme="high-contrast"] .login-page {
  background-color: var(--secondary-800);
}

[data-theme="high-contrast"] .card {
  background-color: var(--bg-card);
  border: 2px solid var(--border-primary);
}

[data-theme="high-contrast"] .form-control-sm {
  background-color: var(--bg-page);
  border: 2px solid var(--border-primary);
  color: var(--text-primary);
}

[data-theme="high-contrast"] .form-control-sm:focus {
  border-color: var(--border-primary);
  box-shadow: 0 0 0 2px var(--border-primary);
}
</style>

<script>
import { ref } from 'vue'
import { useAuthStore } from '../store/auth'
import { useRouter } from 'vue-router'
import { toast } from 'vue3-toastify'
import { getSuccessMessage, getErrorMessage } from '@/i18n'

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
          toast.success(getSuccessMessage('LOGIN_SUCCESS'))
          router.push(authStore.getDashboardRoute())
        } else {
          toast.error(response.error || getErrorMessage('INVALID_LOGIN'))
        }
      } catch (error) {
        console.error('Login error:', error)
        toast.error(error.error || getErrorMessage('LOGIN_ERROR'))
      } finally {
        loading.value = false
      }
    }

    return {
      email,
      password,
      loading,
      handleLogin
    }
  }
}
</script>
