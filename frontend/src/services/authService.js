import api from './api'
import { handleApiError } from './api'
import { secureStorage } from './secureStorage'

export const authService = {
  async login(email, password) {
    try {
      const response = await api.post('/auth/login', { email, password })
      if (response.data.success) {
        // Token és felhasználói adatok tárolása biztonságosan
        await secureStorage.setToken(response.data.data.token)
        await secureStorage.setUser(response.data.data.user)
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
      // Biztonságos tároló törlése
      await secureStorage.removeToken()
      await secureStorage.removeUser()
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


  // Ellenőrzi, hogy a felhasználó be van-e jelentkezve
  async isAuthenticated() {
    try {
      const token = await secureStorage.getToken()
      return !!token
    } catch (error) {
      console.error('Authentication check failed:', error)
      return false
    }
  },

  // Aktuális felhasználó lekérdezése a biztonságos tárolóból
  async getCurrentUserFromStorage() {
    try {
      return await secureStorage.getUser()
    } catch (error) {
      console.error('Failed to get user from storage:', error)
      return null
    }
  }
}