<template>
  <nav class="navbar navbar-expand-lg navbar-dark custom-navbar" role="navigation" aria-label="Fő navigáció">
    <div class="container-fluid">
      
      <a class="navbar-brand" href="#" aria-label="KANYR - Kollégiumi Nyilvántartó kezdőlap">
        <span class="d-none d-sm-inline">KANYR - Kollégiumi Nyilvántartó</span>
        <span class="d-sm-none">KANYR</span>
      </a>
      
      <!-- Hamburger gomb mobilon -->
      <button 
        class="navbar-toggler" 
        type="button" 
        @click="toggleMenu"
        aria-controls="navbarNav"
        :aria-expanded="isMenuOpen"
        aria-label="Navigációs menü váltása"
        v-if="user"
      >
        <span class="navbar-toggler-icon"></span>
      </button>
      
      <div 
        class="collapse navbar-collapse" 
        :class="{ 'show': isMenuOpen }"
        id="navbarNav"
        v-if="user"
      >
        <div class="navbar-nav ms-auto align-items-lg-center">
          <!-- Theme Switcher -->
          <div class="me-lg-3 mb-2 mb-lg-0">
            <ThemeSwitcher />
          </div>
          
          <!-- Notification Bell -->
          <NotificationBell class="me-lg-3 mb-2 mb-lg-0" />
          
          <span class="navbar-text me-lg-3 mb-2 mb-lg-0">
            {{ user.username }} ({{ user.admin ? 'Titkár' : 'Diák' }})
          </span>
          
          <!-- Admin menü -->
          <template v-if="user.admin">
            <router-link 
              to="/dashboard" 
              class="nav-link"
              @click="closeMenu"
            >
              <i class="bi bi-speedometer2 me-1"></i>Admin Dashboard
            </router-link>
            <router-link 
              to="/students" 
              class="nav-link"
              @click="closeMenu"
            >
              <i class="bi bi-people me-1"></i>Diákok
            </router-link>
            <router-link 
              to="/parents" 
              class="nav-link"
              @click="closeMenu"
            >
              <i class="bi bi-person-lines-fill me-1"></i>Szülők
            </router-link>
            <router-link 
              to="/rooms" 
              class="nav-link"
              @click="closeMenu"
            >
              <i class="bi bi-door-closed me-1"></i>Szobák
            </router-link>
            <router-link 
              to="/room-change-requests" 
              class="nav-link"
              @click="closeMenu"
            >
              <i class="bi bi-arrow-left-right me-1"></i>Szobaváltások
            </router-link>
            <router-link 
              to="/reports" 
              class="nav-link"
              @click="closeMenu"
            >
              <i class="bi bi-file-earmark-text me-1"></i>Riportok
            </router-link>
          </template>
          
          <!-- Diák menü -->
          <template v-if="!user.admin">
            <router-link 
              to="/student-dashboard" 
              class="nav-link"
              @click="closeMenu"
            >
              <i class="bi bi-speedometer2 me-1"></i>Diák Dashboard
            </router-link>
            <router-link 
              to="/student-rooms" 
              class="nav-link"
              @click="closeMenu"
            >
              <i class="bi bi-door-closed me-1"></i>Szobám
            </router-link>
            <router-link 
              to="/student-notifications" 
              class="nav-link"
              @click="closeMenu"
            >
              <i class="bi bi-bell me-1"></i>Értesítések
            </router-link>
          </template>
          
          <button 
            class="btn btn-outline-light btn-sm mt-2 mt-lg-0" 
            @click="logout"
            aria-label="Kijelentkezés"
          >
            <i class="bi bi-box-arrow-right me-1"></i>Kijelentkezés
          </button>
        </div>
      </div>
    </div>
  </nav>
</template>

<script>
import { defineComponent, computed, ref } from 'vue'
import { useAuthStore } from '../store/auth'
import { useRouter } from 'vue-router'
import NotificationBell from './NotificationBell.vue'
import ThemeSwitcher from './ThemeSwitcher.vue'

export default defineComponent({
  name: 'Navbar',
  components: {
    NotificationBell,
    ThemeSwitcher
  },
  emits: ['menu-click'],
  setup(props, { emit }) {
    const authStore = useAuthStore()
    const router = useRouter()
    
    const user = computed(() => authStore.user)
    const isMenuOpen = ref(false)

    const toggleMenu = () => {
      isMenuOpen.value = !isMenuOpen.value
    }

    const closeMenu = () => {
      isMenuOpen.value = false
    }

    const logout = () => {
      closeMenu()
      authStore.logout()
      router.push('/login')
    }

    return {
      user,
      logout,
      isMenuOpen,
      toggleMenu,
      closeMenu
    }
  }
})
</script>

<style scoped>
/* Blue Slate háttér a fejlécnek - KANYR téma */
.custom-navbar {
  background-color: var(--navbar-bg, #545e75) !important;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  transition: background-color 0.3s ease;
}

.navbar-brand {
  font-weight: bold;
}

.navbar-text {
  color: white;
  font-weight: 500;
}

/* Hamburger menu button */
.navbar-toggler {
  border: 1px solid rgba(255, 255, 255, 0.5);
  padding: 0.5rem;
}

.navbar-toggler:focus {
  box-shadow: 0 0 0 0.2rem rgba(255, 255, 255, 0.25);
}

.nav-link {
  color: rgba(255, 255, 255, 0.9) !important;
  padding: 0.5rem 1rem;
  border-radius: 0.375rem;
  transition: background-color 0.2s ease, color 0.2s ease;
}

.nav-link:hover {
  color: #ffffff !important;
  background-color: rgba(255, 255, 255, 0.1);
}

.nav-link.router-link-active {
  background-color: rgba(255, 255, 255, 0.15);
  color: #ffffff !important;
}

/* Mobile menu styling */
@media (max-width: 991px) {
  .navbar-collapse {
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    background-color: var(--navbar-bg, #545e75);
    padding: 1rem;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.2);
    z-index: 1000;
    max-height: 80vh;
    overflow-y: auto;
  }
  
  .navbar-nav {
    gap: 0.5rem;
  }
  
  .nav-link {
    padding: 0.75rem 1rem;
    min-height: 44px;
    display: flex;
    align-items: center;
  }
}

/* Dark mode */
[data-theme="dark"] .custom-navbar {
  background-color: var(--navbar-bg, #333d4f) !important;
}

[data-theme="dark"] .navbar-collapse {
  background-color: var(--navbar-bg, #333d4f);
}
</style>
