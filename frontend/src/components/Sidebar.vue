<template>
  <div 
    class="sidebar"
    :class="{ 'show': open }"
  >
    <div class="sidebar-header">
      <h5>Menü</h5>
    </div>
    
    <div class="sidebar-body">
      <ul class="nav flex-column">
        <li class="nav-item" v-for="item in menuItems" :key="item.text">
          <router-link 
            :to="item.path" 
            class="nav-link"
            @click="onClose"
          >
            <span class="me-2">{{ item.icon }}</span>
            {{ item.text }}
          </router-link>
        </li>
      </ul>
    </div>
  </div>
</template>

<script>
import { defineComponent, computed } from 'vue'
import { useAuthStore } from '../store/auth'

export default defineComponent({
  name: 'Sidebar',
  props: {
    open: {
      type: Boolean,
      required: true
    },
    onClose: {
      type: Function,
      required: true
    }
  },
  setup(props) {
    const authStore = useAuthStore()

    const menuItems = computed(() => [
      { text: 'Dashboard', icon: '🏠', path: '/dashboard', roles: ['admin', 'user'] },
      { text: 'Diákok', icon: '👥', path: '/students', roles: ['admin', 'user'] },
      { text: 'Szobák', icon: '🛏️', path: '/rooms', roles: ['admin'] },
      { text: 'Jelentések', icon: '📊', path: '/reports', roles: ['admin'] },
    ].filter(item => item.roles.includes(authStore.user?.admin ? 'admin' : 'user')))

    return {
      menuItems
    }
  }
})
</script>

<style scoped>
.sidebar {
  position: fixed;
  top: 0;
  left: 0;
  width: 240px;
  height: 100%;
  background-color: #f8f9fa;
  border-right: 1px solid #dee2e6;
  transform: translateX(-100%);
  transition: transform 0.3s ease-in-out;
  z-index: 1000;
}

.sidebar.show {
  transform: translateX(0);
}

.sidebar-header {
  padding: 20px;
  border-bottom: 1px solid #dee2e6;
  background-color: #fff;
}

.sidebar-header h5 {
  margin: 0;
  font-weight: bold;
}

.sidebar-body {
  padding: 20px;
}

.nav-link {
  color: #333;
  padding: 10px 15px;
  border-radius: 4px;
  text-decoration: none;
  display: flex;
  align-items: center;
  transition: background-color 0.2s;
}

.nav-link:hover {
  background-color: #e9ecef;
  text-decoration: none;
  color: #333;
}

.nav-link.router-link-active {
  background-color: #007bff;
  color: white;
}

/* Mobile styles */
@media (max-width: 991px) {
  .sidebar {
    transform: translateX(-100%);
  }
  
  .sidebar.show {
    transform: translateX(0);
  }
}
</style>