<template>
  <div id="app">
    <Sidebar 
      v-if="!isLoginPage" 
      @sidebar-collapse="handleSidebarCollapse"
    />
    
    <div class="main-content" :class="{ 'sidebar-expanded': !isSidebarCollapsed }">
      <ErrorBoundary>
        <router-view />
      </ErrorBoundary>
    </div>

    <!-- Toast notification container -->
    <ToastContainer />
    
    <!-- Global confirmation dialog -->
    <ConfirmDialog />
    
    <!-- Route loading indicator -->
    <LoadingOverlay :show="isRouteLoading" message="Loading..." :opacity="0.3" />
  </div>
</template>

<script>
import { defineComponent, computed, onMounted, ref, defineAsyncComponent } from 'vue'
import { useRoute } from 'vue-router'
import { useTheme } from './composables/useTheme'
import { isRouteLoading } from './router'
import LoadingOverlay from './components/LoadingOverlay.vue'

// Lazy load global components
const Sidebar = defineAsyncComponent(() => import('./components/Sidebar.vue'))
const ErrorBoundary = defineAsyncComponent(() => import('./components/ErrorBoundary.vue'))
const ToastContainer = defineAsyncComponent(() => import('./components/ToastContainer.vue'))
const ConfirmDialog = defineAsyncComponent(() => import('./components/ConfirmDialog.vue'))

export default defineComponent({
  name: 'App',
  components: {
    Sidebar,
    ErrorBoundary,
    ToastContainer,
    ConfirmDialog,
    LoadingOverlay
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
      // collapsed = true means sidebar is collapsed (small)
      // collapsed = false means sidebar is expanded (large)
      isSidebarCollapsed.value = collapsed
    }

    // Initialize theme on app mount
    onMounted(() => {
      initializeTheme()
    })

    return {
      isLoginPage,
      isSidebarCollapsed,
      handleSidebarCollapse,
      isRouteLoading
    }
  }
})
</script>

<style>
html, body {
  background-color: var(--bg-page) !important;
  margin: 0;
  padding: 0;
}

#app {
  display: flex;
  min-height: 100vh;
  width: 100%;
}

.main-content {
  flex: 1;
  min-height: 100vh;
  padding: 24px;
  margin-left: 64px;
  transition: margin-left 0.3s ease;
  background-color: var(--bg-page);
}

.main-content.sidebar-expanded {
  margin-left: 250px;
}

@media (max-width: 991.98px) {
  .main-content {
    margin-left: 0 !important;
    padding: 16px;
  }
}

@media (max-width: 767.98px) {
  .main-content {
    padding: 12px;
  }
}
</style>
