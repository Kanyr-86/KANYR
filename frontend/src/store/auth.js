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
