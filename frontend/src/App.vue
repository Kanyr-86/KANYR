<template>
  <div id="app">
    <Navbar v-if="!isLoginPage" @menu-click="toggleSidebar" />
    <Sidebar v-if="!isLoginPage" :open="sidebarOpen" @close="toggleSidebar" />
    
    <div
      class="main-content"
      :class="{ 'sidebar-open': sidebarOpen && !isLoginPage }"
    >
      <ErrorBoundary>
        <router-view />
      </ErrorBoundary>
    </div>
  </div>
</template>

<script>
import { defineComponent, ref, onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import Navbar from './components/Navbar.vue'
import Sidebar from './components/Sidebar.vue'
import ErrorBoundary from './components/ErrorBoundary.vue'

export default defineComponent({
  name: 'App',
  components: {
    Navbar,
    Sidebar,
    ErrorBoundary
  },
  setup() {
    const sidebarOpen = ref(false)
    const route = useRoute()
    
    // Ellenőrizzük, hogy a login oldalon vagyunk-e
    const isLoginPage = computed(() => {
      return route.path === '/login'
    })
    
    const toggleSidebar = () => {
      sidebarOpen.value = !sidebarOpen.value
    }

    // Ensure app is mounted only after auth store is initialized
    const appReady = ref(false)
    
    onMounted(() => {
      // Small delay to ensure Pinia store is initialized
      setTimeout(() => {
        appReady.value = true
      }, 100)
    })

    return {
      sidebarOpen,
      toggleSidebar,
      isLoginPage
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
  transition: margin-left 0.3s;
  margin-left: 0;
  width: 100%;
  box-sizing: border-box;
  background-color: #2c4a5a !important;
}

@media (min-width: 768px) {
  .main-content {
    padding: 24px;
  }
}

.main-content.sidebar-open {
  margin-left: 240px;
}

@media (max-width: 991px) {
  .main-content.sidebar-open {
    margin-left: 0;
  }
}

body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  overflow-x: hidden;
  background-color: #2c4a5a !important;
}
</style>
