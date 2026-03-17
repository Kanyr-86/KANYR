import { defineStore } from 'pinia'
import { authService } from '../services/authService'
import { secureStorage } from '../services/secureStorage'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: null,
    user: null,
    isAuthenticated: false,
    loading: false
  }),
  
  // Nincs persist konfiguráció, mivel a secureStorage kezeli a tárolást
  
  getters: {
    // Számított tulajdonságok szerepkör-alapú hozzáféréshez
    isAdmin() {
      return this.user && this.user.admin === true
    },

    isStudent() {
      return this.user && this.user.admin === false
    }
  },
  
  actions: {
    async setToken(token) {
      this.token = token
      this.isAuthenticated = true
      await secureStorage.setToken(token)
    },
    
    async setUser(user) {
      this.user = user
      await secureStorage.setUser(user)
    },
    
    async logout() {
      this.token = null
      this.user = null
      this.isAuthenticated = false
      await secureStorage.removeToken()
      await secureStorage.removeUser()
    },

    // Auth állapot inicializálása biztonságos tárolóból
    async initializeAuth() {
      try {
        const token = await secureStorage.getToken()
        const user = await secureStorage.getUser()
        
        if (token && user) {
          this.token = token
          this.user = user
          this.isAuthenticated = true
          
          // Token érvényességének ellenőrzése
          try {
            const response = await authService.getCurrentUser()
            if (!response.success) {
              await this.logout()
            }
          } catch (error) {
            await this.logout()
          }
        }
      } catch (error) {
        console.error('Auth initialization failed:', error)
        await this.logout()
      }
    },

    // Átirányítás a megfelelő dashboard-ra szerepkör alapján
    getDashboardRoute() {
      if (this.isAdmin) {
        return '/dashboard'
      } else if (this.isStudent) {
        return '/student-dashboard'
      }
      return '/login'
    },

    // Ellenőrzi, hogy a felhasználónak van-e hozzáférése az adott útvonalakhoz
    // MEGJEGYZÉS: a routeName-nek meg kell egyeznie a router/index.js-ben definiált PascalCase nevekkel
    hasAccess(routeName) {
      if (!this.isAuthenticated) {
        return false
      }
      
      switch (routeName) {
        // Csak admin útvonalak (egyezik a router-ből származó PascalCase útvonal nevekkel)
        case 'Dashboard':
        case 'Students':
        case 'Parents':
        case 'Rooms':
        case 'Reports':
          return this.isAdmin
        // Csak diák útvonalak
        case 'StudentDashboard':
        case 'StudentRooms':
        case 'StudentNotifications':
          return this.isStudent
        default:
          return true
      }
    },

    // Bejelentkezési művelet, amely frissíti a store-t
    async login(email, password) {
      this.loading = true
      try {
        const response = await authService.login(email, password)
        if (response.success) {
          await this.setToken(response.data.data.token)
          await this.setUser(response.data.data.user)
          this.isAuthenticated = true
        }
        return response
      } catch (error) {
        await this.logout()
        throw error
      } finally {
        this.loading = false
      }
    },

    // Kijelentkezési művelet, amely frissíti a store-t
    async logoutAction() {
      this.loading = true
      try {
        await authService.logout()
        await this.logout()
      } catch (error) {
        // Még ha a kijelentkezés sikertelen is, töröljük a helyi állapotot
        await this.logout()
      } finally {
        this.loading = false
      }
    }
  }
})
