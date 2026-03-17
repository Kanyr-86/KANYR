<template>
  <div class="not-found-page">
    <div class="not-found-container">
      <div class="card shadow-sm">
        <div class="card-body text-center p-4">
          <div class="error-code">404</div>
          <h1 class="error-title">{{ getErrorMessage('NOT_FOUND_PAGE') }}</h1>
          <p class="error-message">
            {{ getErrorMessage('NOT_FOUND') }}}
          </p>
          <div class="d-grid gap-2 d-md-block mt-4">
            <button
              class="btn btn-primary me-md-2 mb-2 mb-md-0"
              @click="goHome"
            >
              {{ getUILabel('DASHBOARD') }}
            </button>
            <button
              class="btn btn-outline-secondary"
              @click="goBack"
            >
              {{ getUILabel('CANCEL') }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.not-found-page {
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

.not-found-container {
  width: 100%;
  max-width: 500px;
  padding: 1rem;
}

.card {
  border: none;
  border-radius: 8px;
  margin: 0;
  background-color: var(--bg-card);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
}

.card-body {
  padding: 2rem;
}

.error-code {
  font-size: 6rem;
  font-weight: 700;
  color: var(--primary-600);
  line-height: 1;
  margin-bottom: 1rem;
  opacity: 0.8;
}

.error-title {
  font-size: 1.5rem;
  color: var(--text-heading);
  margin-bottom: 1rem;
}

.error-message {
  font-size: 1rem;
  color: var(--text-body);
  margin-bottom: 1.5rem;
}

.btn {
  padding: 0.5rem 1.5rem;
  font-size: 0.95rem;
}

.btn-primary {
  background: linear-gradient(135deg, var(--primary-600), var(--primary-700));
  border: none;
  color: white;
}

.btn-outline-secondary {
  border-color: var(--border-primary);
  color: var(--text-body);
}

.btn-outline-secondary:hover {
  background-color: var(--bg-secondary);
  border-color: var(--border-primary);
  color: var(--text-primary);
}

@media (max-width: 575px) {
  .not-found-container {
    padding: 0.5rem;
    max-width: 100%;
  }

  .card-body {
    padding: 1.5rem;
  }

  .error-code {
    font-size: 4rem;
  }

  .error-title {
    font-size: 1.25rem;
  }

  .btn {
    width: 100%;
  }
}

/* Dark theme overrides */
[data-theme="dark"] .not-found-page {
  background-color: var(--secondary-800);
}

[data-theme="dark"] .card {
  background-color: var(--bg-card);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.6);
}

[data-theme="dark"] .btn-outline-secondary {
  border-color: var(--border-primary);
  color: var(--text-secondary);
}

/* High contrast theme overrides */
[data-theme="high-contrast"] .not-found-page {
  background-color: var(--secondary-800);
}

[data-theme="high-contrast"] .card {
  background-color: var(--bg-card);
  border: 2px solid var(--border-primary);
}
</style>

<script>
import { useRouter } from 'vue-router'
import { getErrorMessage, getUILabel } from '@/i18n'

export default {
  name: 'NotFoundView',
  setup() {
    const router = useRouter()

    const goHome = () => {
      router.push('/')
    }

    const goBack = () => {
      router.back()
    }

    return {
      goHome,
      goBack,
      getErrorMessage,
      getUILabel
    }
  }
}
</script>
