<template>
  <div class="student-dashboard">
    <div class="dashboard-content">
      <div class="dashboard-grid">
        <!-- Current Room Card -->
        <div class="card">
          <div class="card-header">
            <h2>Jelenlegi szobám</h2>
          </div>
          <div class="card-content">
            <div v-if="loadingRoom" class="loading">Betöltés...</div>
            <div v-else-if="currentRoom" class="room-info">
              <div class="room-details">
                <div class="detail-item">
                  <span class="label">Szobaszám:</span>
                  <span class="value">{{ currentRoom.szoba.szoba_szama }}</span>
                </div>
                <div class="detail-item">
                  <span class="label">Férőhelyek:</span>
                  <span class="value">{{ currentRoom.szoba.osszes_hely }}</span>
                </div>
              </div>
              
              <div class="roommates-section">
                <h3>Szobatársak</h3>
                <div v-if="currentRoom.szobatarsak.length === 0" class="no-roommates">
                  Jelenleg nincsenek szobatársak
                </div>
                <div v-else class="roommates-list">
                  <div v-for="roommate in currentRoom.szobatarsak" :key="roommate.nev" class="roommate-item">
                    {{ roommate.nev }}
                  </div>
                </div>
              </div>
            </div>
            <div v-else class="no-room">
              Jelenleg nincs szobában
            </div>
          </div>
        </div>


        <!-- Notifications Card -->
        <div class="card notifications-card">
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
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue';
import { studentApi } from '../services/api';

export default {
  name: 'StudentDashboard',
  setup() {
    const currentRoom = ref(null);
    const notifications = ref([]);
    const loadingRoom = ref(false);
    const loadingNotifications = ref(false);

    const getCurrentRoom = async () => {
      loadingRoom.value = true;
      try {
        const response = await studentApi.get('/room');
        currentRoom.value = response.data.data;
      } catch (error) {
        console.error('Hiba a szoba lekérésekor:', error);
      } finally {
        loadingRoom.value = false;
      }
    };

    const getNotifications = async () => {
      loadingNotifications.value = true;
      try {
        const response = await studentApi.get('/notifications');
        notifications.value = response.data.data;
      } catch (error) {
        console.error('Hiba az értesítések lekérésekor:', error);
      } finally {
        loadingNotifications.value = false;
      }
    };

    const markAsRead = async (notificationId) => {
      try {
        await studentApi.put(`/notifications/${notificationId}/read`);
        const notification = notifications.value.find(n => n.notification_id === notificationId);
        if (notification) {
          notification.elolvasva = true;
        }
      } catch (error) {
        console.error('Hiba az értesítés olvasottnak jelölésekor:', error);
      }
    };

    const formatDate = (dateString) => {
      const date = new Date(dateString);
      return date.toLocaleDateString('hu-HU');
    };

    onMounted(() => {
      getCurrentRoom();
      getNotifications();
    });

    return {
      currentRoom,
      notifications,
      loadingRoom,
      loadingNotifications,
      markAsRead,
      formatDate
    };
  }
};
</script>

<style scoped>
.student-dashboard {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  padding-bottom: 1rem;
  border-bottom: 2px solid var(--border-primary);
}

.dashboard-header h1 {
  margin: 0;
  color: var(--text-primary);
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

.dashboard-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
}

/* Card styles now use global CSS variables from base.css */
/* Only view-specific card overrides remain */

.card-header h2 {
  margin: 0;
  font-size: 1.25rem;
  color: var(--text-primary);
}

.card-content {
  padding: var(--card-body-padding);
}

.loading {
  text-align: center;
  color: var(--text-muted);
  font-style: italic;
}

.no-room, .no-roommates, .no-history, .no-notifications {
  text-align: center;
  color: var(--text-muted);
  font-style: italic;
  padding: 1rem;
}

.room-info {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.room-details {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.detail-item {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.label {
  font-size: 0.875rem;
  color: var(--text-secondary);
  font-weight: 500;
}

.value {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--text-primary);
}

.roommates-section h3 {
  margin: 0 0 0.5rem 0;
  font-size: 1rem;
  color: var(--text-primary);
}

.roommates-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.roommate-item {
  padding: 0.5rem;
  background-color: var(--bg-tertiary);
  border-radius: 4px;
  font-size: 0.9rem;
  border: 1px solid var(--border-primary);
}


.notifications-card {
  grid-column: span 1;
  max-height: 600px;
  overflow: hidden;
}

.notifications-list {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  max-height: 450px;
  overflow-y: auto;
}

.notification-item {
  border: 1px solid var(--border-primary);
  border-radius: 4px;
  padding: 0.5rem;
  transition: all 0.2s;
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.85rem;
}

.notification-item:hover {
  box-shadow: var(--shadow-sm);
}

.notification-item.unread {
  background-color: var(--bg-tertiary);
  border-left: 4px solid var(--primary-600);
}

.notification-content {
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
  flex: 1;
}

.notification-message {
  font-size: 0.8rem;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 80%;
}

.notification-date {
  font-size: 0.7rem;
  color: var(--text-secondary);
}

.unread-indicator {
  width: 6px;
  height: 6px;
  background-color: var(--primary-600);
  border-radius: 50%;
  margin-left: 0.5rem;
}

/* Dark theme unread indicator */
[data-theme="dark"] .unread-indicator {
  background-color: var(--primary-400);
}

/* High contrast unread indicator */
[data-theme="high-contrast"] .unread-indicator {
  background-color: #000000;
  border: 1px solid #000000;
}

/* Responsive design */
@media (max-width: 768px) {
  .dashboard-grid {
    grid-template-columns: 1fr;
  }
  
  .room-details, .history-details {
    grid-template-columns: 1fr;
  }
  
  .dashboard-header {
    flex-direction: column;
    gap: 1rem;
    align-items: flex-start;
  }
}

/* Dark theme overrides */
/* Dark theme overrides are already handled by CSS variables */

/* High contrast theme overrides */
/* High contrast theme overrides are already handled by CSS variables */

/* Additional high contrast overrides */
[data-theme="high-contrast"] .card {
  border: 2px solid var(--border-primary);
}

[data-theme="high-contrast"] .card-header {
  border-bottom: 2px solid var(--border-primary);
}

[data-theme="high-contrast"] .notification-item.unread {
  border-left: 4px solid #000000;
}

[data-theme="high-contrast"] .unread-indicator {
  background-color: #000000;
}
</style>