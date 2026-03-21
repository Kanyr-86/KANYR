<template>
  <div 
    class="sidebar d-flex flex-column"
    :class="[
      { 'sidebar-collapsed': isCollapsed },
      { 'sidebar-mobile-open': isMobileOpen }
    ]"
    :style="sidebarStyles"
  >
    <!-- Brand/Logo Section -->
    <div class="sidebar-brand d-flex align-items-center p-3">
      <button 
        class="btn btn-outline-light btn-sm d-none d-lg-inline-flex"
        @click="toggleSidebar"
        v-show="!isMobileOpen"
      >
        <i class="bi" :class="isCollapsed ? 'bi-list' : 'bi-x-lg'"></i>
      </button>
    </div>

    <!-- User Info Section -->
    <div class="sidebar-user p-3 border-top border-bottom" v-if="user">
      <div class="d-flex align-items-center">
        <div class="user-avatar me-3">
          {{ getUserInitial(user.username) }}
        </div>
        <div class="user-info flex-grow-1">
          <div class="fw-semibold">{{ user.username }}</div>
<small style="color: var(--text-muted)">{{ user.admin ? 'Titkár' : 'Diák' }}</small>
        </div>
      </div>
    </div>

    <!-- Navigation Links -->
    <nav class="sidebar-nav flex-grow-1 py-3">
      <ul class="nav flex-column">
        <!-- Admin Navigation -->
        <template v-if="user && user.admin">
          <li class="nav-item">
            <router-link 
              to="/dashboard" 
              class="nav-link d-flex align-items-center"
              :class="{ 'collapsed': isCollapsed }"
              active-class="active"
              exact-active-class="exact-active"
            >
              <i class="bi bi-speedometer2 me-3"></i>
              <span v-show="!isCollapsed">Admin Dashboard</span>
            </router-link>
          </li>
          <li class="nav-item">
            <router-link 
              to="/students" 
              class="nav-link d-flex align-items-center"
              :class="{ 'collapsed': isCollapsed }"
              active-class="active"
              exact-active-class="exact-active"
            >
              <i class="bi bi-people me-3"></i>
              <span v-show="!isCollapsed">Diákok</span>
            </router-link>
          </li>
          <li class="nav-item">
            <router-link 
              to="/parents" 
              class="nav-link d-flex align-items-center"
              :class="{ 'collapsed': isCollapsed }"
              active-class="active"
              exact-active-class="exact-active"
            >
              <i class="bi bi-person-lines-fill me-3"></i>
              <span v-show="!isCollapsed">Szülők</span>
            </router-link>
          </li>
          <li class="nav-item">
            <router-link 
              to="/rooms" 
              class="nav-link d-flex align-items-center"
              :class="{ 'collapsed': isCollapsed }"
              active-class="active"
              exact-active-class="exact-active"
            >
              <i class="bi bi-door-open me-3"></i>
              <span v-show="!isCollapsed">Szobák</span>
            </router-link>
          </li>
          <li class="nav-item">
            <router-link 
              to="/reports" 
              class="nav-link d-flex align-items-center"
              :class="{ 'collapsed': isCollapsed }"
              active-class="active"
              exact-active-class="exact-active"
            >
              <i class="bi bi-file-earmark-bar-graph me-3"></i>
              <span v-show="!isCollapsed">Riportok</span>
            </router-link>
          </li>
        </template>

        <!-- Student Navigation -->
        <template v-else-if="user && !user.admin">
          <li class="nav-item">
            <router-link 
              to="/student-dashboard" 
              class="nav-link d-flex align-items-center"
              :class="{ 'collapsed': isCollapsed }"
              active-class="active"
              exact-active-class="exact-active"
            >
              <i class="bi bi-speedometer2 me-3"></i>
              <span v-show="!isCollapsed">Diák Dashboard</span>
            </router-link>
          </li>
          <li class="nav-item">
            <router-link 
              to="/student-rooms" 
              class="nav-link d-flex align-items-center"
              :class="{ 'collapsed': isCollapsed }"
              active-class="active"
              exact-active-class="exact-active"
            >
              <i class="bi bi-door-open me-3"></i>
              <span v-show="!isCollapsed">Szobám</span>
            </router-link>
          </li>
          <li class="nav-item">
            <router-link 
              to="/student-notifications" 
              class="nav-link d-flex align-items-center"
              :class="{ 'collapsed': isCollapsed }"
              active-class="active"
              exact-active-class="exact-active"
            >
              <i class="bi bi-bell me-3"></i>
              <span v-show="!isCollapsed">Értesítések</span>
            </router-link>
          </li>
        </template>
      </ul>
    </nav>

    <!-- Theme Toggle Section -->
    <div class="sidebar-theme p-3 border-top">
      <ThemeToggle :collapsed="isCollapsed" />
    </div>

    <!-- Logout Section -->
    <div class="sidebar-footer p-3 border-top">
      <button 
        class="btn btn-outline-secondary w-100 d-flex align-items-center"
        @click="logout"
      >
        <i class="bi bi-box-arrow-right me-3"></i>
        <span v-show="!isCollapsed">Kijelentkezés</span>
      </button>
    </div>

    <!-- Mobile Toggle Button -->
    <button 
      class="btn btn-primary btn-sm d-lg-none mobile-toggle"
      @click="toggleMobileSidebar"
    >
      <i class="bi" :class="isMobileOpen ? 'bi-x-lg' : 'bi-list'"></i>
    </button>

    <!-- Mobile Backdrop -->
    <div 
      class="sidebar-backdrop" 
      v-if="isMobileOpen" 
      @click="closeMobileSidebar"
    ></div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useAuthStore } from '../store/auth'
