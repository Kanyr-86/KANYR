<template>
  <div class="student-dashboard">
    <div class="dashboard-header">
      <h1>Diák Irányítópult</h1>
      <div class="user-info">
        <span class="welcome-text">Üdvözöljük, {{ user?.username }}!</span>
        <button @click="logout" class="logout-btn">Kijelentkezés</button>
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

        <!-- Room Change Request Card -->
        <div class="card">
          <div class="card-header">
            <h2>Szobaváltási kérelem</h2>
          </div>
          <div class="card-content">
            <div v-if="loadingRooms" class="loading">Betöltés...</div>
            <form v-else @submit.prevent="submitRoomChangeRequest" class="room-change-form">
              <div class="form-group">
                <label for="roomSelect">Kívánt szoba:</label>
                <select 
                  v-model="selectedRoomId" 
                  id="roomSelect" 
                  class="form-select"
                  required
                >
                  <option value="">Válasszon szobát...</option>
                  <option 
                    v-for="room in availableRooms" 
                    :key="room.szoba_id" 
                    :value="room.szoba_id"
                    :disabled="!room.isAvailable"
                  >
                    {{ room.szoba_szama }} ({{ room.osszes_hely }} férőhely)
                    <span v-if="!room.isAvailable" class="unavailable-badge">Nem elérhető</span>
                  </option>
                </select>
              </div>

              <div class="form-group">
                <label for="reason">Indok:</label>
                <textarea 
                  v-model="reason" 
                  id="reason" 
                  class="form-textarea"
                  placeholder="Kérjük, írja le röviden az indokát a szobaváltásra..."
                  rows="4"
                ></textarea>
              </div>

              <div v-if="roomChangeLimitReached" class="limit-warning">
                Elérte a félévi szobaváltási korlátot (3 alkalom)
              </div>

              <button 
                type="submit" 
                class="submit-btn"
                :disabled="!canSubmit"
              >
                Szobaváltási kérelem benyújtása
              </button>
            </form>
          </div>
        </div>

        <!-- Room Change History Card -->
        <div class="card history-card">
          <div class="card-header">
            <h2>Szobaváltási történet</h2>
          </div>
          <div class="card-content">
            <div v-if="loadingHistory" class="loading">Betöltés...</div>
            <div v-else-if="roomHistory.length === 0" class="no-history">
              Nincs szobaváltási történet
            </div>
            <div v-else class="history-list">
              <div 
                v-for="request in roomHistory" 
                :key="request.valtoztatas_id" 
                class="history-item"
                :class="request.statusz"
              >
                <div class="history-header">
                  <span class="date">{{ formatDate(request.created_at) }}</span>
                  <span class="status" :class="request.statusz">{{ getStatusText(request.statusz) }}</span>
                </div>
                <div class="history-details">
                  <div class="detail-row">
                    <span class="label">Jelenlegi szoba:</span>
                    <span class="value">{{ request.jelenlegi_szoba.szoba_szama }}</span>
                  </div>
                  <div class="detail-row">
                    <span class="label">Kívánt szoba:</span>
                    <span class="value">{{ request.kivant_szoba.szoba_szama }}</span>
                  </div>
                  <div v-if="request.indok" class="detail-row">
                    <span class="label">Indok:</span>
                    <span class="value">{{ request.indok }}</span>
                  </div>
                </div>
              </div>
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
        const response = await api.get('/students/room');
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
        const response = await api.get('/students/room-history');
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
        const response = await api.get('/students/notifications');
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
        await api.post('/students/room-change', {
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
        await api.put(`/students/notifications/${notificationId}/read`);
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
  border-bottom: 2px solid #e0e0e0;
}

.dashboard-header h1 {
  margin: 0;
  color: #333;
  font-size: 2rem;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.welcome-text {
  font-weight: 500;
  color: #666;
}

.logout-btn {
  padding: 0.5rem 1rem;
  background-color: #dc3545;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
}

.logout-btn:hover {
  background-color: #c82333;
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
  background-color: #f8f9fa;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid #e0e0e0;
}

.card-header h2 {
  margin: 0;
  font-size: 1.25rem;
  color: #333;
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

.room-change-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-group label {
  font-weight: 500;
  color: #333;
  font-size: 0.875rem;
}

.form-select, .form-textarea {
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
  font-family: inherit;
}

.form-select:focus, .form-textarea:focus {
  outline: none;
  border-color: #007bff;
  box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
}

.unavailable-badge {
  margin-left: auto;
  font-size: 0.75rem;
  color: #666;
  background-color: #f0f0f0;
  padding: 0.125rem 0.25rem;
  border-radius: 4px;
}

.submit-btn {
  padding: 0.75rem 1.5rem;
  background-color: #28a745;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.2s;
}

.submit-btn:hover:not(:disabled) {
  background-color: #218838;
}

.submit-btn:disabled {
  background-color: #6c757d;
  cursor: not-allowed;
  opacity: 0.6;
}

.limit-warning {
  background-color: #fff3cd;
  border: 1px solid #ffeaa7;
  color: #856404;
  padding: 0.75rem;
  border-radius: 4px;
  margin-bottom: 1rem;
}

.history-card {
  grid-column: 1 / -1;
}

.history-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.history-item {
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  padding: 1rem;
  transition: all 0.2s;
}

.history-item:hover {
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.history-item.pending {
  border-left: 4px solid #ffc107;
}

.history-item.approved {
  border-left: 4px solid #28a745;
}

.history-item.denied {
  border-left: 4px solid #dc3545;
}

.history-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.history-header .date {
  font-size: 0.875rem;
  color: #666;
}

.status {
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
}

.status.pending {
  background-color: #fff3cd;
  color: #856404;
}

.status.approved {
  background-color: #d4edda;
  color: #155724;
}

.status.denied {
  background-color: #f8d7da;
  color: #721c24;
}

.history-details {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.5rem;
}

.detail-row {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.notifications-card {
  grid-column: 1 / -1;
}

.notifications-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.notification-item {
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  padding: 1rem;
  transition: all 0.2s;
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.notification-item:hover {
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.notification-item.unread {
  background-color: #f8f9fa;
  border-left: 4px solid #007bff;
}

.notification-content {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.notification-message {
  font-size: 0.9rem;
  color: #333;
}

.notification-date {
  font-size: 0.75rem;
  color: #666;
}

.unread-indicator {
  width: 8px;
  height: 8px;
  background-color: #007bff;
  border-radius: 50%;
  margin-left: 1rem;
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