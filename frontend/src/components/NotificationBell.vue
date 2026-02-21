<template>
  <div class="notification-bell dropdown">
    <button 
      class="btn btn-outline-light btn-sm position-relative"
      type="button"
      :id="dropdownId"
      data-bs-toggle="dropdown"
      aria-expanded="false"
      @click="handleClick"
    >
      <!-- Bell Icon -->
      <i class="bi bi-bell"></i>
      
      <!-- Unread Badge -->
      <span 
        v-if="notificationStore.hasUnread"
        class="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger"
      >
        {{ displayCount }}
        <span class="visually-hidden">olvasatlan értesítés</span>
      </span>
    </button>

    <!-- Dropdown Menu -->
    <ul 
      class="dropdown-menu dropdown-menu-end notification-dropdown"
      :aria-labelledby="dropdownId"
    >
      <li class="dropdown-header">
        <span>Értesítések</span>
        <button 
          v-if="notificationStore.hasUnread"
          class="btn btn-link btn-sm mark-all-link"
          @click.stop="markAllAsRead"
        >
          Összes olvasott
        </button>
      </li>
      
      <li><hr class="dropdown-divider"></li>

      <!-- Loading State -->
      <li v-if="loading" class="dropdown-item text-center py-3">
        <div class="spinner-border spinner-border-sm text-primary" role="status">
          <span class="visually-hidden">Betöltés...</span>
        </div>
      </li>

      <!-- No Notifications -->
      <li v-else-if="!notificationStore.hasUnread" class="dropdown-item text-center text-muted py-3">
        <i class="bi bi-bell-slash d-block mb-2" style="font-size: 1.5rem;"></i>
        Nincs új értesítés
      </li>

      <!-- Notification Items -->
      <template v-else>
        <li 
          v-for="notification in notificationStore.recentNotifications" 
          :key="notification.notification_id"
          class="dropdown-item notification-item"
          :class="{ unread: !notification.olvasva }"
          @click="handleNotificationClick(notification)"
        >
          <div class="notification-content">
            <div class="notification-title">
              <i :class="getTypeIcon(notification.tipus)" class="me-2"></i>
              {{ notification.cim }}
            </div>
            <div class="notification-text">{{ truncateText(notification.uzenet, 60) }}</div>
            <div class="notification-time">{{ formatTime(notification.created_at) }}</div>
          </div>
        </li>
      </template>

      <li><hr class="dropdown-divider"></li>
      
      <li class="dropdown-item text-center">
        <router-link 
          :to="notificationsRoute" 
          class="btn btn-outline-primary btn-sm w-100"
          @click="closeDropdown"
        >
          Összes értesítés
        </router-link>
      </li>
    </ul>
  </div>
</template>

<script>
import { defineComponent, ref, computed, onMounted, onUnmounted } from 'vue'
import { Dropdown } from 'bootstrap'
import { useNotificationStore } from '../store/notifications'
import { useAuthStore } from '../store/auth'