import { useRouter } from 'vue-router'
import { useThemeStore } from '../store/theme'
import ThemeToggle from './ThemeToggle.vue'

const authStore = useAuthStore()
const router = useRouter()
const themeStore = useThemeStore()

// State
const isCollapsed = ref(false)
const isMobileOpen = ref(false)
const windowWidth = ref(window.innerWidth)

// Memoized computed properties for better performance
const user = computed(() => authStore.user)
const isDark = computed(() => themeStore.isDark)

// Debounced resize handler to prevent excessive calculations
let resizeTimeout = null
const debouncedHandleResize = () => {
  if (resizeTimeout) {
    clearTimeout(resizeTimeout)
  }
  resizeTimeout = setTimeout(() => {
    windowWidth.value = window.innerWidth
    
    // Optimize resize logic
    const width = windowWidth.value
    
    if (width >= 992) {
      // Desktop: ensure sidebar is visible when window is resized to desktop size
      isMobileOpen.value = false
    } else if (width >= 768 && width < 992) {
      // Tablet: default to collapsed
      isCollapsed.value = true
      isMobileOpen.value = false
    } else {
      // Mobile: close sidebar on resize
      isCollapsed.value = true
    }
  }, 100) // 100ms debounce
}

const sidebarStyles = computed(() => {
  const width = windowWidth.value
  const collapsed = isCollapsed.value
  const mobileOpen = isMobileOpen.value
  
  if (width >= 992) {
    // Desktop: use collapse state
    return {
      width: collapsed ? 'var(--sidebar-collapsed-width)' : 'var(--sidebar-width)'
    }
  } else if (width >= 768) {
    // Tablet: collapsed by default
    return {
      width: 'var(--sidebar-collapsed-width)'
    }
  } else {
    // Mobile: absolute positioned
    return {
      width: mobileOpen ? 'var(--sidebar-width)' : '0'
    }
  }
})

// Memoized navigation items to prevent re-creation
const adminNavigation = [
  { path: '/dashboard', icon: 'bi-speedometer2', label: 'Admin Dashboard' },
  { path: '/students', icon: 'bi-people', label: 'Diákok' },
  { path: '/parents', icon: 'bi-person-lines-fill', label: 'Szülők' },
  { path: '/rooms', icon: 'bi-door-open', label: 'Szobák' },
  { path: '/reports', icon: 'bi-file-earmark-bar-graph', label: 'Riportok' }
]

const studentNavigation = [
  { path: '/student-dashboard', icon: 'bi-speedometer2', label: 'Diák Dashboard' },
  { path: '/student-rooms', icon: 'bi-door-open', label: 'Szobám' },
  { path: '/student-notifications', icon: 'bi-bell', label: 'Értesítések' }
]

// Emit collapse state to parent for main content margin
const emit = defineEmits(['sidebar-collapse'])

// Watch for collapse state changes and emit to parent
watch(isCollapsed, (newCollapsed) => {
  emit('sidebar-collapse', newCollapsed)
})

// Memoized methods for better performance
const getUserInitial = (username) => {
  return username ? username.charAt(0).toUpperCase() : 'U'
}

const toggleSidebar = () => {
  if (windowWidth.value >= 992) {
    isCollapsed.value = !isCollapsed.value
  }
}

const toggleMobileSidebar = () => {
  isMobileOpen.value = !isMobileOpen.value
}

const closeMobileSidebar = () => {
  isMobileOpen.value = false
}

const logout = async () => {
  try {
    await authStore.logout()
    router.push('/login')
  } catch (error) {
    console.error('Logout failed:', error)
  }
}

const toggleTheme = () => {
  themeStore.toggleTheme()
}

// Lifecycle
onMounted(() => {
  window.addEventListener('resize', debouncedHandleResize)
  
  // Set initial state based on screen size
  const width = windowWidth.value
  if (width >= 768 && width < 992) {
    isCollapsed.value = true
  }
  
  // Emit initial collapse state
  emit('sidebar-collapse', isCollapsed.value)
})

onUnmounted(() => {
  window.removeEventListener('resize', debouncedHandleResize)
  if (resizeTimeout) {
    clearTimeout(resizeTimeout)
  }
})
</script>

<style scoped>
/* Sidebar component styles moved to frontend/src/styles/components/sidebar.css */
</style>
