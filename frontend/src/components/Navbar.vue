<template>
  <nav class="navbar navbar-expand-lg navbar-dark custom-navbar">
    <div class="container-fluid">
      
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
            {{ user.username }} ({{ user.admin ? 'Titkár' : 'Diák' }})
          </span>
          <router-link 
            v-if="user.admin" 
            to="/dashboard" 
            class="nav-link mb-2 mb-lg-0"
          >
            Admin Dashboard
          </router-link>
          <router-link 
            v-if="user.admin" 
            to="/students" 
            class="nav-link mb-2 mb-lg-0"
          >
            Diákok
          </router-link>
          <router-link 
            v-if="user.admin" 
            to="/parents" 
            class="nav-link mb-2 mb-lg-0"
          >
            Szülők
          </router-link>
          <router-link 
            v-if="user.admin" 
            to="/rooms" 
            class="nav-link mb-2 mb-lg-0"
          >
            Szobák
          </router-link>
          <router-link 
            v-if="user.admin" 
            to="/reports" 
            class="nav-link mb-2 mb-lg-0"
          >
            Riportok
          </router-link>
          <router-link 
            v-if="!user.admin" 
            to="/student-dashboard" 
            class="nav-link mb-2 mb-lg-0"
          >
            Diák Dashboard
          </router-link>
          <router-link 
            v-if="!user.admin" 
            to="/student-rooms" 
            class="nav-link mb-2 mb-lg-0"
          >
            Szobám
          </router-link>
          <router-link 
            v-if="!user.admin" 
            to="/student-notifications" 
            class="nav-link mb-2 mb-lg-0"
          >
            Értesítések
          </router-link>
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

    const logout = () => {
      authStore.logout()
      router.push('/login')
    }

    return {
      user,
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
