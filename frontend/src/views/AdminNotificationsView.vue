<template>
  <div class="admin-notifications">
    <LoadingOverlay :show="loading" message="Értesítések betöltése..." />
    
    <!-- Page Header -->
    <div class="page-header mb-4">
      <div class="d-flex justify-content-between align-items-center">
        <div>
          <h1 class="page-title">
            <i class="bi bi-bell me-2"></i>
            Értesítések kezelése
          </h1>
          <p class="page-subtitle">Értesítések megtekintése, kezelése és létrehozása</p>
        </div>
        <button class="btn btn-primary" @click="showCreateModal = true">
          <i class="bi bi-plus-lg me-2"></i>
          Új üzenet
        </button>
      </div>
    </div>

    <!-- Filters and Actions -->
    <div class="card mb-4">
      <div class="card-body">
        <div class="row align-items-end">
          <div class="col-md-3">
            <label class="form-label">Típus</label>
            <select v-model="filters.tipus" class="form-select">
              <option value="">Összes típus</option>
              <option value="room_change_approved">Szobaváltás jóváhagyva</option>
              <option value="room_change_denied">Szobaváltás elutasítva</option>
              <option value="room_change_pending">Szobaváltás függőben</option>
              <option value="system_announcement">Rendszer bejelentés</option>
              <option value="parent_notification">Szülő értesítés</option>
              <option value="general_alert">Általános figyelmeztetés</option>
            </select>
          </div>
          <div class="col-md-2">
            <label class="form-label">Státusz</label>
            <select v-model="filters.elolvasva" class="form-select">
              <option value="">Összes</option>
              <option value="false">Olvasatlan</option>
              <option value="true">Olvasott</option>
            </select>
          </div>
          <div class="col-md-2">
            <label class="form-label">Prioritás</label>
            <select v-model="filters.prioritas" class="form-select">
              <option value="">Összes</option>
              <option value="low">Alacsony</option>
              <option value="medium">Közepes</option>
              <option value="high">Magas</option>
              <option value="urgent">Sürgős</option>
            </select>
          </div>
          <div class="col-md-3">
            <label class="form-label">Keresés</label>
            <input 
              type="text" 
              v-model="searchQuery" 
              class="form-control" 
              placeholder="Keresés az üzenetben..."
            />
          </div>
          <div class="col-md-2">
            <div class="d-flex gap-2">
              <button class="btn btn-outline-secondary" @click="clearFilters">
                <i class="bi bi-x-lg"></i>
              </button>
              <button class="btn btn-outline-primary" @click="refreshData">
                <i class="bi bi-arrow-clockwise"></i>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Bulk Actions -->
    <div class="card mb-4" v-if="selectedNotifications.length > 0">
      <div class="card-body">
        <div class="d-flex align-items-center justify-content-between">
          <span class="text-muted">{{ selectedNotifications.length }} értesítés kiválasztva</span>
          <div class="d-flex gap-2">
            <button class="btn btn-outline-success btn-sm" @click="markSelectedAsRead">
              <i class="bi bi-check-lg me-1"></i>
              Olvasottnak jelöl
            </button>
            <button class="btn btn-outline-danger btn-sm" @click="deleteSelected">
              <i class="bi bi-trash me-1"></i>
              Törlés
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Notifications Table -->
    <div class="card">
      <div class="card-body p-0">
        <div class="table-responsive">
          <table class="table table-hover mb-0">
            <thead>
              <tr>
                <th style="width: 40px;">
                  <input 
                    type="checkbox" 
                    class="form-check-input"
                    :checked="allSelected"
                    @change="toggleSelectAll"
                  />
                </th>
                <th style="width: 60px;">Prioritás</th>
                <th style="width: 180px;">Típus</th>
                <th>Üzenet</th>
                <th style="width: 120px;">Címzett</th>
                <th style="width: 150px;">Dátum</th>
                <th style="width: 100px;">Státusz</th>
                <th style="width: 120px;">Műveletek</th>
              </tr>
            </thead>
            <tbody>
              <tr 
                v-for="notification in paginatedNotifications" 
                :key="notification.notification_id"
                :class="{ 'table-warning': !notification.elolvasva }"
                @click="openNotificationDetail(notification)"
                style="cursor: pointer;"
              >
                <td>
                  <input 
                    type="checkbox" 
                    class="form-check-input"
                    :value="notification.notification_id"
                    v-model="selectedNotifications"
                  />
                </td>
                <td>
                  <span :class="getPriorityBadgeClass(notification.prioritas)">
                    {{ getPriorityText(notification.prioritas) }}
                  </span>
                </td>
                <td>
                  <span :class="getTypeBadgeClass(notification.tipus)">
                    {{ getTypeText(notification.tipus) }}
                  </span>
                </td>
                <td>
                  <div class="notification-message">{{ notification.uzenet }}</div>
                  <div v-if="notification.diak" class="text-muted small mt-1">
                    <i class="bi bi-person me-1"></i>{{ notification.diak.nev }}
                  </div>
                </td>
                <td>
                  <span :class="getAudienceBadgeClass(notification.cimzettkor)">
                    {{ getAudienceText(notification.cimzettkor) }}
                  </span>
                </td>
                <td>
                  <div class="small">{{ formatDate(notification.created_at) }}</div>
                  <div v-if="notification.olvasva_datum" class="text-muted small">
                    Olvasva: {{ formatDate(notification.olvasva_datum) }}
                  </div>
                </td>
                <td>
                  <span 
                    class="badge"
                    :class="notification.elolvasva ? 'bg-success' : 'bg-warning'"
                  >
                    {{ notification.elolvasva ? 'Olvasott' : 'Olvasatlan' }}
                  </span>
                </td>
                <td>
                  <div class="btn-group btn-group-sm">
                    <!-- Szobaváltási kérelem jóváhagyás/elutasítás -->
                    <template v-if="notification.tipus === 'room_change_pending' && notification.szoba_valtoztatas_id">
                      <button 
                        class="btn btn-success"
                        @click.stop="approveRoomChange(notification)"
                        title="Jóváhagyás"
                      >
                        <i class="bi bi-check-lg"></i>
                      </button>
                      <button 
                        class="btn btn-danger"
                        @click.stop="denyRoomChange(notification)"
                        title="Elutasítás"
                      >
                        <i class="bi bi-x-lg"></i>
                      </button>
                    </template>
                    <button 
                      v-if="!notification.elolvasva"
                      class="btn btn-outline-success"
                      @click.stop="markAsRead(notification)"
                      title="Olvasottnak jelölés"
                    >
                      <i class="bi bi-check"></i>
                    </button>
                    <button 
                      class="btn btn-outline-danger"
                      @click.stop="deleteNotification(notification)"
                      title="Törlés"
                    >
                      <i class="bi bi-trash"></i>
                    </button>
                  </div>
                </td>
              </tr>
              <tr v-if="filteredNotifications.length === 0">
                <td colspan="8" class="text-center py-4 text-muted">
                  <i class="bi bi-inbox fs-1 d-block mb-2"></i>
                  Nincsenek értesítések
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      
      <!-- Pagination -->
      <div class="card-footer" v-if="totalPages > 1">
        <nav>
          <ul class="pagination pagination-sm mb-0 justify-content-center">
            <li class="page-item" :class="{ disabled: currentPage === 1 }">
              <a class="page-link" href="#" @click.prevent="currentPage--">Előző</a>
            </li>
            <li 
              v-for="page in visiblePages" 
              :key="page"
              class="page-item"
              :class="{ active: page === currentPage }"
            >
              <a class="page-link" href="#" @click.prevent="currentPage = page">{{ page }}</a>
            </li>
            <li class="page-item" :class="{ disabled: currentPage === totalPages }">
              <a class="page-link" href="#" @click.prevent="currentPage++">Következő</a>
            </li>
          </ul>
        </nav>
      </div>
    </div>

    <!-- Create Notification Modal -->
    <BaseModal 
      v-model:show="showCreateModal" 
      title="Új üzenet létrehozása"
      size="lg"
    >
      <form @submit.prevent="createNotification">
        <div class="row">
          <div class="col-md-6 mb-3">
            <label class="form-label">Típus *</label>
            <select v-model="newNotification.tipus" class="form-select" required>
              <option value="">Válasszon típust</option>
              <option value="system_announcement">Rendszer bejelentés</option>
              <option value="parent_notification">Szülő értesítés</option>
              <option value="general_alert">Általános figyelmeztetés</option>
              <option value="room_change_approved">Szobaváltás jóváhagyva</option>
              <option value="room_change_denied">Szobaváltás elutasítva</option>
              <option value="room_change_pending">Szobaváltás függőben</option>
            </select>
          </div>
          <div class="col-md-6 mb-3">
            <label class="form-label">Prioritás *</label>
            <select v-model="newNotification.prioritas" class="form-select" required>
              <option value="">Válasszon prioritást</option>
              <option value="low">Alacsony</option>
              <option value="medium">Közepes</option>
              <option value="high">Magas</option>
              <option value="urgent">Sürgős</option>
            </select>
          </div>
        </div>
        <div class="row">
          <div class="col-md-6 mb-3">
            <label class="form-label">Címzett *</label>
            <select v-model="newNotification.cimzettkor" class="form-select" required>
              <option value="">Válasszon címzettet</option>
              <option value="student">Diák</option>
              <option value="admin">Admin</option>
              <option value="both">Mindkettő</option>
            </select>
          </div>
          <div class="col-md-6 mb-3" v-if="newNotification.cimzettkor === 'student'">
            <label class="form-label">Diák (opcionális)</label>
            <select v-model="newNotification.diak_id" class="form-select">
              <option value="">Összes diák</option>
              <option v-for="student in students" :key="student.diak_id" :value="student.diak_id">
                {{ student.nev }}
              </option>
            </select>
            <small class="text-muted">Ha üres, minden diáknak elküldi</small>
          </div>
        </div>
        <div class="mb-3">
          <label class="form-label">Üzenet *</label>
          <textarea 
            v-model="newNotification.uzenet" 
            class="form-control" 
            rows="4"
            required
            placeholder="Írja be az értesítés szövegét..."
          ></textarea>
        </div>
      </form>
      <template #footer>
        <button type="button" class="btn btn-secondary" @click="showCreateModal = false">
          Mégse
        </button>
        <button 
          type="button" 
          class="btn btn-primary" 
          @click="createNotification"
          :disabled="creating"
        >
          <span v-if="creating" class="spinner-border spinner-border-sm me-2"></span>
          Létrehozás
        </button>
      </template>
    </BaseModal>

    <!-- Confirm Dialog -->
    <ConfirmDialog 
      v-model="showConfirmDialog"
      :title="confirmDialog.title"
      :message="confirmDialog.message"
      :type="confirmDialog.type"
      @confirm="confirmDialog.onConfirm"
    />

    <!-- Notification Detail Modal -->
    <NotificationDetailModal
      v-model="showNotificationDetail"
      :notification="selectedNotification"
      @mark-as-read="handleModalMarkAsRead"
    />
  </div>
