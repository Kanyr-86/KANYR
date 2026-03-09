<template>
  <div class="notification-inbox">
    <div class="card">
      <div class="card-header d-flex justify-content-between align-items-center">
        <h5 class="mb-0">
          <i class="bi bi-envelope me-2"></i>
          Értesítések
        </h5>
        <div class="d-flex align-items-center">
          <span class="badge bg-primary me-2">{{ unreadCount }} olvasatlan</span>
          <button 
            v-if="unreadCount > 0" 
            @click="debouncedMarkAllAsRead" 
            class="btn btn-sm btn-outline-primary"
            :disabled="markingAllAsRead"
          >
            <span v-if="markingAllAsRead" class="spinner-border spinner-border-sm me-2" role="status"></span>
            Összes olvasottnak jelölése
          </button>
        </div>
      </div>
      <div class="card-body">
        <div v-if="loading" class="text-center py-4">
          <div class="spinner-border text-primary" role="status">
            <span class="visually-hidden">Loading...</span>
          </div>
        </div>
        
        <div v-else-if="notifications.length === 0" class="text-center text-muted py-4">
          <i class="bi bi-envelope-open" style="font-size: 2rem;"></i>
          <p class="mt-2 mb-0">Nincsenek értesítések</p>
        </div>
        
        <div v-else>
          <div class="list-group list-group-flush">
            <div 
              v-for="notification in visibleNotifications" 
              :key="notification.notification_id"
              class="list-group-item list-group-item-action"
              :class="{ 'unread': !notification.elolvasva }"
              @click="debouncedMarkAsRead(notification)"
            >
              <div class="d-flex w-100 justify-content-between">
                <h6 class="mb-1">
                  <span :class="getNotificationIconClass(notification.tipus)">
                    {{ getNotificationTypeText(notification.tipus) }}
                  </span>
                </h6>
                <small class="text-muted">{{ formatDate(notification.created_at) }}</small>
              </div>
              <p class="mb-1">{{ notification.uzenet }}</p>
              <div v-if="notification.diak" class="text-muted small">
                <i class="bi bi-person"></i> {{ notification.diak.nev }}
                <span v-if="notification.diak.email"> • {{ notification.diak.email }}</span>
              </div>
              <div v-if="notification.szoba_valtoztatas" class="text-muted small mt-1">
                <i class="bi bi-door-closed"></i> 
                Szoba: {{ notification.szoba_valtoztatas.jelenlegi_szoba?.szoba_szama }} 
                → {{ notification.szoba_valtoztatas.kivant_szoba?.szoba_szama }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, computed, onUnmounted, watch } from 'vue'
import { toast } from 'vue3-toastify'
import api from '../services/api'

