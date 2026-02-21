import { defineStore } from 'pinia'
import { authService } from '../services/authService'

export const useAuthStore = defineStore('auth', {
  state: () => {
    let user = null
    try {
      const userData = localStorage.getItem('user')
      if (userData) {
        user = JSON.parse(userData)
      }
    } catch (e) {
      console.error('Error parsing user data from localStorage:', e)
      localStorage.removeItem('user')
    }
    
    return {
      token: localStorage.getItem('token'),
      user: user,
      isAuthenticated: !!localStorage.getItem('token'),
      loading: false
    }
  },
  
  getters: {
    // Computed properties for role-based access
    isAdmin() {
      return this.user && this.user.admin === true
    },

    isStudent() {
      return this.user && this.user.admin === false
    }
  },
  
  actions: {
    setToken(token) {
      this.token = token
      this.isAuthenticated = true
      localStorage.setItem('token', token)
    },
    
    setUser(user) {
      this.user = user
      localStorage.setItem('user', JSON.stringify(user))
    },
    
    logout() {
      this.token = null
      this.user = null
      this.isAuthenticated = false
      localStorage.removeItem('token')
      localStorage.removeItem('user')
    },

    // Initialize auth state from localStorage
    async initializeAuth() {
      if (this.isAuthenticated && this.user) {
        try {
          // Verify token is still valid
          const response = await authService.getCurrentUser()
          if (response.success) {
            this.setUser(response.data.user)
          } else {
            this.logout()
          }
        } catch (error) {
          this.logout()
        }
      }
    },

    // Redirect to appropriate dashboard based on role
    getDashboardRoute() {
      if (this.isAdmin) {
        return '/dashboard'
      } else if (this.isStudent) {
        return '/student-dashboard'
      }
      return '/login'
    },

    // Check if user has access to specific routes
    // NOTE: routeName must match the PascalCase names defined in router/index.js
    hasAccess(routeName) {
      if (!this.isAuthenticated) {
        return false
      }
      
      switch (routeName) {
        // Admin-only routes (match PascalCase route names from router)
        case 'Dashboard':
        case 'Students':
        case 'Parents':
        case 'Rooms':
        case 'Reports':
        case 'RoomChangeRequests':
          return this.isAdmin
        // Shared routes (both admin and student)
        case 'Notifications':
          return this.isAuthenticated
        // Student-only routes
        case 'StudentDashboard':
        case 'StudentRooms':
        case 'StudentNotifications':
          return this.isStudent
        default:
          return true
      }
    },

    // Login action that updates store
    async login(email, password) {
      this.loading = true
      try {
        const response = await authService.login(email, password)
        if (response.success) {
          this.setToken(response.data.token)
          this.setUser(response.data.user)
          this.isAuthenticated = true
        }
        return response
      } catch (error) {
        this.logout()
        throw error
      } finally {
        this.loading = false
      }
    },

    // Logout action that updates store
    async logoutAction() {
      this.loading = true
      try {
        await authService.logout()
        this.logout()
      } catch (error) {
        // Even if logout fails, clear local state
        this.logout()
      } finally {
        this.loading = false
      }
    }
  }
})
