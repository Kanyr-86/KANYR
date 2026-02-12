<template>
  <nav class="navbar navbar-expand-lg navbar-dark custom-navbar">
    <div class="container-fluid">
      <button 
        class="navbar-toggler" 
        type="button" 
        @click="toggleSidebar"
        aria-controls="sidebar"
        aria-expanded="false"
        aria-label="Toggle navigation"
      >
        <span class="navbar-toggler-icon"></span>
      </button>
      
      <a class="navbar-brand" href="#">
        <span class="d-none d-sm-inline">KANYR - Kollégiumi Nyilvántartó</span>
        <span class="d-sm-none">KANYR</span>
      </a>
      
      <div 
        class="collapse navbar-collapse show" 
        v-if="user"
      >
        <div class="navbar-nav ms-auto align-items-lg-center">
          <span class="navbar-text me-lg-3 mb-2 mb-lg-0">
            {{ user.username }} ({{ user.admin ? 'Admin' : 'Felhasználó' }})
          </span>
          <router-link to="/dashboard" class="nav-link mb-2 mb-lg-0">Dashboard</router-link>
          <button class="btn btn-outline-light btn-sm" @click="logout">Kijelentkezés</button>
        </div>
      </div>
    </div>
  </nav>
</template>

<script>
import { defineComponent, computed } from 'vue'
import { useAuthStore } from '../store/auth'
import { useRouter } from 'vue-router'

export default defineComponent({
  name: 'Navbar',
  emits: ['menu-click'],
  setup(props, { emit }) {
    const authStore = useAuthStore()
    const router = useRouter()
    
    const user = computed(() => authStore.user)

    const toggleSidebar = () => {
      emit('menu-click')
    }

    const logout = () => {
      authStore.logout()
      router.push('/login')
    }

    return {
      user,
      toggleSidebar,
      logout
    }
  }
})
</script>

<style scoped>
/* Élénk kék háttér a fejlécnek */
.custom-navbar {
  background-color: #1e88e5 !important;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.navbar-brand {
  font-weight: bold;
}

.navbar-text {
  color: white;
  font-weight: 500;
}

/* Show menu button on all screen sizes */
.navbar-toggler {
  display: block !important;
}

.nav-link {
  color: rgba(255, 255, 255, 0.9) !important;
}

.nav-link:hover {
  color: #ffffff !important;
}
</style>
