<template>
  <div class="student-dashboard">
    <div class="dashboard-header">
      <h1>Diák Irányítópult</h1>
      <div class="user-info">
        <span class="welcome-text">Üdvözöljük, {{ user?.username }}!</span>
      </div>
    </div>

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
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../store/auth';
import api from '../services/api';
import { studentApi } from '../services/api';

export default {
  name: 'StudentDashboard',
  setup() {
    const router = useRouter();
    const authStore = useAuthStore();
    
    const currentRoom = ref(null);
    const roomHistory = ref([]);
    const notifications = ref([]);
    const availableRooms = ref([]);
    const loadingRoom = ref(false);
    const loadingHistory = ref(false);
    const loadingNotifications = ref(false);
    const loadingRooms = ref(false);
    
    const selectedRoomId = ref('');
    const reason = ref('');
    const roomChangeLimitReached = ref(false);

    const user = computed(() => authStore.user);

    const logout = () => {
      authStore.logout();
      router.push('/login');
    };

    const getCurrentRoom = async () => {
      loadingRoom.value = true;
      try {
        const response = await studentApi.get('/students/room');
        currentRoom.value = response.data.data;
      } catch (error) {
        console.error('Hiba a szoba lekérésekor:', error);
      } finally {
        loadingRoom.value = false;
      }
    };

    const getRoomHistory = async () => {
      loadingHistory.value = true;
      try {
        const response = await studentApi.get('/students/room-history');
        roomHistory.value = response.data.data;
        
        // Ellenőrizzük a szobaváltási korlátot
        const currentYear = new Date().getFullYear();
        const academicYear = `${currentYear}-${currentYear + 1}`;
        const pendingOrApproved = roomHistory.value.filter(r => 
          r.academic_year === academicYear && 
          (r.statusz === 'pending' || r.statusz === 'approved')
        );
        roomChangeLimitReached.value = pendingOrApproved.length >= 3;
      } catch (error) {
        console.error('Hiba a szobaváltási történet lekérésekor:', error);
      } finally {
        loadingHistory.value = false;
      }
    };

    const getNotifications = async () => {
      loadingNotifications.value = true;
      try {
        const response = await studentApi.get('/students/notifications');
        notifications.value = response.data.data;
      } catch (error) {
        console.error('Hiba az értesítések lekérésekor:', error);
      } finally {
        loadingNotifications.value = false;
      }
    };

    const getAvailableRooms = async () => {
      loadingRooms.value = true;
      try {
        const response = await api.get('/szobas');
        availableRooms.value = response.data.data.map(room => ({
          ...room,
          isAvailable: room.osszes_hely > 0 // Egyszerűsített ellenőrzés
        }));
      } catch (error) {
        console.error('Hiba a szobák lekérésekor:', error);
      } finally {
        loadingRooms.value = false;
      }
    };

    const submitRoomChangeRequest = async () => {
      if (!selectedRoomId.value) {
        alert('Kérjük, válasszon szobát!');
        return;
      }

      try {
        await studentApi.post('/students/room-change', {
          kivant_szoba_id: selectedRoomId.value,
          indok: reason.value
        });
        
        alert('Szobaváltási kérelem sikeresen benyújtva!');
        selectedRoomId.value = '';
        reason.value = '';
        getRoomHistory(); // Frissítjük a történetet
        getNotifications(); // Frissítjük az értesítéseket
      } catch (error) {
        console.error('Hiba a szobaváltási kérelem benyújtásakor:', error);
        alert('Hiba történt a kérelem benyújtásakor!');
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

    const formatDate = (dateString) => {
      const date = new Date(dateString);
      return date.toLocaleDateString('hu-HU');
    };

    const getStatusText = (status) => {
      const statusMap = {
        pending: 'Függőben',
        approved: 'Jóváhagyva',
        denied: 'Elutasítva'
      };
      return statusMap[status] || status;
    };

    const canSubmit = computed(() => {
      return selectedRoomId.value && !roomChangeLimitReached.value;
    });

    onMounted(() => {
      getCurrentRoom();
      getRoomHistory();
      getNotifications();
      getAvailableRooms();
    });

    return {
      currentRoom,
      roomHistory,
      notifications,
      availableRooms,
      loadingRoom,
      loadingHistory,
      loadingNotifications,
      loadingRooms,
      selectedRoomId,
      reason,
      roomChangeLimitReached,
      user,
      logout,
      submitRoomChangeRequest,
      markAsRead,
      formatDate,
      getStatusText,
      canSubmit
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
  border-bottom: 2px solid var(--steel-blue, #82a0bc);
}

.dashboard-header h1 {
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

.dashboard-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
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

.loading {
  text-align: center;
  color: #666;
  font-style: italic;
}

.no-room, .no-roommates, .no-history, .no-notifications {
  text-align: center;
  color: #666;
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
  color: #666;
  font-weight: 500;
}

.value {
  font-size: 1.125rem;
  font-weight: 600;
  color: #333;
}

.roommates-section h3 {
  margin: 0 0 0.5rem 0;
  font-size: 1rem;
  color: #333;
}

.roommates-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.roommate-item {
  padding: 0.5rem;
  background-color: #f8f9fa;
  border-radius: 4px;
  font-size: 0.9rem;
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
  border: 1px solid #e0e0e0;
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
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.notification-item.unread {
  background-color: var(--powder-blue, #a7cced);
  border-left: 4px solid var(--cool-sky, #63adf2);
}

.notification-content {
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
  flex: 1;
}

.notification-message {
  font-size: 0.8rem;
  color: #333;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 80%;
}

.notification-date {
  font-size: 0.7rem;
  color: #666;
}

.unread-indicator {
  width: 6px;
  height: 6px;
  background-color: #007bff;
  border-radius: 50%;
  margin-left: 0.5rem;
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
</style>