export default {
  name: 'NotificationInbox',
  setup() {
    const notifications = ref([])
    const loading = ref(false)
    const markingAllAsRead = ref(false)
    const lastFetchTime = ref(0)

    // Memoized computed properties for better performance
    const unreadCount = computed(() => {
      return notifications.value.filter(n => !n.elolvasva).length
    })

    // Limit visible notifications to prevent rendering too many items
    const visibleNotifications = computed(() => {
      return notifications.value.slice(0, 50) // Show only first 50 notifications
    })

    // Memoized notification type mappings
    const notificationTypeMap = {
      'room_change_approved': 'Szobaváltás jóváhagyva',
      'room_change_denied': 'Szobaváltás elutasítva',
      'room_change_pending': 'Szobaváltás függőben'
    }

    const notificationIconMap = {
      'room_change_approved': 'badge bg-success',
      'room_change_denied': 'badge bg-danger',
      'room_change_pending': 'badge bg-warning'
    }

    // Debounced functions to prevent excessive API calls
    let fetchTimeout = null
    let markReadTimeout = null
    let markAllTimeout = null

    const debouncedFetchNotifications = () => {
      if (fetchTimeout) {
        clearTimeout(fetchTimeout)
      }
      fetchTimeout = setTimeout(fetchNotifications, 300) // 300ms debounce
    }

    const debouncedMarkAsRead = (notification) => {
      if (notification.elolvasva) return

      if (markReadTimeout) {
        clearTimeout(markReadTimeout)
      }
      markReadTimeout = setTimeout(() => markAsRead(notification), 100) // 100ms debounce
    }

    const debouncedMarkAllAsRead = () => {
      if (markAllTimeout) {
        clearTimeout(markAllTimeout)
      }
      markAllTimeout = setTimeout(markAllAsRead, 200) // 200ms debounce
    }

    const fetchNotifications = async () => {
      // Prevent fetching too frequently (throttling)
      const now = Date.now()
      if (now - lastFetchTime.value < 5000) return // Don't fetch more than once every 5 seconds

      loading.value = true
      lastFetchTime.value = now
      
      try {
        const response = await api.get('/room-changes/admin/notifications')
        if (response.data.success) {
          notifications.value = response.data.data
        } else {
          toast.error(response.data.error || 'Hiba az értesítések lekérésekor')
        }
      } catch (error) {
        console.error('Hiba az értesítések lekérésekor:', error)
        toast.error('Nem sikerült betölteni az értesítéseket')
      } finally {
        loading.value = false
      }
    }

    const markAsRead = async (notification) => {
      if (notification.elolvasva) return

      try {
        const response = await api.put(`/szobavaltoztatas/admin/notifications/${notification.notification_id}/read`)
        if (response.data.success) {
          notification.elolvasva = true
        } else {
          toast.error(response.data.error || 'Hiba az értesítés olvasottnak jelölésekor')
        }
      } catch (error) {
        console.error('Hiba az értesítés olvasottnak jelölésekor:', error)
        toast.error('Nem sikerült olvasottnak jelölni az értesítést')
      }
    }

    const markAllAsRead = async () => {
      markingAllAsRead.value = true
      try {
        const unreadNotifications = notifications.value.filter(n => !n.elolvasva)
        
        // Use Promise.all for better performance when marking multiple notifications
        await Promise.all(
          unreadNotifications.map(async (notification) => {
            await api.put(`/room-changes/admin/notifications/${notification.notification_id}/read`)
            notification.elolvasva = true
          })
        )
        
        toast.success('Összes értesítés olvasottnak jelölve')
      } catch (error) {
        console.error('Hiba az összes értesítés olvasottnak jelölésekor:', error)
        toast.error('Nem sikerült olvasottnak jelölni az összes értesítést')
      } finally {
        markingAllAsRead.value = false
      }
    }

    // Memoized functions for better performance
    const getNotificationTypeText = (type) => {
      return notificationTypeMap[type] || 'Értesítés'
    }

    const getNotificationIconClass = (type) => {
      return notificationIconMap[type] || 'badge bg-secondary'
    }

    // Cached date formatter to avoid recreating options object
    const dateFormatter = new Intl.DateTimeFormat('hu-HU', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })

    const formatDate = (dateString) => {
      try {
        return dateFormatter.format(new Date(dateString))
      } catch {
        return dateString
      }
    }

    // Auto-refresh notifications every 30 seconds
    let refreshInterval = null
    const startAutoRefresh = () => {
      refreshInterval = setInterval(() => {
        if (!loading.value) {
          debouncedFetchNotifications()
        }
      }, 30000) // 30 seconds
    }

    const stopAutoRefresh = () => {
      if (refreshInterval) {
        clearInterval(refreshInterval)
        refreshInterval = null
      }
    }

    // Watch for changes and trigger re-renders only when necessary
    watch(() => notifications.value.length, (newLength, oldLength) => {
      if (newLength !== oldLength) {
        // Only trigger updates when the count actually changes
      }
    })

    onMounted(() => {
      fetchNotifications()
      startAutoRefresh()
    })

    onUnmounted(() => {
      stopAutoRefresh()
      if (fetchTimeout) clearTimeout(fetchTimeout)
      if (markReadTimeout) clearTimeout(markReadTimeout)
      if (markAllTimeout) clearTimeout(markAllTimeout)
    })

    return {
      notifications,
      loading,
      markingAllAsRead,
      unreadCount,
      visibleNotifications,
      markAsRead,
      markAllAsRead,
      debouncedMarkAsRead,
      debouncedMarkAllAsRead,
      getNotificationTypeText,
      getNotificationIconClass,
      formatDate
    }
  }
}
</script>

<style scoped>
/* NotificationInbox component styles moved to frontend/src/styles/components/notification-inbox.css */
</style>
