import { defineStore } from 'pinia'
import { authService } from '../services/authService'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: null,
    user: null,
    isAuthenticated: false,
    loading: false
  }),
  
  persist: {
    key: 'kanyr-auth',
    storage: localStorage,
    paths: ['token', 'user', 'isAuthenticated']
  },
  
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

    // Auth állapot inicializálása localStorage-ból
    async initializeAuth() {
      if (this.isAuthenticated && this.token) {
        try {
          // Token érvényességének ellenőrzése
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

    // Átirányítás a megfelelő dashboard-ra szerepkör alapján
    getDashboardRoute() {
      if (this.isAdmin) {
        return '/dashboard'
      } else if (this.isStudent) {
        return '/student-dashboard'
      }
      return '/login'
    },

    /**
     * Ellenőrzi, hogy a felhasználónak van-e hozzáférése az adott útvonalakhoz
     * Támogatja a meta.allowedRoles alapú ellenőrzést és a routeName alapú ellenőrzést
     * @param {string} routeName - Az útvonal neve
     * @param {Array} allowedRoles - Opcionális, a route meta.allowedRoles értéke
     * @returns {boolean} - True ha van hozzáférés
     */
    hasAccess(routeName, allowedRoles = null) {
      if (!this.isAuthenticated) {
        return false
      }

      // Ha van explicit allowedRoles, azt ellenőrizzük
      if (allowedRoles && Array.isArray(allowedRoles)) {
        if (allowedRoles.includes('admin') && allowedRoles.includes('student')) {
          return true // Mindkét szerepkörnek engedélyezve van
        }
        if (allowedRoles.includes('admin') && this.isAdmin) {
          return true
        }
        if (allowedRoles.includes('student') && this.isStudent) {
          return true
        }
        return false
      }

      // Fallback: routeName alapú ellenőrzés
      // MEGJEGYZÉS: a routeName-nek meg kell egyeznie a router/index.js-ben definiált PascalCase nevekkel
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

    // Kijelentkezési művelet, amely frissíti a store-t
    async logoutAction() {
      this.loading = true
      try {
        await authService.logout()
        this.logout()
      } catch (error) {
        // Még ha a kijelentkezés sikertelen is, töröljük a helyi állapotot
        this.logout()
      } finally {
        this.loading = false
      }
    }
  }
})
