import { createRouter, createWebHistory } from 'vue-router'

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
    }
  ]
})

router.beforeEach(async (to, from, next) => {
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