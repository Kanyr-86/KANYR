import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../store/auth'

/**
 * Route meta property validator
 * Ensures all route meta properties are valid to prevent runtime errors
 * @param {Object} meta - Route meta object
 * @returns {boolean} - True if meta is valid
 */
function validateRouteMeta(meta) {
  if (!meta || typeof meta !== 'object') return true // No meta is valid

  // Validate requiresAuth - must be boolean if present
  if (meta.requiresAuth !== undefined && typeof meta.requiresAuth !== 'boolean') {
    console.warn(`Route meta validation error: 'requiresAuth' must be a boolean, got ${typeof meta.requiresAuth}`)
    return false
  }

  // Validate allowedRoles - must be array if present
  if (meta.allowedRoles !== undefined && !Array.isArray(meta.allowedRoles)) {
    console.warn(`Route meta validation error: 'allowedRoles' must be an array, got ${typeof meta.allowedRoles}`)
    return false
  }

  // Validate title - must be string if present
  if (meta.title !== undefined && typeof meta.title !== 'string') {
    console.warn(`Route meta validation error: 'title' must be a string, got ${typeof meta.title}`)
    return false
  }

  return true
}

/**
 * Validate all routes meta properties
 * @param {Array} routes - Array of route objects
 */
function validateAllRoutesMeta(routes) {
  const validateRoute = (route) => {
    if (route.meta && !validateRouteMeta(route.meta)) {
      console.error(`Invalid meta in route: ${route.path || route.name || 'unnamed'}`)
    }
    // Validate children recursively
    if (route.children) {
      route.children.forEach(validateRoute)
    }
  }
  routes.forEach(validateRoute)
}

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/login',
      name: 'Login',
      component: () => import('../views/AuthView.vue')
    },
    {
      path: '/dashboard',
      name: 'Dashboard',
      component: () => import('../views/DashboardView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/students',
      name: 'Students',
      component: () => import('../views/StudentsView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/rooms',
      name: 'Rooms',
      component: () => import('../views/RoomsView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/parents',
      name: 'Parents',
      component: () => import('../views/ParentsView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/reports',
      name: 'Reports',
      component: () => import('../views/ReportsView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/student-dashboard',
      name: 'StudentDashboard',
      component: () => import('../views/StudentDashboard.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/student-rooms',
      name: 'StudentRooms',
      component: () => import('../views/StudentRoomsView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/student-notifications',
      name: 'StudentNotifications',
      component: () => import('../views/StudentNotificationsView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/',
      redirect: (to) => {
        // Auth store importálása a felhasználói szerepkör ellenőrzéséhez
        const authStore = useAuthStore();
        if (authStore.isAuthenticated) {
          return authStore.isAdmin ? '/dashboard' : '/student-dashboard';
        }
        return '/login';
      }
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'NotFound',
      component: () => import('../views/NotFoundView.vue')
    }
  ]
})

// Validate all routes on router creation
validateAllRoutesMeta(router.options.routes)

router.beforeEach(async (to, from, next) => {
  // Validate route meta before processing
  if (to.meta && !validateRouteMeta(to.meta)) {
    console.error(`Navigation to route with invalid meta: ${to.path}`)
    // Allow navigation but log the error - prevents runtime crashes
  }

  // Auth store importálása - most már biztonságosan használható
  const authStore = useAuthStore()
  
  // Auth állapot inicializálása, ha szükséges
  if (!authStore.user && authStore.isAuthenticated && authStore.token) {
    try {
      await authStore.initializeAuth()
    } catch (e) {
      console.error('Failed to initialize auth:', e)
    }
  }
  
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    next('/login')
  } else if (to.meta.requiresAuth && authStore.isAuthenticated) {
    // Ellenőrizzük, hogy a felhasználónak van-e hozzáférése az adott útvonalhoz
    if (!authStore.hasAccess(to.name)) {
      // Átirányítás a megfelelő dashboard-ra szerepkör alapján
      const dashboardRoute = authStore.isAdmin ? '/dashboard' : '/student-dashboard'
      next(dashboardRoute)
    } else {
      next()
    }
  } else if (to.path === '/' && authStore.isAuthenticated) {
    // Átirányítás a megfelelő dashboard-ra szerepkör alapján
    const dashboardRoute = authStore.isAdmin ? '/dashboard' : '/student-dashboard'
    next(dashboardRoute)
  } else {
    next()
  }
})

export default router