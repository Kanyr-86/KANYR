<template>
  <div id="app">
    <!-- Skip link for accessibility -->
    <a href="#main-content" class="skip-link">
      Ugrás a tartalomhoz
    </a>
    
    <Navbar v-if="!isLoginPage" />
    
    <div class="main-content" id="main-content">
      <ErrorBoundary>
        <router-view />
      </ErrorBoundary>
    </div>
  </div>
</template>

<script>
import { defineComponent, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useThemeStore } from './store/theme'
import Navbar from './components/Navbar.vue'
import ErrorBoundary from './components/ErrorBoundary.vue'

export default defineComponent({
  name: 'App',
  components: {
    Navbar,
    ErrorBoundary
  },
  setup() {
    const route = useRoute()
    const themeStore = useThemeStore()
    
    // Ellenőrizzük, hogy a login oldalon vagyunk-e
    const isLoginPage = computed(() => {
      return route.path === '/login'
    })

    // Téma betöltése alkalmazás induláskor
    onMounted(() => {
      themeStore.loadTheme()
    })

    return {
      isLoginPage
    }
  }
})
</script>

<style>
/* App container styles - using CSS variables for theme support */
html, body {
  background-color: var(--app-bg) !important;
}

#app {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  max-width: 100vw;
  overflow-x: hidden;
  background-color: var(--app-bg) !important;
}

.main-content {
  flex: 1;
  padding: 12px;
  width: 100%;
  box-sizing: border-box;
  background-color: var(--app-bg) !important;
}

@media (min-width: 768px) {
  .main-content {
    padding: 24px;
  }
}
</style>
