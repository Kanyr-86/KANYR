<template>
  <div id="app">
    <Navbar v-if="!isLoginPage" />
    
    <div class="main-content">
      <ErrorBoundary>
        <router-view />
      </ErrorBoundary>
    </div>
  </div>
</template>

<script>
import { defineComponent, computed } from 'vue'
import { useRoute } from 'vue-router'
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
    
    // Ellenőrizzük, hogy a login oldalon vagyunk-e
    const isLoginPage = computed(() => {
      return route.path === '/login'
    })

    return {
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
