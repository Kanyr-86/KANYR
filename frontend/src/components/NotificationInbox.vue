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
            @click="markAllAsRead" 
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
              v-for="notification in notifications" 
              :key="notification.notification_id"
              class="list-group-item list-group-item-action"
              :class="{ 'unread': !notification.elolvasva }"
              @click="markAsRead(notification)"
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
import { ref, onMounted, computed } from 'vue'
import { toast } from 'vue3-toastify'
import api from '../services/api'

export default {
  name: 'NotificationInbox',
  setup() {
    const notifications = ref([])
    const loading = ref(false)
    const markingAllAsRead = ref(false)

    const unreadCount = computed(() => {
      return notifications.value.filter(n => !n.elolvasva).length
    })

    const fetchNotifications = async () => {
      loading.value = true
      try {
        const response = await api.get('/szobavaltoztatas/admin/notifications')
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
        
        for (const notification of unreadNotifications) {
          await api.put(`/szobavaltoztatas/admin/notifications/${notification.notification_id}/read`)
          notification.elolvasva = true
        }
        
        toast.success('Összes értesítés olvasottnak jelölve')
      } catch (error) {
        console.error('Hiba az összes értesítés olvasottnak jelölésekor:', error)
        toast.error('Nem sikerült olvasottnak jelölni az összes értesítést')
      } finally {
        markingAllAsRead.value = false
      }
    }

    const getNotificationTypeText = (type) => {
      const typeMap = {
        'room_change_approved': 'Szobaváltás jóváhagyva',
        'room_change_denied': 'Szobaváltás elutasítva',
        'room_change_pending': 'Szobaváltás függőben'
      }
      return typeMap[type] || 'Értesítés'
    }

    const getNotificationIconClass = (type) => {
      const iconMap = {
        'room_change_approved': 'badge bg-success',
        'room_change_denied': 'badge bg-danger',
        'room_change_pending': 'badge bg-warning'
      }
      return iconMap[type] || 'badge bg-secondary'
    }

    const formatDate = (dateString) => {
      const date = new Date(dateString)
      return date.toLocaleString('hu-HU', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      })
    }

    onMounted(() => {
      fetchNotifications()
    })

    return {
      notifications,
      loading,
      markingAllAsRead,
      unreadCount,
      markAsRead,
      markAllAsRead,
      getNotificationTypeText,
      getNotificationIconClass,
      formatDate
    }
  }
}
</script>

<style scoped>
.notification-inbox {
  min-height: 400px;
}

/* Typography Hierarchy - Section Headers (inherited from DashboardView) */
.card-header h5 {
  font-size: 1rem;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 0;
}

.list-group-item {
  cursor: pointer;
  transition: background-color 0.2s;
}

.list-group-item:hover {
  background-color: #f8f9fa;
}

.list-group-item.unread {
  background-color: #fff3cd;
  border-left: 4px solid #ffc107;
}

.list-group-item.unread:hover {
  background-color: #fff9d0;
}

.badge {
  font-size: 0.75rem;
  padding: 0.25rem 0.5rem;
}

.card-header {
  background-color: #f8f9fa;
  border-bottom: 1px solid #dee2e6;
}

.card-body {
  padding: 0;
}

.list-group-item-action {
  border: 1px solid #dee2e6;
  border-top: none;
}

.list-group-item-action:first-child {
  border-top: 1px solid #dee2e6;
}

/* Dark theme adjustments for typography */
[data-theme="dark"] .card-header h5 {
  color: #cbd5e1;
}

/* High contrast theme adjustments */
[data-theme="high-contrast"] .card-header h5 {
  color: #000000;
}
</style>
