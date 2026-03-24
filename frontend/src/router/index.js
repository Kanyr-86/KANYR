import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../store/auth'
import { secureStorage } from '../services/secureStorage'
import { ref } from 'vue'

// Track auth initialization state to prevent race conditions
let authInitializationPromise = null

// Global navigation loading state
export const isRouteLoading = ref(false)

/**
 * Show route loading indicator
 */
export function startRouteLoading() {
  isRouteLoading.value = true
}

/**
 * Hide route loading indicator
 */
export function stopRouteLoading() {
  isRouteLoading.value = false
}

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

/**
 * Guard 1: Auth State Initialization
 * Ensures auth state is initialized before any route access checks
 * Prevents race conditions by tracking initialization promise
 * @param {Object} to - Target route
 * @param {Object} from - Previous route
 * @param {Object} authStore - Auth store instance
 * @returns {Promise<boolean>} - True if initialization completed successfully
 */
async function authInitializationGuard(to, from, authStore) {
  // Check if we have a token in secureStorage (persists across page refreshes)
  // This is the key fix: we check storage, not just the store state which gets wiped on refresh
  const hasStoredToken = await secureStorage.getToken()
  
  // Initialize auth if we have a stored token but store state is not initialized
  // This handles the case where user refreshes the page and store state is reset
  if (hasStoredToken && !authStore.isAuthenticated) {
    // If initialization is already in progress, wait for it
    if (authInitializationPromise) {
      try {
        await authInitializationPromise
        return true
      } catch (error) {
        console.error('Auth initialization failed:', error)
        return false
      }
    }

    // Start new initialization and track it
    authInitializationPromise = authStore.initializeAuth()
      .catch(error => {
        console.error('Failed to initialize auth:', error)
        throw error
      })
      .finally(() => {
        // Clear the promise after completion (success or failure)
        authInitializationPromise = null
      })

    try {
      await authInitializationPromise
      return true
    } catch (error) {
      return false
    }
  }

  return true
}

/**
 * Guard 2: Authentication Check
 * Verifies user is authenticated for protected routes
 * @param {Object} to - Target route
 * @param {Object} authStore - Auth store instance
 * @returns {string|null} - Redirect path if not authenticated, null if allowed
 */
function authenticationGuard(to, authStore) {
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    return '/login'
  }
  return null
}

/**
 * Guard 3: Role-Based Access Control
 * Checks if authenticated user has access to the requested route
 * Supports meta.allowedRoles for declarative role-based access control
 * @param {Object} to - Target route
 * @param {Object} authStore - Auth store instance
 * @returns {string|null} - Redirect path if access denied, null if allowed
 */
function roleAccessGuard(to, authStore) {
  if (to.meta.requiresAuth && authStore.isAuthenticated) {
    // Pass allowedRoles from route meta to hasAccess for declarative RBAC
    const allowedRoles = to.meta.allowedRoles || null
    if (!authStore.hasAccess(to.name, allowedRoles)) {
      // Redirect to appropriate dashboard based on role
      return authStore.getDashboardRoute()
    }
  }
  return null
}

/**
 * Guard 4: Redirect Logic
 * Handles special redirect cases (e.g., root path)
 * @param {Object} to - Target route
 * @param {Object} authStore - Auth store instance
 * @returns {string|null} - Redirect path if needed, null if no redirect
 */
function redirectGuard(to, authStore) {
  // Handle root path redirect based on auth state and role
  if (to.path === '/' && authStore.isAuthenticated) {
    return authStore.getDashboardRoute()
  }

  // Redirect authenticated users away from login page
  if (to.path === '/login' && authStore.isAuthenticated) {
    return authStore.getDashboardRoute()
  }

  return null
}

/**
 * Meta Validation Guard
 * Validates route meta properties before processing
 * @param {Object} to - Target route
 * @returns {boolean} - True if meta is valid
 */