export default defineComponent({
  name: 'NotificationBell',
  setup() {
    const notificationStore = useNotificationStore()
    const authStore = useAuthStore()
    const loading = ref(false)
    const dropdownId = `notification-dropdown-${Date.now()}`

    const displayCount = computed(() => {
      const count = notificationStore.unreadCount
      return count > 99 ? '99+' : count
    })

    const notificationsRoute = computed(() => {
      return authStore.isAdmin ? '/notifications' : '/student-notifications'
    })

    const getTypeIcon = (tipus) => {
      const icons = {
        szobavaltas: 'bi bi-door-open',
        hatarido: 'bi bi-calendar-event',
        rendszer: 'bi bi-gear',
        egyeb: 'bi bi-info-circle'
      }
      return icons[tipus] || icons.egyeb
    }

    const truncateText = (text, maxLength) => {
      if (!text) return ''
      return text.length > maxLength ? text.substring(0, maxLength) + '...' : text
    }

    const formatTime = (dateString) => {
      if (!dateString) return ''
      const date = new Date(dateString)
      const now = new Date()
      const diff = now - date

      // Kevesebb mint 1 óra
      if (diff < 3600000) {
        const minutes = Math.floor(diff / 60000)
        return minutes <= 1 ? 'Épp most' : `${minutes} perce`
      }
      
      // Kevesebb mint 24 óra
      if (diff < 86400000) {
        const hours = Math.floor(diff / 3600000)
        return `${hours} órája`
      }
      
      // Kevesebb mint 7 nap
      if (diff < 604800000) {
        const days = Math.floor(diff / 86400000)
        return `${days} napja`
      }
      
      // Egyébként dátum
      return date.toLocaleDateString('hu-HU', { 
        month: 'short', 
        day: 'numeric' 
      })
    }

    const handleClick = async () => {
      if (notificationStore.notifications.length === 0) {
        loading.value = true
        try {
          await notificationStore.fetchNotifications({ limit: 5 })
        } finally {
          loading.value = false
        }
      }
    }

    const handleNotificationClick = async (notification) => {
      if (!notification.olvasva) {
        await notificationStore.markAsRead(notification.notification_id)
      }
      closeDropdown()
    }

    const markAllAsRead = async () => {
      await notificationStore.markAllAsRead()
    }

    const closeDropdown = () => {
      const dropdown = document.getElementById(dropdownId)
      if (dropdown) {
        const bsDropdown = Dropdown.getInstance(dropdown)
        if (bsDropdown) {
          bsDropdown.hide()
        }
      }
    }

    onMounted(() => {
      // Start polling when component mounts - only if authenticated
      if (authStore.isAuthenticated) {
        notificationStore.startPolling(30000) // 30 seconds
      }
    })

    onUnmounted(() => {
      notificationStore.stopPolling()
    })

    return {
      notificationStore,
      loading,
      dropdownId,
      displayCount,
      notificationsRoute,
      getTypeIcon,
      truncateText,
      formatTime,
      handleClick,
      handleNotificationClick,
      markAllAsRead,
      closeDropdown
    }
  }
})
</script>

<style scoped>
.notification-bell {
  display: inline-block;
}

.notification-bell .btn {
  padding: 0.375rem 0.5rem;
}

.notification-bell .btn i {
  font-size: 1.1rem;
}

.notification-dropdown {
  width: 320px;
  max-height: 400px;
  overflow-y: auto;
  padding: 0;
}

.dropdown-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 1rem;
  background-color: var(--blue-slate, #545e75);
  color: white;
  font-weight: 600;
}

.mark-all-link {
  font-size: 0.75rem;
  padding: 0.125rem 0.375rem;
  color: var(--powder-blue, #a7cced);
  text-decoration: none;
}

.mark-all-link:hover {
  color: white;
  text-decoration: underline;
}

.notification-item {
  padding: 0.75rem 1rem;
  cursor: pointer;
  border-left: 3px solid transparent;
  transition: all 0.2s ease;
}

.notification-item:hover {
  background-color: #f8f9fa;
}

.notification-item.unread {
  background-color: #e8f4fd;
  border-left-color: var(--cool-sky, #63adf2);
}

.notification-item.unread:hover {
  background-color: #d9ecfb;
}

.notification-title {
  font-weight: 600;
  font-size: 0.875rem;
  color: #333;
  margin-bottom: 0.25rem;
}

.notification-title i {
  color: var(--cool-sky, #63adf2);
}

.notification-text {
  font-size: 0.8rem;
  color: #666;
  margin-bottom: 0.25rem;
}

.notification-time {
  font-size: 0.7rem;
  color: #999;
}

.dropdown-divider {
  margin: 0;
}

/* Badge animation */
.badge {
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% {
    transform: translate(-50%, -50%) scale(1);
  }
  50% {
    transform: translate(-50%, -50%) scale(1.1);
  }
  100% {
    transform: translate(-50%, -50%) scale(1);
  }
}
</style>