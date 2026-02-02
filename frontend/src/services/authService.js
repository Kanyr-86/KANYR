import api from './api'

export const authService = {
  async login(email, password) {
    try {
      const response = await api.post('/auth/login', { email, password })
      return response.data
    } catch (error) {
      throw error.response?.data || error
    }
  },

  async logout() {
    try {
      await api.post('/auth/logout')
      return { success: true }
    } catch (error) {
      throw error.response?.data || error
    }
  },

  async getCurrentUser() {
    try {
      const response = await api.get('/auth/me')
      return response.data
    } catch (error) {
      throw error.response?.data || error
    }
  },

  async checkAdmin() {
    try {
      const response = await api.get('/auth/check-admin')
      return response.data
    } catch (error) {
      throw error.response?.data || error
    }
  },

  async getTestAdminToken() {
    try {
      const response = await api.post('/auth/test-admin-token')
      return response.data
    } catch (error) {
      throw error.response?.data || error
    }
  }
}