function metaValidationGuard(to) {
  if (to.meta && !validateRouteMeta(to.meta)) {
    console.error(`Navigation to route with invalid meta: ${to.path}`)
    // Allow navigation but log the error - prevents runtime crashes
  }
  return true
}

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/login',
      name: 'Login',
      component: () => import('../views/AuthView.vue'),
      meta: { requiresAuth: false }
    },
    {
      path: '/dashboard',
      name: 'Dashboard',
      component: () => import('../views/DashboardView.vue'),
      meta: { requiresAuth: true, allowedRoles: ['admin'] }
    },
    {
      path: '/students',
      name: 'Students',
      component: () => import('../views/StudentsView.vue'),
      meta: { requiresAuth: true, allowedRoles: ['admin'] }
    },
    {
      path: '/rooms',
      name: 'Rooms',
      component: () => import('../views/RoomsView.vue'),
      meta: { requiresAuth: true, allowedRoles: ['admin'] }
    },
    {
      path: '/parents',
      name: 'Parents',
      component: () => import('../views/ParentsView.vue'),
      meta: { requiresAuth: true, allowedRoles: ['admin'] }
    },
    {
      path: '/reports',
      name: 'Reports',
      component: () => import('../views/ReportsView.vue'),
      meta: { requiresAuth: true, allowedRoles: ['admin'] }
    },
    {
      path: '/notifications',
      name: 'AdminNotifications',
      component: () => import('../views/AdminNotificationsView.vue'),
      meta: { requiresAuth: true, allowedRoles: ['admin'] }
    },
    {
      path: '/student-dashboard',
      name: 'StudentDashboard',
      component: () => import('../views/StudentDashboard.vue'),
      meta: { requiresAuth: true, allowedRoles: ['student'] }
    },
    {
      path: '/student-rooms',
      name: 'StudentRooms',
      component: () => import('../views/StudentRoomsView.vue'),
      meta: { requiresAuth: true, allowedRoles: ['student'] }
    },
    {
      path: '/student-notifications',
      name: 'StudentNotifications',
      component: () => import('../views/StudentNotificationsView.vue'),
      meta: { requiresAuth: true, allowedRoles: ['student'] }
    },
    {
      path: '/',
      name: 'Root',
      redirect: '/login'
    },
    {
      path: '/test-navigation',
      name: 'TestNavigation',
      component: () => import('../views/TestNavigationView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/form-demo',
      name: 'FormEnhancementsDemo',
      component: () => import('../views/FormEnhancementsDemo.vue'),
      meta: { requiresAuth: true, allowedRoles: ['admin'] }
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'NotFound',
      component: () => import('../views/NotFoundView.vue')
    }
  ],
  /**
   * Scroll behavior configuration
   * - Restores saved scroll position when navigating back/forward
   * - Scrolls to top for new navigation
   * - Supports smooth scrolling
   */
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition
    }
    return { top: 0, behavior: 'smooth' }
  }
})

// Validate all routes on router creation
validateAllRoutesMeta(router.options.routes)

/**
 * Navigation guard: Show loading indicator at start of navigation
 */
router.beforeEach((to, from, next) => {
  startRouteLoading()
  next()
})

/**
 * Main navigation guard
 * Composes multiple single-responsibility guards
 * Execution order matters: validation → initialization → auth check → role check → redirects
 */
router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore()

  // Step 1: Validate route meta
  metaValidationGuard(to)

  // Step 2: Ensure auth is initialized (prevents race conditions)
  await authInitializationGuard(to, from, authStore)

  // Step 3: Check authentication
  const authRedirect = authenticationGuard(to, authStore)
  if (authRedirect) {
    return next(authRedirect)
  }

  // Step 4: Check role-based access
  const roleRedirect = roleAccessGuard(to, authStore)
  if (roleRedirect) {
    return next(roleRedirect)
  }

  // Step 5: Handle special redirects
  const redirect = redirectGuard(to, authStore)
  if (redirect) {
    return next(redirect)
  }

  // All checks passed, allow navigation
  next()
})

/**
 * Navigation guard: Hide loading indicator when navigation is complete
 */
router.afterEach(() => {
  stopRouteLoading()
})

/**
 * Navigation guard: Hide loading indicator on navigation error
 */
router.onError(() => {
  stopRouteLoading()
})

export default router
