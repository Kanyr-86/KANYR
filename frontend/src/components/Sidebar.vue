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
    <div class="sidebar-brand d-flex align-items-center justify-content-between p-3">
      <div class="d-flex align-items-center">
        <div class="brand-icon me-3">
          <i class="bi bi-building"></i>
        </div>
        <div class="brand-text" v-show="!isCollapsed">
          <h5 class="mb-0">KANYR</h5>
          <small class="text-muted">Kollégiumi Nyilvántartó</small>
        </div>
      </div>
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
          <small class="text-muted">{{ user.admin ? 'Titkár' : 'Diák' }}</small>
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
            >
              <i class="bi bi-bell me-3"></i>
              <span v-show="!isCollapsed">Értesítések</span>
            </router-link>
          </li>
        </template>
      </ul>
    </nav>

    <!-- Logout Section -->
    <div class="sidebar-footer p-3 border-top">
      <button 
        class="btn btn-outline-light w-100 d-flex align-items-center"
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

const authStore = useAuthStore()
const router = useRouter()

// State
const isCollapsed = ref(false)
const isMobileOpen = ref(false)
const windowWidth = ref(window.innerWidth)

// Computed
const user = computed(() => authStore.user)

const sidebarStyles = computed(() => {
  if (windowWidth.value >= 992) {
    // Desktop: use collapse state
    return {
      width: isCollapsed.value ? 'var(--sidebar-collapsed-width)' : 'var(--sidebar-width)'
    }
  } else if (windowWidth.value >= 768) {
    // Tablet: collapsed by default
    return {
      width: 'var(--sidebar-collapsed-width)'
    }
  } else {
    // Mobile: absolute positioned
    return {
      width: isMobileOpen.value ? 'var(--sidebar-width)' : '0'
    }
  }
})

// Emit collapse state to parent for main content margin
const emit = defineEmits(['sidebar-collapse'])

// Watch for collapse state changes and emit to parent
watch(isCollapsed, (newCollapsed) => {
  emit('sidebar-collapse', newCollapsed)
})

// Methods
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

const logout = () => {
  authStore.logout()
  router.push('/login')
}

// Window resize handler
const handleResize = () => {
  windowWidth.value = window.innerWidth
  
  // On desktop, ensure sidebar is visible when window is resized to desktop size
  if (windowWidth.value >= 992) {
    isMobileOpen.value = false
  }
  
  // On tablet, default to collapsed
  if (windowWidth.value >= 768 && windowWidth.value < 992) {
    isCollapsed.value = true
    isMobileOpen.value = false
  }
  
  // On mobile, close sidebar on resize
  if (windowWidth.value < 768) {
    isCollapsed.value = true
  }
}

// Lifecycle
onMounted(() => {
  window.addEventListener('resize', handleResize)
  
  // Set initial state based on screen size
  if (windowWidth.value >= 768 && windowWidth.value < 992) {
    isCollapsed.value = true
  }
  
  // Emit initial collapse state
  emit('sidebar-collapse', isCollapsed.value)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
})
</script>

<style scoped>
.sidebar {
  position: fixed;
  top: 0;
  left: 0;
  height: 100vh;
  background-color: var(--sidebar-bg);
  border-right: 1px solid var(--sidebar-border);
  box-shadow: var(--shadow-xl);
  z-index: 1030;
  transition: width var(--transition-normal), transform 0.3s ease;
  overflow-x: hidden;
}

/* Brand Section */
.sidebar-brand {
  background-color: var(--color-primary);
  color: white;
  min-height: 60px;
}

.brand-icon i {
  font-size: 1.5rem;
  color: white;
}

.brand-text h5 {
  color: white;
  margin-bottom: 0;
}

.brand-text small {
  color: rgba(255, 255, 255, 0.8);
}

/* User Info Section */
.sidebar-user {
  background-color: var(--bg-tertiary);
}

.user-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--color-primary), var(--color-primary-dark));
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 1.1rem;
}

/* Navigation */
.sidebar-nav .nav-link {
  color: var(--text-secondary);
  padding: 12px 16px;
  border-radius: var(--border-radius-sm);
  margin-bottom: 4px;
  transition: all 0.3s ease;
  text-decoration: none;
}

.sidebar-nav .nav-link:hover {
  color: var(--text-primary);
  background-color: var(--sidebar-hover);
  transform: translateX(4px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.sidebar-nav .nav-link.router-link-active {
  color: var(--text-primary);
  background-color: var(--sidebar-hover);
  border-left: 4px solid var(--sidebar-active);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.sidebar-nav .nav-link.collapsed {
  justify-content: center;
  padding: 12px;
}

.sidebar-nav .nav-link.collapsed span {
  display: none;
}

.sidebar-nav .nav-link.collapsed i {
  margin-right: 0;
}

/* Footer */
.sidebar-footer {
  background-color: var(--bg-tertiary);
}

.sidebar-footer .btn {
  border-color: var(--border-primary);
  color: var(--text-secondary);
}

.sidebar-footer .btn:hover {
  background-color: var(--sidebar-hover);
  border-color: var(--border-secondary);
}

/* Mobile Toggle */
.mobile-toggle {
  position: fixed;
  top: 20px;
  left: 20px;
  z-index: var(--z-sticky);
  display: none;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  box-shadow: var(--shadow-lg);
}

.sidebar-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: var(--z-modal-backdrop);
  backdrop-filter: blur(2px);
}

/* Responsive Styles */
@media (max-width: 991.98px) {
  .sidebar {
    position: fixed;
    transform: translateX(-100%);
    transition: transform var(--transition-normal);
  }
  
  .sidebar.sidebar-mobile-open {
    transform: translateX(0);
  }
  
  .mobile-toggle {
    display: flex;
  }
}

@media (max-width: 767.98px) {
  .sidebar {
    width: var(--sidebar-width) !important;
  }
  
  .sidebar.sidebar-mobile-open {
    box-shadow: var(--shadow-xl);
  }
}

@media (min-width: 992px) {
  .sidebar-collapsed {
    width: var(--sidebar-collapsed-width);
  }
  
  .sidebar-collapsed .brand-text {
    display: none;
  }
  
  .sidebar-collapsed .sidebar-user {
    display: none;
  }
  
  .sidebar-collapsed .sidebar-footer {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
  }
}

/* Ensure main content doesn't overlap sidebar */
</style>