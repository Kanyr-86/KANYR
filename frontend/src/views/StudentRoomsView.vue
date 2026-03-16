<template>
  <div class="student-rooms">
    <div class="page-header">
      <h1>Szobám</h1>
      <div class="user-info">
        <span class="welcome-text">Üdvözöljük, {{ user?.username }}!</span>
        <button @click="logout" class="logout-btn">Kijelentkezés</button>
      </div>
    </div>

    <div class="room-content">
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
              <div class="detail-item">
                <span class="label">Jelenlegi lakók:</span>
                <span class="value">{{ currentRoom.szobatarsak.length + 1 }}</span>
              </div>
            </div>
            
            <div class="roommates-section">
              <h3>Szobatársak</h3>
              <div v-if="currentRoom.szobatarsak.length === 0" class="no-roommates">
                Jelenleg nincsenek szobatársak
              </div>
              <div v-else class="roommates-list">
                <div v-for="roommate in currentRoom.szobatarsak" :key="roommate.nev" class="roommate-item">
                  <div class="roommate-name">{{ roommate.nev }}</div>
                  <div class="roommate-contact">{{ roommate.email }}</div>
                </div>
              </div>
            </div>
          </div>
          <div v-else class="no-room">
            Jelenleg nincs szobában
          </div>
        </div>
      </div>

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
  name: 'StudentRooms',
  setup() {
    const router = useRouter();
    const authStore = useAuthStore();
    
    const currentRoom = ref(null);
    const roomHistory = ref([]);
    const availableRooms = ref([]);
    const loadingRoom = ref(false);
    const loadingHistory = ref(false);
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

    const getAvailableRooms = async () => {
      loadingRooms.value = true;
      try {
        // /szobas/available already filters to rooms with free capacity
        const response = await api.get('/szobas/available');
        availableRooms.value = response.data.data.map(room => ({
          ...room,
          isAvailable: true
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
        getCurrentRoom(); // Frissítjük a jelenlegi szobát
      } catch (error) {
        console.error('Hiba a szobaváltási kérelem benyújtásakor:', error);
        alert('Hiba történt a kérelem benyújtásakor!');
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
      getAvailableRooms();
    });

    return {
      currentRoom,
      roomHistory,
      availableRooms,
      loadingRoom,
      loadingHistory,
      loadingRooms,
      selectedRoomId,
      reason,
      roomChangeLimitReached,
      user,
      logout,
      submitRoomChangeRequest,
      formatDate,
      getStatusText,
      canSubmit
    };
  }
};
</script>

<style scoped>
.student-rooms {
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

.room-content {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
}

/* Két kártya egymás mellett, a történet kártya alul */
.room-content > .card:not(.history-card) {
  grid-column: span 1;
}

.history-card {
  grid-column: 1 / -1;
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

.no-room, .no-roommates, .no-history {
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
  color: var(--text-heading);
}

.roommates-section h3 {
  margin: 0 0 0.5rem 0;
  font-size: 1rem;
  color: var(--text-heading);
}

.roommates-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.roommate-item {
  padding: 0.75rem;
  background-color: var(--bg-tertiary);
  border-radius: 4px;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  border: 1px solid var(--border-primary);
}

.roommate-name {
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-heading);
}

.roommate-contact {
  font-size: 0.875rem;
  color: var(--text-secondary);
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
  color: var(--text-heading);
  font-size: 0.875rem;
}

.form-select, .form-textarea {
  padding: 0.5rem;
  border: 1px solid var(--border-primary);
  border-radius: 4px;
  font-size: 1rem;
  font-family: inherit;
  background-color: var(--bg-page);
  color: var(--text-primary);
}

.form-select:focus, .form-textarea:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.25);
}

.unavailable-badge {
  margin-left: auto;
  font-size: 0.75rem;
  color: var(--text-secondary);
  background-color: var(--bg-tertiary);
  padding: 0.125rem 0.25rem;
  border-radius: 4px;
}

.submit-btn {
  padding: 0.75rem 1.5rem;
  background-color: var(--color-success);
  color: var(--text-inverse);
  border: none;
  border-radius: 4px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.2s;
}

.submit-btn:hover:not(:disabled) {
  background-color: var(--color-success-dark);
}

.submit-btn:disabled {
  background-color: var(--color-secondary);
  cursor: not-allowed;
  opacity: 0.6;
}

.limit-warning {
  background-color: var(--color-warning);
  border: 1px solid var(--color-warning-dark);
  color: var(--text-dark);
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
  border: 1px solid var(--border-primary);
  border-radius: 4px;
  padding: 1rem;
  transition: all 0.2s;
}

.history-item:hover {
  box-shadow: var(--shadow-sm);
}

.history-item.pending {
  border-left: 4px solid var(--color-warning);
}

.history-item.approved {
  border-left: 4px solid var(--color-success);
}

.history-item.denied {
  border-left: 4px solid var(--color-danger);
}

.history-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.history-header .date {
  font-size: 0.875rem;
  color: var(--text-secondary);
}

.status {
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
}

.status.pending {
  background-color: var(--color-warning);
  color: var(--text-dark);
}

.status.approved {
  background-color: var(--color-success);
  color: white;
}

.status.denied {
  background-color: var(--color-danger);
  color: white;
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

/* Responsive design */
@media (max-width: 768px) {
  .room-content {
    grid-template-columns: 1fr;
  }
  
  .room-details, .history-details {
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