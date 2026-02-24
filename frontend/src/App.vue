<template>
  <div id="app">
    <Sidebar 
      v-if="!isLoginPage" 
      @sidebar-collapse="handleSidebarCollapse"
    />
    
    <div class="main-content" :class="{ 'sidebar-collapsed': !isLoginPage && isSidebarCollapsed }">
      <ErrorBoundary>
        <router-view />
      </ErrorBoundary>
    </div>

    <!-- Toast notification container -->
    <ToastContainer />
    
    <!-- Global confirmation dialog -->
    <ConfirmDialog />
  </div>
</template>

<script>
import { defineComponent, computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import Sidebar from './components/Sidebar.vue'
import ErrorBoundary from './components/ErrorBoundary.vue'
import ToastContainer from './components/ToastContainer.vue'
import ConfirmDialog from './components/ConfirmDialog.vue'
import { useTheme } from './composables/useTheme'

export default defineComponent({
  name: 'App',
  components: {
    Sidebar,
    ErrorBoundary,
    ToastContainer,
    ConfirmDialog
  },
  setup() {
    const route = useRoute()
    const { initializeTheme } = useTheme()
    
    // Ellenőrizzük, hogy a login oldalon vagyunk-e
    const isLoginPage = computed(() => {
      return route.path === '/login'
    })

    // Sidebar collapse state for main content margin
    const isSidebarCollapsed = ref(false)

    // Handle sidebar collapse events
    const handleSidebarCollapse = (collapsed) => {
      isSidebarCollapsed.value = collapsed
    }

    // Initialize theme on app mount
    onMounted(() => {
      initializeTheme()
    })

    return {
      isLoginPage,
      isSidebarCollapsed,
      handleSidebarCollapse
    }
  }
})
</script>

<style>
/* Sötétebb kék háttérszín - szemkímélő, pihentető */
html, body {
  background-color: #2c4a5a !important;
}

#app {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  max-width: 100vw;
  overflow-x: hidden;
  background-color: #2c4a5a !important;
}

.main-content {
  flex: 1;
  padding: 12px;
  width: 100%;
  box-sizing: border-box;
  background-color: #2c4a5a !important;
}

@media (min-width: 768px) {
  .main-content {
    padding: 24px;
  }
}

body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  overflow-x: hidden;
  background-color: #2c4a5a !important;
}
</style>
