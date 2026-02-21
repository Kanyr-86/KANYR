import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../store/auth'

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
      path: '/notifications',
      name: 'Notifications',
      component: () => import('../views/StudentNotificationsView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/room-change-requests',
      name: 'RoomChangeRequests',
      component: () => import('../views/RoomChangeRequestsView.vue'),
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
        // Import auth store to check user role
        const authStore = useAuthStore();
        if (authStore.isAuthenticated) {
          return authStore.isAdmin ? '/dashboard' : '/student-dashboard';
        }
        return '/login';
      }
    }
  ]
})

router.beforeEach(async (to, from, next) => {
  // Check if auth store is available (it might not be during initial load)
  let authStore
  try {
    authStore = useAuthStore()
  } catch (e) {
    // If auth store is not available, allow navigation to login page
    if (to.path === '/login') {
      next()
    } else {
      next('/login')
    }
    return
  }
  
  // Initialize auth state if needed
  if (!authStore.user && authStore.isAuthenticated) {
    try {
      await authStore.initializeAuth()
    } catch (e) {
      console.error('Failed to initialize auth:', e)
    }
  }
  
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    next('/login')
  } else if (to.meta.requiresAuth && authStore.isAuthenticated) {
    // Check if user has access to the specific route
    if (!authStore.hasAccess(to.name)) {
      // Redirect to appropriate dashboard based on role
      const dashboardRoute = authStore.isAdmin ? '/dashboard' : '/student-dashboard'
      next(dashboardRoute)
    } else {
      next()
    }
  } else if (to.path === '/' && authStore.isAuthenticated) {
    // Redirect to appropriate dashboard based on role
    const dashboardRoute = authStore.isAdmin ? '/dashboard' : '/student-dashboard'
    next(dashboardRoute)
  } else {
    next()
  }
})

export default router