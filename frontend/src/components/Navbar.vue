<template>
  <nav class="navbar navbar-expand-lg navbar-dark bg-primary">
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
      
      <button 
        class="navbar-toggler ms-auto" 
        type="button" 
        @click="toggleUserMenu"
        aria-label="Toggle user menu"
        v-if="user"
      >
        <span class="navbar-toggler-icon"></span>
      </button>
      
      <div 
        class="collapse navbar-collapse" 
        :class="{ 'show': userMenuOpen }"
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
import { defineComponent, computed, ref } from 'vue'
import { useAuthStore } from '../store/auth'
import { useRouter } from 'vue-router'

export default defineComponent({
  name: 'Navbar',
  emits: ['menu-click'],
  setup(props, { emit }) {
    const authStore = useAuthStore()
    const router = useRouter()
    
    const user = computed(() => authStore.user)
    const userMenuOpen = ref(false)

    const toggleSidebar = () => {
      emit('menu-click')
    }

    const toggleUserMenu = () => {
      userMenuOpen.value = !userMenuOpen.value
    }

    const logout = () => {
      authStore.logout()
      router.push('/login')
    }

    return {
      user,
      userMenuOpen,
      toggleSidebar,
      toggleUserMenu,
      logout
    }
  }
})
</script>

<style scoped>
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
</style>
