<template>
  <div class="container-fluid">
    <h2>Teszt: Navigáció javítások</h2>
    
    <div class="row">
      <div class="col-12">
        <div class="alert alert-info">
          <h5>✅ Navigáció javítások tesztelése</h5>
          <p>Ez az oldal segít ellenőrizni, hogy a navigációs javítások megfelelően működnek-e:</p>
          <ul>
            <li><strong>Aktív állapot:</strong> A sidebar menüben a jelenlegi oldalnak ki kell emelkednie</li>
            <li><strong>Kenyérmorzsa:</strong> A kenyérmorzsa navigációnak meg kell jelenítenie az aktuális útvonalat</li>
          </ul>
        </div>
      </div>
    </div>

    <div class="row">
      <div class="col-md-6">
        <div class="card">
          <div class="card-header">
            <h6>Admin útvonalak</h6>
          </div>
          <div class="card-body">
            <div class="list-group">
              <router-link to="/dashboard" class="list-group-item list-group-item-action">
                <i class="bi bi-speedometer2 me-2"></i> Admin Dashboard
              </router-link>
              <router-link to="/students" class="list-group-item list-group-item-action">
                <i class="bi bi-people me-2"></i> Diákok
              </router-link>
              <router-link to="/rooms" class="list-group-item list-group-item-action">
                <i class="bi bi-door-open me-2"></i> Szobák
              </router-link>
              <router-link to="/parents" class="list-group-item list-group-item-action">
                <i class="bi bi-person-lines-fill me-2"></i> Szülők
              </router-link>
              <router-link to="/reports" class="list-group-item list-group-item-action">
                <i class="bi bi-file-earmark-bar-graph me-2"></i> Riportok
              </router-link>
            </div>
          </div>
        </div>
      </div>

      <div class="col-md-6">
        <div class="card">
          <div class="card-header">
            <h6>Diák útvonalak</h6>
          </div>
          <div class="card-body">
            <div class="list-group">
              <router-link to="/student-dashboard" class="list-group-item list-group-item-action">
                <i class="bi bi-speedometer2 me-2"></i> Diák Dashboard
              </router-link>
              <router-link to="/student-rooms" class="list-group-item list-group-item-action">
                <i class="bi bi-door-open me-2"></i> Szobám
              </router-link>
              <router-link to="/student-notifications" class="list-group-item list-group-item-action">
                <i class="bi bi-bell me-2"></i> Értesítések
              </router-link>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="row mt-4">
      <div class="col-12">
        <div class="card">
          <div class="card-header">
            <h6>Útvonal információk</h6>
          </div>
          <div class="card-body">
            <div class="row">
              <div class="col-md-6">
                <p><strong>Jelenlegi útvonal:</strong> {{ currentRoute.name }}</p>
                <p><strong>Útvonal path:</strong> {{ currentRoute.path }}</p>
                <p><strong>Útvonal params:</strong> {{ JSON.stringify(currentRoute.params) }}</p>
              </div>
              <div class="col-md-6">
                <p><strong>Kenyérmorzsa elemszám:</strong> {{ breadcrumbs.length }}</p>
                <p><strong>Aktív menüpont:</strong> {{ activeMenuItem }}</p>
                <p><strong>Auth állapot:</strong> {{ authStore.isAuthenticated ? 'Bejelentkezve' : 'Nincs bejelentkezve' }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="row mt-4">
      <div class="col-12">
        <div class="card">
          <div class="card-header">
            <h6>Kenyérmorzsa tesztelése</h6>
          </div>
          <div class="card-body">
            <p>Kattints az alábbi gombokra a kenyérmorzsa viselkedésének teszteléséhez:</p>
            <div class="btn-group-vertical" role="group">
              <button @click="navigateTo('/dashboard')" class="btn btn-outline-primary mb-2">
                Admin Dashboard
              </button>
              <button @click="navigateTo('/students')" class="btn btn-outline-primary mb-2">
                Diákok
              </button>
              <button @click="navigateTo('/student-dashboard')" class="btn btn-outline-success mb-2">
                Diák Dashboard
              </button>
              <button @click="navigateTo('/student-rooms')" class="btn btn-outline-success mb-2">
                Szobám
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../store/auth'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const currentRoute = computed(() => route)
const breadcrumbs = computed(() => {
  // Simple breadcrumb calculation for testing
  const crumbs = []
  if (route.name) {
    const isStudentRoute = route.name.startsWith('Student')
    const homeRoute = isStudentRoute ? 'StudentDashboard' : 'Dashboard'
    
    if (route.name !== homeRoute) {
      crumbs.push({ title: homeRoute, to: isStudentRoute ? '/student-dashboard' : '/dashboard' })
    }
    crumbs.push({ title: route.name, to: route.path })
  }
  return crumbs
})

const activeMenuItem = computed(() => {
  const menuItems = [
    { path: '/dashboard', title: 'Admin Dashboard' },
    { path: '/students', title: 'Diákok' },
    { path: '/rooms', title: 'Szobák' },
    { path: '/parents', title: 'Szülők' },
    { path: '/reports', title: 'Riportok' },
    { path: '/student-dashboard', title: 'Diák Dashboard' },
    { path: '/student-rooms', title: 'Szobám' },
    { path: '/student-notifications', title: 'Értesítések' }
  ]
  
  const currentItem = menuItems.find(item => item.path === route.path)
  return currentItem ? currentItem.title : 'Ismeretlen'
})

const navigateTo = (path) => {
  router.push(path)
}

onMounted(() => {
  // Initialize auth state
  authStore.initializeAuth()
})
</script>

<style scoped>
.list-group-item {
  transition: all 0.3s ease;
}

.list-group-item:hover {
  transform: translateX(4px);
  background-color: var(--bg-tertiary);
}

.card {
  box-shadow: var(--shadow-sm);
  border: 1px solid var(--border-primary);
}

.card-header {
  background-color: var(--bg-tertiary);
  border-bottom: 1px solid var(--border-primary);
}

.btn-group-vertical .btn {
  text-align: left;
  border-radius: 0;
}

.btn-group-vertical .btn:first-child {
  border-top-left-radius: var(--border-radius-md);
  border-top-right-radius: var(--border-radius-md);
}

.btn-group-vertical .btn:last-child {
  border-bottom-left-radius: var(--border-radius-md);
  border-bottom-right-radius: var(--border-radius-md);
}
</style>