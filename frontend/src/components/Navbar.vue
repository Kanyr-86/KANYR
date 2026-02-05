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
        KANYR - Kollégiumi Nyilvántartó
      </a>
      
      <div class="navbar-nav ms-auto" v-if="user">
        <span class="navbar-text me-3">
          {{ user.username }} ({{ user.admin ? 'Admin' : 'Felhasználó' }})
        </span>
        <router-link to="/dashboard" class="nav-link">Dashboard</router-link>
        <button class="btn btn-outline-light" @click="logout">Kijelentkezés</button>
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
  props: {
    onMenuClick: {
      type: Function,
      required: true
    }
  },
  setup(props) {
    const authStore = useAuthStore()
    const router = useRouter()
    
    const user = computed(() => authStore.user)

    const toggleSidebar = () => {
      props.onMenuClick()
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
.navbar-brand {
  font-weight: bold;
}

.navbar-text {
  color: white;
  font-weight: 500;
}
</style>