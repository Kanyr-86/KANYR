<template>
  <div class="student-notifications">
    <div class="page-header">
      <h1>Értesítések</h1>
      <div class="user-info">
        <span class="welcome-text">Üdvözöljük, {{ user?.username }}!</span>
      </div>
    </div>

    <div class="notifications-content">
      <div class="card">
        <div class="card-header">
          <div class="d-flex justify-content-between align-items-center">
            <h2 class="mb-0">Értesítések</h2>
            <button 
              v-if="notificationStore.hasUnread" 
              @click="markAllAsRead" 
              class="btn btn-outline-primary btn-sm"
            >
              <i class="bi bi-check-all me-1"></i>
              Összes olvasottnak jelölése
            </button>
          </div>
        </div>
        <div class="card-content">
          <!-- Loading State -->
          <div v-if="loading" class="loading">
            <div class="spinner-border text-primary" role="status">
              <span class="visually-hidden">Betöltés...</span>
            </div>
            <p class="mt-2">Értesítések betöltése...</p>
          </div>

          <!-- Error State -->
          <div v-else-if="error" class="error-state">
            <i class="bi bi-exclamation-triangle text-danger" style="font-size: 2rem;"></i>
            <p class="text-danger mt-2">{{ error }}</p>
            <button @click="fetchNotifications" class="btn btn-primary btn-sm">
              Újrapróbálás
            </button>
          </div>

          <!-- No Notifications -->
          <div v-else-if="notifications.length === 0" class="no-notifications">
            <i class="bi bi-bell-slash" style="font-size: 3rem; color: #ccc;"></i>
            <p class="mt-3">Nincsenek értesítések</p>
          </div>

          <!-- Notifications List -->
          <div v-else class="notifications-list">
            <div 
              v-for="notification in notifications" 
              :key="notification.notification_id" 
              class="notification-item"
              :class="{ unread: !notification.olvasva }"
            >
              <div class="notification-icon">
                <i :class="getTypeIcon(notification.tipus)"></i>
              </div>
              <div class="notification-content" @click="handleNotificationClick(notification)">
                <div class="notification-title">{{ notification.cim }}</div>
                <div class="notification-message">{{ notification.uzenet }}</div>
                <div class="notification-meta">
                  <span class="notification-type">{{ getTypeLabel(notification.tipus) }}</span>
                  <span class="notification-date">{{ formatDate(notification.created_at) }}</span>
                </div>
              </div>
              <div class="notification-actions">
                <button 
                  v-if="!notification.olvasva"
                  @click.stop="markAsRead(notification.notification_id)"
                  class="btn btn-sm btn-outline-success"
                  title="Olvasottnak jelölés"
                >
                  <i class="bi bi-check"></i>
                </button>
                <button 
                  @click.stop="deleteNotification(notification.notification_id)"
                  class="btn btn-sm btn-outline-danger"
                  title="Törlés"
                >
                  <i class="bi bi-trash"></i>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="card stats-card">
        <div class="card-header">
          <h2>Statisztikák</h2>
        </div>
        <div class="card-content">
          <div class="stats-grid">
            <div class="stat-item">
              <div class="stat-label">Összes értesítés</div>
              <div class="stat-value">{{ notifications.length }}</div>
            </div>
            <div class="stat-item unread-stat">
              <div class="stat-label">Olvasatlan</div>
              <div class="stat-value">{{ unreadCount }}</div>
            </div>
            <div class="stat-item read-stat">
              <div class="stat-label">Olvasott</div>
              <div class="stat-value">{{ readCount }}</div>
            </div>
          </div>

          <!-- Type breakdown -->
          <div class="type-breakdown mt-4">
            <h5>Típus szerint</h5>
            <div class="type-list">
              <div class="type-item">
                <i class="bi bi-door-open me-2"></i>
                <span>Szobaváltás</span>
                <span class="badge bg-secondary ms-auto">{{ typeCounts.szobavaltas || 0 }}</span>
              </div>
              <div class="type-item">
                <i class="bi bi-calendar-event me-2"></i>
                <span>Határidő</span>
                <span class="badge bg-secondary ms-auto">{{ typeCounts.hatarido || 0 }}</span>
              </div>
              <div class="type-item">
                <i class="bi bi-gear me-2"></i>
                <span>Rendszer</span>
                <span class="badge bg-secondary ms-auto">{{ typeCounts.rendszer || 0 }}</span>
              </div>
              <div class="type-item">
                <i class="bi bi-info-circle me-2"></i>
                <span>Egyéb</span>
                <span class="badge bg-secondary ms-auto">{{ typeCounts.egyeb || 0 }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue';
import { useAuthStore } from '../store/auth';
import { useNotificationStore } from '../store/notifications';

export default {
  name: 'StudentNotifications',
  setup() {
    const authStore = useAuthStore();
    const notificationStore = useNotificationStore();
    
    const loading = ref(false);
    const error = ref(null);

    const user = computed(() => authStore.user);
    const notifications = computed(() => notificationStore.notifications);
    const unreadCount = computed(() => notificationStore.unreadCount);

    const readCount = computed(() => {
      return notifications.value.filter(n => n.olvasva).length;
    });

    const typeCounts = computed(() => {
      const counts = {};
      notifications.value.forEach(n => {
        counts[n.tipus] = (counts[n.tipus] || 0) + 1;
      });
      return counts;
    });

    const fetchNotifications = async () => {
      loading.value = true;
      error.value = null;
      try {
        await notificationStore.fetchNotifications({ limit: 100 });
      } catch (err) {
        error.value = 'Nem sikerült betölteni az értesítéseket';
      } finally {
        loading.value = false;
      }
    };

    const markAsRead = async (notificationId) => {
      try {
        await notificationStore.markAsRead(notificationId);
      } catch (err) {
        console.error('Hiba az értesítés olvasottnak jelölésekor:', err);
      }
    };

    const markAllAsRead = async () => {
      try {
        await notificationStore.markAllAsRead();
      } catch (err) {
        console.error('Hiba az összes értesítés olvasottnak jelölésekor:', err);
      }
    };

    const deleteNotification = async (notificationId) => {
      if (!confirm('Biztosan törli ezt az értesítést?')) return;
      try {
        await notificationStore.deleteNotification(notificationId);
      } catch (err) {
        console.error('Hiba az értesítés törlésekor:', err);
      }
    };

    const handleNotificationClick = async (notification) => {
      if (!notification.olvasva) {
        await markAsRead(notification.notification_id);
      }
    };

    const getTypeIcon = (tipus) => {
      const icons = {
        szobavaltas: 'bi bi-door-open text-primary',
        hatarido: 'bi bi-calendar-event text-warning',
        rendszer: 'bi bi-gear text-info',
        egyeb: 'bi bi-info-circle text-secondary'
      };
      return icons[tipus] || icons.egyeb;
    };

    const getTypeLabel = (tipus) => {
      const labels = {
        szobavaltas: 'Szobaváltás',
        hatarido: 'Határidő',
        rendszer: 'Rendszer',
        egyeb: 'Egyéb'
      };
      return labels[tipus] || 'Ismeretlen';
    };

    const formatDate = (dateString) => {
      if (!dateString) return '';
      const date = new Date(dateString);
      return date.toLocaleDateString('hu-HU', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    };

    onMounted(() => {
      fetchNotifications();
    });

    return {
      notificationStore,
      notifications,
      loading,
      error,
      user,
      unreadCount,
      readCount,
      typeCounts,
      fetchNotifications,
      markAsRead,
      markAllAsRead,
      deleteNotification,
      handleNotificationClick,
      getTypeIcon,
      getTypeLabel,
      formatDate
    };
  }
};
</script>

<style scoped>
.student-notifications {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  padding-bottom: 1rem;
  border-bottom: 2px solid var(--steel-blue, #82a0bc);
}

.page-header h1 {
  margin: 0;
  color: #ffffff;
  font-size: 2rem;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.3);
}

.user-info {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.welcome-text {
  font-weight: 500;
  color: var(--powder-blue, #a7cced);
}

.notifications-content {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 2rem;
}

.card {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  overflow: hidden;
}

.card-header {
  background-color: var(--blue-slate, #545e75);
  padding: 1rem 1.5rem;
  border-bottom: 1px solid var(--steel-blue, #82a0bc);
}

.card-header h2 {
  margin: 0;
  font-size: 1.25rem;
  color: #ffffff;
}

.card-content {
  padding: 1.5rem;
}

.loading, .error-state, .no-notifications {
  text-align: center;
  color: #666;
  padding: 3rem 1rem;
}

.no-notifications p {
  color: #999;
  font-size: 1.1rem;
}

.notifications-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.notification-item {
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 1rem;
  transition: all 0.2s;
  display: flex;
  align-items: flex-start;
  gap: 1rem;
}

.notification-item:hover {
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.notification-item.unread {
  background-color: #e8f4fd;
  border-left: 4px solid var(--cool-sky, #63adf2);
}

.notification-item.unread:hover {
  background-color: #d9ecfb;
}

.notification-icon {
  font-size: 1.5rem;
  padding: 0.5rem;
  background-color: #f8f9fa;
  border-radius: 50%;
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.notification-content {
  flex: 1;
  cursor: pointer;
}

.notification-title {
  font-weight: 600;
  font-size: 1rem;
  color: #333;
  margin-bottom: 0.25rem;
}

.notification-message {
  font-size: 0.9rem;
  color: #666;
  margin-bottom: 0.5rem;
}

.notification-meta {
  display: flex;
  gap: 1rem;
  font-size: 0.75rem;
  color: #999;
}

.notification-type {
  background-color: #f0f0f0;
  padding: 0.125rem 0.5rem;
  border-radius: 4px;
}

.notification-actions {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.notification-actions .btn {
  padding: 0.25rem 0.5rem;
}

.stats-card {
  grid-row: 1;
}

.stats-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1rem;
  margin-bottom: 1rem;
}

.stat-item {
  background-color: #f8f9fa;
  padding: 1rem;
  border-radius: 8px;
  text-align: center;
}

.stat-item.unread-stat {
  background-color: #fff3cd;
}

.stat-item.read-stat {
  background-color: #d4edda;
}

.stat-label {
  font-size: 0.875rem;
  color: #666;
  font-weight: 500;
  margin-bottom: 0.25rem;
}

.stat-value {
  font-size: 1.75rem;
  font-weight: 700;
  color: #333;
}

.type-breakdown h5 {
  color: #666;
  font-size: 0.9rem;
  margin-bottom: 1rem;
}

.type-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.type-item {
  display: flex;
  align-items: center;
  padding: 0.5rem;
  background-color: #f8f9fa;
  border-radius: 4px;
}

.type-item i {
  color: var(--cool-sky, #63adf2);
}

.type-item span {
  font-size: 0.875rem;
}

/* Responsive design */
@media (max-width: 768px) {
  .notifications-content {
    grid-template-columns: 1fr;
  }
  
  .page-header {
    flex-direction: column;
    gap: 1rem;
    align-items: flex-start;
  }

  .notification-item {
    flex-direction: column;
    align-items: stretch;
  }

  .notification-icon {
    margin-bottom: 0.5rem;
  }

  .notification-actions {
    flex-direction: row;
    justify-content: flex-end;
    margin-top: 0.5rem;
  }
}
</style>