</template>

<script>
import { ref, computed, onMounted, watch } from 'vue';
import { useAuthStore } from '../store/auth';
import api from '../services/api';
import { toast } from 'vue3-toastify';
import BaseModal from '../components/BaseModal.vue';
import ConfirmDialog from '../components/ConfirmDialog.vue';
import LoadingOverlay from '../components/LoadingOverlay.vue';
import NotificationDetailModal from '../components/NotificationDetailModal.vue';

export default {
  name: 'AdminNotificationsView',
  components: {
    BaseModal,
    ConfirmDialog,
    LoadingOverlay,
    NotificationDetailModal
  },
  setup() {
    const authStore = useAuthStore();
    
    // State
    const loading = ref(false);
    const creating = ref(false);
    const notifications = ref([]);
    const students = ref([]);
    const selectedNotifications = ref([]);
    const searchQuery = ref('');
    const currentPage = ref(1);
    const itemsPerPage = 10;
    
    // Filters
    const filters = ref({
      tipus: '',
      elolvasva: '',
      prioritas: ''
    });
    
    // Modal state
    const showCreateModal = ref(false);
    const showConfirmDialog = ref(false);
    const showNotificationDetail = ref(false);
    const selectedNotification = ref(null);
    const confirmDialog = ref({
      title: '',
      message: '',
      type: 'danger',
      onConfirm: () => {}
    });
    
    // New notification form
    const newNotification = ref({
      tipus: '',
      uzenet: '',
      cimzettkor: '',
      prioritas: '',
      diak_id: ''
    });

    // Computed
    const filteredNotifications = computed(() => {
      let result = notifications.value;
      
      if (filters.value.tipus) {
        result = result.filter(n => n.tipus === filters.value.tipus);
      }
      
      if (filters.value.elolvasva !== '') {
        const isRead = filters.value.elolvasva === 'true';
        result = result.filter(n => n.elolvasva === isRead);
      }
      
      if (filters.value.prioritas) {
        result = result.filter(n => n.prioritas === filters.value.prioritas);
      }
      
      if (searchQuery.value) {
        const query = searchQuery.value.toLowerCase();
        result = result.filter(n => 
          n.uzenet.toLowerCase().includes(query) ||
          (n.diak && n.diak.nev.toLowerCase().includes(query))
        );
      }
      
      return result;
    });

    const totalPages = computed(() => 
      Math.ceil(filteredNotifications.value.length / itemsPerPage)
    );

    const paginatedNotifications = computed(() => {
      const start = (currentPage.value - 1) * itemsPerPage;
      return filteredNotifications.value.slice(start, start + itemsPerPage);
    });

    const visiblePages = computed(() => {
      const pages = [];
      const start = Math.max(1, currentPage.value - 2);
      const end = Math.min(totalPages.value, start + 4);
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
      return pages;
    });

    const allSelected = computed(() => 
      paginatedNotifications.value.length > 0 &&
      paginatedNotifications.value.every(n => selectedNotifications.value.includes(n.notification_id))
    );

    // Methods
    const fetchNotifications = async () => {
      loading.value = true;
      try {
        const response = await api.get('/room-changes/admin/notifications');
        if (response.data.success) {
          notifications.value = response.data.data;
        }
      } catch (error) {
        console.error('Error fetching notifications:', error);
        toast.error('Hiba az értesítések betöltésekor');
      } finally {
        loading.value = false;
      }
    };

    const fetchStudents = async () => {
      try {
        const response = await api.get('/students');
        if (response.data.success) {
          students.value = response.data.data;
        }
      } catch (error) {
        console.error('Error fetching students:', error);
      }
    };

    const refreshData = async () => {
      await fetchNotifications();
      toast.success('Adatok frissítve');
    };

    const clearFilters = () => {
      filters.value = { tipus: '', elolvasva: '', prioritas: '' };
      searchQuery.value = '';
      currentPage.value = 1;
    };

    const toggleSelectAll = () => {
      if (allSelected.value) {
        selectedNotifications.value = [];
      } else {
        selectedNotifications.value = paginatedNotifications.value.map(n => n.notification_id);
      }
    };

    const markAsRead = async (notification) => {
      try {
        await api.put(`/room-changes/admin/notifications/${notification.notification_id}/read`);
        notification.elolvasva = true;
        notification.olvasva_datum = new Date().toISOString();
        toast.success('Értesítés olvasottnak jelölve');
      } catch (error) {
        console.error('Error marking as read:', error);
        toast.error('Hiba az olvasottnak jelöléskor');
      }
    };

    const markSelectedAsRead = async () => {
      try {
        await Promise.all(
          selectedNotifications.value.map(id => 
            api.put(`/room-changes/admin/notifications/${id}/read`)
          )
        );
        selectedNotifications.value = [];
        await fetchNotifications();
        toast.success('Kiválasztott értesítések olvasottnak jelölve');
      } catch (error) {
        console.error('Error marking selected as read:', error);
        toast.error('Hiba a jelölés során');
      }
    };

    const deleteNotification = (notification) => {
      confirmDialog.value = {
        title: 'Értesítés törlése',
        message: `Biztosan törölni szeretné ezt az értesítést?`,
        type: 'danger',
        onConfirm: async () => {
          try {
            await api.delete(`/room-changes/admin/notifications/${notification.notification_id}`);
            await fetchNotifications();
            toast.success('Értesítés törölve');
          } catch (error) {
            console.error('Error deleting notification:', error);
            toast.error('Hiba a törlés során');
          }
        }
      };
      showConfirmDialog.value = true;
    };

    const deleteSelected = () => {
      confirmDialog.value = {
        title: 'Értesítések törlése',
        message: `Biztosan törölni szeretné a kiválasztott ${selectedNotifications.value.length} értesítést?`,
        type: 'danger',
        onConfirm: async () => {
          try {
            await Promise.all(
              selectedNotifications.value.map(id => 
                api.delete(`/room-changes/admin/notifications/${id}`)
              )
            );
            selectedNotifications.value = [];
            await fetchNotifications();
            toast.success('Kiválasztott értesítések törölve');
          } catch (error) {
            console.error('Error deleting selected:', error);
            toast.error('Hiba a törlés során');
          }
        }
      };
      showConfirmDialog.value = true;
    };

    const createNotification = async () => {
      creating.value = true;
      try {
        const payload = { ...newNotification.value };
        if (!payload.diak_id) {
          delete payload.diak_id;
        }
        
        await api.post('/room-changes/admin/notifications', payload);
        showCreateModal.value = false;
        newNotification.value = {
          tipus: '',
          uzenet: '',
          cimzettkor: '',
          prioritas: '',
          diak_id: ''
        };
        await fetchNotifications();
        toast.success('Értesítés létrehozva');
      } catch (error) {
        console.error('Error creating notification:', error);
        toast.error('Hiba a létrehozás során');
      } finally {
        creating.value = false;
      }
    };

    // Modal functions
    const openNotificationDetail = (notification) => {
      selectedNotification.value = notification;
      showNotificationDetail.value = true;
    };

    const handleModalMarkAsRead = (notification) => {
      markAsRead(notification);
    };

    // Szobaváltási kérelem jóváhagyás
    const approveRoomChange = async (notification) => {
      if (!notification.szoba_valtoztatas_id) {
        toast.error('Hiányzó kérelem azonosító');
        return;
      }
      
      try {
        await api.put(`/room-changes/students/room-change-requests/${notification.szoba_valtoztatas_id}`, {
          statusz: 'approved'
        });
        toast.success('Szobaváltás jóváhagyva');
        await fetchNotifications();
      } catch (error) {
        console.error('Error approving room change:', error);
        toast.error('Hiba a jóváhagyás során');
      }
    };

    // Szobaváltási kérelem elutasítás
    const denyRoomChange = async (notification) => {
      if (!notification.szoba_valtoztatas_id) {
        toast.error('Hiányzó kérelem azonosító');
        return;
      }
      
      try {
        await api.put(`/room-changes/students/room-change-requests/${notification.szoba_valtoztatas_id}`, {
          statusz: 'denied'
        });
        toast.success('Szobaváltás elutasítva');
        await fetchNotifications();
      } catch (error) {
        console.error('Error denying room change:', error);
        toast.error('Hiba az elutasítás során');
      }
    };

    // Helper functions
    const getTypeText = (type) => {
      const map = {
        'room_change_approved': 'Szobaváltás jóváhagyva',
        'room_change_denied': 'Szobaváltás elutasítva',
        'room_change_pending': 'Szobaváltás függőben',
        'system_announcement': 'Rendszer bejelentés',
        'parent_notification': 'Szülő értesítés',
        'general_alert': 'Általános figyelmeztetés'
      };
      return map[type] || type;
    };

    const getTypeBadgeClass = (type) => {
      const map = {
        'room_change_approved': 'badge bg-success',
        'room_change_denied': 'badge bg-danger',
        'room_change_pending': 'badge bg-warning',
        'system_announcement': 'badge bg-info',
        'parent_notification': 'badge bg-primary',
        'general_alert': 'badge bg-secondary'
      };
      return map[type] || 'badge bg-secondary';
    };

    const getPriorityText = (priority) => {
      const map = {
        'low': 'Alacsony',
        'medium': 'Közepes',
        'high': 'Magas',
        'urgent': 'Sürgős'
      };
      return map[priority] || priority;
    };

    const getPriorityBadgeClass = (priority) => {
      const map = {
        'low': 'badge bg-secondary',
        'medium': 'badge bg-info',
        'high': 'badge bg-warning',
        'urgent': 'badge bg-danger'
      };
      return map[priority] || 'badge bg-secondary';
    };

    const getAudienceText = (audience) => {
      const map = {
        'admin': 'Admin',
        'student': 'Diák',
        'both': 'Mindkettő'
      };
      return map[audience] || audience;
    };

    const getAudienceBadgeClass = (audience) => {
      const map = {
        'admin': 'badge bg-primary',
        'student': 'badge bg-success',
        'both': 'badge bg-info'
      };
      return map[audience] || 'badge bg-secondary';
    };

    const formatDate = (dateString) => {
      if (!dateString) return '';
      const date = new Date(dateString);
      return date.toLocaleString('hu-HU', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    };

    // Lifecycle
    onMounted(() => {
      fetchNotifications();
      fetchStudents();
    });

    // Reset page when filters change
    watch(filters, () => {
      currentPage.value = 1;
    }, { deep: true });

    watch(searchQuery, () => {
      currentPage.value = 1;
    });

    return {
      // State
      loading,
      creating,
      notifications,
      students,
      selectedNotifications,
      searchQuery,
      currentPage,
      filters,
      showCreateModal,
      showConfirmDialog,
      confirmDialog,
      newNotification,
      showNotificationDetail,
      selectedNotification,
      
      // Computed
      filteredNotifications,
      totalPages,
      paginatedNotifications,
      visiblePages,
      allSelected,
      
      // Methods
      refreshData,
      clearFilters,
      toggleSelectAll,
      markAsRead,
      markSelectedAsRead,
      deleteNotification,
      deleteSelected,
      createNotification,
      getTypeText,
      getTypeBadgeClass,
      getPriorityText,
      getPriorityBadgeClass,
      getAudienceText,
      getAudienceBadgeClass,
      formatDate,
      openNotificationDetail,
      handleModalMarkAsRead,
      approveRoomChange,
      denyRoomChange
    };
  }
};
</script>

<style scoped>
.admin-notifications {
  padding: 1.5rem;
}

.page-header {
  margin-bottom: 1.5rem;
}

.page-title {
  font-size: 1.75rem;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 0.25rem;
}

.page-subtitle {
  color: var(--text-secondary);
  margin-bottom: 0;
}

.notification-message {
  max-width: 300px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.table-warning {
  background-color: rgba(255, 193, 7, 0.1) !important;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .admin-notifications {
    padding: 1rem;
  }
  
  .page-title {
    font-size: 1.5rem;
  }
}
</style>