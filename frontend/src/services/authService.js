import api from './api'
import { handleApiError } from './api'

export const authService = {
  async login(email, password) {
    try {
      const response = await api.post('/auth/login', { email, password })
      if (response.data.success) {
        // Token és felhasználói adatok tárolása
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
      // Local storage törlése
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


  // Ellenőrzi, hogy a felhasználó be van-e jelentkezve
  isAuthenticated() {
    return !!localStorage.getItem('token')
  },

  // Aktuális felhasználó lekérdezése a localStorage-ból
  getCurrentUserFromStorage() {
    const user = localStorage.getItem('user')
    return user ? JSON.parse(user) : null
  }
}