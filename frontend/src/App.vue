<template>
  <div id="app">
    <Navbar @menu-click="toggleSidebar" />
    <Sidebar :open="sidebarOpen" @close="toggleSidebar" />
    
    <div
      class="main-content"
      :class="{ 'sidebar-open': sidebarOpen }"
    >
      <ErrorBoundary>
        <router-view />
      </ErrorBoundary>
    </div>
  </div>
</template>

<script>
import { defineComponent, ref } from 'vue'
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
    
    const toggleSidebar = () => {
      sidebarOpen.value = !sidebarOpen.value
    }

    return {
      sidebarOpen,
      toggleSidebar
    }
  }
})
</script>

<style>
#app {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.main-content {
  flex: 1;
  padding: 24px;
  transition: margin-left 0.3s;
  margin-left: 0;
}

.main-content.sidebar-open {
  margin-left: 240px;
}

body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
}
</style>