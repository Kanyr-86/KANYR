import { defineStore } from 'pinia'
import api from '../services/api'

export const useNotificationStore = defineStore('notifications', {
  state: () => ({
    notifications: [],
    unreadCount: 0,
    loading: false,
    error: null,
    lastFetched: null,
    pollingInterval: null
  }),

  getters: {
    hasUnread: (state) => state.unreadCount > 0,
    recentNotifications: (state) => state.notifications.slice(0, 5),
    unreadNotifications: (state) => state.notifications.filter(n => !n.olvasva),
    notificationsByType: (state) => (tipus) => state.notifications.filter(n => n.tipus === tipus)
  },

  actions: {
    /**
     * Értesítések lekérése
     */
    async fetchNotifications(options = {}) {
      this.loading = true
      this.error = null
      
      try {
        const params = new URLSearchParams()
        if (options.limit) params.append('limit', options.limit)
        if (options.offset) params.append('offset', options.offset)
        if (options.tipus) params.append('tipus', options.tipus)
        if (options.olvasva !== undefined) params.append('olvasva', options.olvasva)

        const response = await api.get(`/ertesitesek?${params.toString()}`)
        
        if (response.data.success) {
          this.notifications = response.data.data
          this.unreadCount = response.data.meta?.unreadCount || 0
          this.lastFetched = new Date()
        }
        
        return response.data
      } catch (error) {
        this.error = error.response?.data?.error || 'Hiba az értesítések lekérésekor'
        console.error('Hiba az értesítések lekérésekor:', error)
        throw error
      } finally {
        this.loading = false
      }
    },

    /**
     * Olvasatlan értesítések számának lekérése
     */
    async fetchUnreadCount() {
      try {
        const response = await api.get('/ertesitesek/unread-count')
        
        if (response.data.success) {
          this.unreadCount = response.data.data.unreadCount
        }
        
        return response.data
      } catch (error) {
        // Ne dobjuk tovább a hibát, csak logoljuk
        // Ez megelőzi a felhasználói felületen megjelenő hibaüzeneteket
        console.error('Hiba az olvasatlan szám lekérésekor:', error.message)
        // Ha 401-es hiba, akkor valószínűleg lejárt a token
        if (error.response?.status === 401) {
          this.stopPolling()
        }
        return { success: false, error: error.message }
      }
    },

    /**
     * Értesítés olvasottnak jelölése
     */
    async markAsRead(notificationId) {
      try {
        const response = await api.put(`/ertesitesek/${notificationId}/read`)
        
        if (response.data.success) {
          // Lokális állapot frissítése
          const notification = this.notifications.find(n => n.notification_id === notificationId)
          if (notification) {
            notification.olvasva = true
          }
          this.unreadCount = Math.max(0, this.unreadCount - 1)
        }
        
        return response.data
      } catch (error) {
        console.error('Hiba az értesítés olvasottnak jelölésekor:', error)
        throw error
      }
    },

    /**
     * Összes értesítés olvasottnak jelölése
     */
    async markAllAsRead() {
      try {
        const response = await api.put('/ertesitesek/read-all')
        
        if (response.data.success) {
          // Lokális állapot frissítése
          this.notifications.forEach(n => n.olvasva = true)
          this.unreadCount = 0
        }
        
        return response.data
      } catch (error) {
        console.error('Hiba az összes értesítés olvasottnak jelölésekor:', error)
        throw error
      }
    },

    /**
     * Értesítés törlése
     */
    async deleteNotification(notificationId) {
      try {
        const response = await api.delete(`/ertesitesek/${notificationId}`)
        
        if (response.data.success) {
          // Lokális állapot frissítése
          const index = this.notifications.findIndex(n => n.notification_id === notificationId)
          if (index !== -1) {
            const notification = this.notifications[index]
            if (!notification.olvasva) {
              this.unreadCount = Math.max(0, this.unreadCount - 1)
            }
            this.notifications.splice(index, 1)
          }
        }
        
        return response.data
      } catch (error) {
        console.error('Hiba az értesítés törlésekor:', error)
        throw error
      }
    },

    /**
     * Polling indítása
     */
    startPolling(intervalMs = 30000) {
      // Meglévő polling leállítása
      this.stopPolling()
      
      // Azonnali első lekérés
      this.fetchUnreadCount()
      
      // Polling beállítása
      this.pollingInterval = setInterval(() => {
        this.fetchUnreadCount()
      }, intervalMs)
      
      console.log('Értesítés polling elindítva:', intervalMs, 'ms')
    },

    /**
     * Polling leállítása
     */
    stopPolling() {
      if (this.pollingInterval) {
        clearInterval(this.pollingInterval)
        this.pollingInterval = null
        console.log('Értesítés polling leállítva')
      }
    },

    /**
     * Store tisztítása (logout esetén)
     */
    clearNotifications() {
      this.stopPolling()
      this.notifications = []
      this.unreadCount = 0
      this.error = null
      this.lastFetched = null
    }
  }
})