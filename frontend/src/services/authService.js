import api from './api'
import { handleApiError } from './api'

export const authService = {
  async login(email, password) {
    try {
      const response = await api.post('/auth/login', { email, password })
      if (response.data.success) {
        // Store token and user data
        localStorage.setItem('token', response.data.data.token)
        localStorage.setItem('user', JSON.stringify(response.data.data.user))
      }
      return response.data
    } catch (error) {
      const errorData = handleApiError(error)
      throw errorData
    }
  },

  async logout() {
    try {
      await api.post('/auth/logout')
      // Clear local storage
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      return { success: true }
    } catch (error) {
      const errorData = handleApiError(error)
      throw errorData
    }
  },

  async getCurrentUser() {
    try {
      const response = await api.get('/auth/me')
      return response.data
    } catch (error) {
      const errorData = handleApiError(error)
      throw errorData
    }
  },

  async checkAdmin() {
    try {
      const response = await api.get('/auth/check-admin')
      return response.data
    } catch (error) {
      const errorData = handleApiError(error)
      throw errorData
    }
  },

  async getTestAdminToken() {
    try {
      const response = await api.post('/auth/test-admin-token')
      if (response.data.success) {
        // Store token and user data
        localStorage.setItem('token', response.data.data.token)
        localStorage.setItem('user', JSON.stringify({
          userId: response.data.data.userId,
          admin: response.data.data.admin
        }))
      }
      return response.data
    } catch (error) {
      const errorData = handleApiError(error)
      throw errorData
    }
  },

  async getTestUserToken() {
    try {
      const response = await api.post('/auth/test-user-token')
      if (response.data.success) {
        // Store token and user data (non-admin)
        localStorage.setItem('token', response.data.data.token)
        localStorage.setItem('user', JSON.stringify({
          userId: response.data.data.userId,
          admin: response.data.data.admin
        }))
      }
      return response.data
    } catch (error) {
      const errorData = handleApiError(error)
      throw errorData
    }
  },

  // Check if user is authenticated
  isAuthenticated() {
    return !!localStorage.getItem('token')
  },

  // Get current user from localStorage
  getCurrentUserFromStorage() {
    const user = localStorage.getItem('user')
    return user ? JSON.parse(user) : null
  }
}
