<template>
  <div class="student-notifications">
    <div class="page-header">
      <h1>Értesítések</h1>
      <div class="user-info">
        <span class="welcome-text">Üdvözöljük, {{ user?.username }}!</span>
        <button @click="logout" class="logout-btn">Kijelentkezés</button>
      </div>
    </div>

    <div class="notifications-content">
      <div class="card">
        <div class="card-header">
          <h2>Értesítések</h2>
        </div>
        <div class="card-content">
          <div v-if="loadingNotifications" class="loading">Betöltés...</div>
          <div v-else-if="notifications.length === 0" class="no-notifications">
            Nincsenek értesítések
          </div>
          <div v-else class="notifications-list">
            <div 
              v-for="notification in notifications" 
              :key="notification.notification_id" 
              class="notification-item"
              :class="{ unread: !notification.elolvasva }"
              @click="markAsRead(notification.notification_id)"
            >
              <div class="notification-content">
                <span class="notification-message">{{ notification.uzenet }}</span>
                <span class="notification-date">{{ formatDate(notification.created_at) }}</span>
              </div>
              <div v-if="!notification.elolvasva" class="unread-indicator"></div>
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
            <div class="stat-item">
              <div class="stat-label">Olvasatlan</div>
              <div class="stat-value">{{ unreadCount }}</div>
            </div>
            <div class="stat-item">
              <div class="stat-label">Olvasott</div>
              <div class="stat-value">{{ readCount }}</div>
            </div>
          </div>
          
          <div v-if="unreadCount > 0" class="actions">
            <button @click="markAllAsRead" class="mark-all-btn">
              Összes olvasottnak jelölése
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, computed, defineAsyncComponent } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../store/auth';
import api from '../services/api';
import { studentApi } from '../services/api';

export default {
  name: 'StudentNotifications',
  setup() {
    const router = useRouter();
    const authStore = useAuthStore();
    
    const notifications = ref([]);
    const loadingNotifications = ref(false);

    const user = computed(() => authStore.user);

    const logout = () => {
      authStore.logout();
      router.push('/login');
    };

    const getNotifications = async () => {
      loadingNotifications.value = true;
      try {
        const response = await studentApi.get('/students/notifications');
        notifications.value.splice(0, notifications.value.length, ...response.data.data);
      } catch (error) {
        console.error('Hiba az értesítések lekérésekor:', error);
      } finally {
        loadingNotifications.value = false;
      }
    };

    const markAsRead = async (notificationId) => {
      try {
        await studentApi.put(`/students/notifications/${notificationId}/read`);
        const notification = notifications.value.find(n => n.notification_id === notificationId);
        if (notification) {
          notification.elolvasva = true;
        }
      } catch (error) {
        console.error('Hiba az értesítés olvasottnak jelölésekor:', error);
      }
    };

    const markAllAsRead = async () => {
      try {
        await studentApi.put('/students/notifications/read-all');
        notifications.value.forEach(notification => {
          notification.elolvasva = true;
        });
      } catch (error) {
        console.error('Hiba az összes értesítés olvasottnak jelölésekor:', error);
      }
    };

    const formatDate = (dateString) => {
      const date = new Date(dateString);
      return date.toLocaleDateString('hu-HU');
    };

    const unreadCount = computed(() => {
      return notifications.value.filter(n => !n.elolvasva).length;
    });

    const readCount = computed(() => {
      return notifications.value.filter(n => n.elolvasva).length;
    });

    onMounted(() => {
      getNotifications();
    });

    return {
      notifications,
      loadingNotifications,
      user,
      logout,
      markAsRead,
      markAllAsRead,
      formatDate,
      unreadCount,
      readCount
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
  border-bottom: 2px solid var(--border-secondary);
}

.page-header h1 {
  margin: 0;
  color: var(--text-heading);
  font-size: 2rem;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.welcome-text {
  font-weight: 500;
  color: var(--text-secondary);
}

.logout-btn {
  padding: 0.5rem 1rem;
  background-color: var(--color-danger);
  color: var(--text-inverse);
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
}

.logout-btn:hover {
  background-color: var(--color-danger-dark);
}

.notifications-content {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 2rem;
}

.card {
  background: var(--bg-card);
  border-radius: 8px;
  box-shadow: var(--shadow-card);
  overflow: hidden;
  border: 1px solid var(--border-primary);
}

.card-header {
  background-color: var(--bg-tertiary);
  padding: 1rem 1.5rem;
  border-bottom: 1px solid var(--border-secondary);
}

.card-header h2 {
  margin: 0;
  font-size: 1.25rem;
  color: var(--text-heading);
}

.card-content {
  padding: 1.5rem;
}

.loading {
  text-align: center;
  color: var(--text-muted);
  font-style: italic;
}

.no-notifications {
  text-align: center;
  color: var(--text-muted);
  font-style: italic;
  padding: 1rem;
}

.notifications-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.notification-item {
  border: 1px solid var(--border-primary);
  border-radius: 4px;
  padding: 1rem;
  transition: all 0.2s;
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.notification-item:hover {
  box-shadow: var(--shadow-sm);
}

.notification-item.unread {
  background-color: var(--bg-tertiary);
  border-left: 4px solid var(--color-primary);
}

.notification-content {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.notification-message {
  font-size: 0.9rem;
  color: var(--text-primary);
}

.notification-date {
  font-size: 0.75rem;
  color: var(--text-secondary);
}

.unread-indicator {
  width: 8px;
  height: 8px;
  background-color: var(--color-primary);
  border-radius: 50%;
  margin-left: 1rem;
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
  background-color: var(--bg-tertiary);
  padding: 1rem;
  border-radius: 4px;
  text-align: center;
  border: 1px solid var(--border-primary);
}

.stat-label {
  font-size: 0.875rem;
  color: var(--text-secondary);
  font-weight: 500;
  margin-bottom: 0.25rem;
}

.stat-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--text-heading);
}

.actions {
  display: flex;
  justify-content: center;
}

.mark-all-btn {
  padding: 0.75rem 1.5rem;
  background-color: var(--color-primary);
  color: var(--text-inverse);
  border: none;
  border-radius: 4px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.2s;
}

.mark-all-btn:hover {
  background-color: var(--color-primary-dark);
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
}

/* Dark theme overrides */
/* Dark theme overrides are already handled by CSS variables */

/* High contrast theme overrides */
/* High contrast theme overrides are already handled by CSS variables */
</style>