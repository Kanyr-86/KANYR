<template>
  <div class="student-notifications">
    <LoadingOverlay :show="loadingNotifications" message="Értesítések betöltése..." />
    
    <!-- Page Header -->
    <div class="page-header mb-4">
      <div class="d-flex justify-content-between align-items-center">
        <div>
          <h1 class="page-title">
            <i class="bi bi-bell me-2"></i>
            Értesítések
          </h1>
          <p class="page-subtitle">Értesítések megtekintése és kezelése</p>
        </div>
        <button class="btn btn-outline-primary" @click="getNotifications">
          <i class="bi bi-arrow-clockwise me-2"></i>
          Frissítés
        </button>
      </div>
    </div>

    <!-- Filters -->
    <div class="card mb-4">
      <div class="card-body">
        <div class="row align-items-end">
          <div class="col-md-4">
            <label class="form-label">Típus</label>
            <select v-model="filters.tipus" class="form-select">
              <option value="">Összes típus</option>
              <option value="room_change_approved">Szobaváltás jóváhagyva</option>
              <option value="room_change_denied">Szobaváltás elutasítva</option>
              <option value="room_change_pending">Szobaváltás függőben</option>
              <option value="system_announcement">Rendszer bejelentés</option>
              <option value="student_notification">Diák értesítés</option>
              <option value="general_alert">Általános figyelmeztetés</option>
            </select>
          </div>
          <div class="col-md-4">
            <label class="form-label">Státusz</label>
            <select v-model="filters.elolvasva" class="form-select">
              <option value="">Összes</option>
              <option value="false">Olvasatlan</option>
              <option value="true">Olvasott</option>
            </select>
          </div>
          <div class="col-md-4">
            <div class="d-flex gap-2">
              <button class="btn btn-outline-secondary flex-grow-1" @click="clearFilters">
                <i class="bi bi-x-lg me-1"></i>
                Szűrők törlése
              </button>
              <button 
                v-if="unreadCount > 0"
                class="btn btn-primary"
                @click="markAllAsRead"
              >
                <i class="bi bi-check-all me-1"></i>
                Összes olvasott
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Notifications List -->
    <div class="card">
      <div class="card-body p-0">
        <div v-if="filteredNotifications.length === 0" class="text-center py-5">
          <i class="bi bi-inbox fs-1 text-muted d-block mb-3"></i>
          <h5 class="text-muted">Nincsenek értesítések</h5>
          <p class="text-muted mb-0">
            {{ filters.tipus || filters.elolvasva !== '' ? 'Nincs a szűrőknek megfelelő értesítés.' : 'Még nem érkezett új értesítés.' }}
          </p>
        </div>
        <div v-else class="list-group list-group-flush">
          <div 
            v-for="notification in paginatedNotifications" 
            :key="notification.notification_id" 
            class="list-group-item list-group-item-action notification-item"
            :class="{ 'unread': !notification.elolvasva }"
            @click="openNotificationDetail(notification)"
          >
            <div class="d-flex w-100 justify-content-between align-items-start">
              <div class="flex-grow-1">
                <div class="d-flex align-items-center mb-2">
                  <span :class="getTypeBadgeClass(notification.tipus)" class="me-2">
                    {{ getTypeText(notification.tipus) }}
                  </span>
                  <span 
                    v-if="notification.prioritas"
                    :class="getPriorityBadgeClass(notification.prioritas)"
                    class="me-2"
                  >
                    {{ getPriorityText(notification.prioritas) }}
                  </span>
                  <span 
                    class="badge"
                    :class="notification.elolvasva ? 'bg-success' : 'bg-warning'"
                  >
                    {{ notification.elolvasva ? 'Olvasott' : 'Olvasatlan' }}
                  </span>
                </div>
                <p class="mb-1 notification-message">{{ notification.uzenet }}</p>
                <small class="text-muted">
                  <i class="bi bi-clock me-1"></i>
                  {{ formatDate(notification.created_at) }}
                </small>
              </div>
              <div class="ms-3">
                <div v-if="!notification.elolvasva" class="unread-indicator"></div>
                <i v-else class="bi bi-check-circle text-success"></i>
              </div>
            </div>
          </div>
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

    <!-- Notification Detail Modal -->
    <NotificationDetailModal
      v-model="showNotificationDetail"
      :notification="selectedNotification"
      @mark-as-read="handleModalMarkAsRead"
    />
  </div>
</template>

<script>
import { ref, onMounted, computed, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../store/auth';
import { studentApi } from '../services/api';
import { toast } from 'vue3-toastify';
import LoadingOverlay from '../components/LoadingOverlay.vue';
import NotificationDetailModal from '../components/NotificationDetailModal.vue';

export default {
  name: 'StudentNotifications',
  components: {
    LoadingOverlay,
    NotificationDetailModal
  },
  setup() {
    const router = useRouter();
    const authStore = useAuthStore();
    
    const notifications = ref([]);
    const loadingNotifications = ref(false);
    const currentPage = ref(1);
    const itemsPerPage = 10;

    // Filters
    const filters = ref({
      tipus: '',
      elolvasva: ''
    });

    // Modal state
    const showNotificationDetail = ref(false);
    const selectedNotification = ref(null);

    const user = computed(() => authStore.user);

    const logout = () => {
      authStore.logout();
      router.push('/login');
    };

    const getNotifications = async () => {
      loadingNotifications.value = true;
      try {
        const response = await studentApi.get('/notifications');
        notifications.value.splice(0, notifications.value.length, ...response.data.data);
      } catch (error) {
        console.error('Hiba az értesítések lekérésekor:', error);
        toast.error('Hiba az értesítések betöltésekor');
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
          toast.success('Értesítés olvasottnak jelölve');
        }
      } catch (error) {
        console.error('Hiba az értesítés olvasottnak jelölésekor:', error);
        toast.error('Hiba az olvasottnak jelöléskor');
      }
    };

    const markAllAsRead = async () => {
      try {
        await studentApi.put('/notifications/read-all');
        notifications.value.forEach(notification => {
          notification.elolvasva = true;
        });
        toast.success('Összes értesítés olvasottnak jelölve');
      } catch (error) {
        console.error('Hiba az összes értesítés olvasottnak jelölésekor:', error);
        toast.error('Hiba az összes jelölésekor');
      }
    };

    const formatDate = (dateString) => {
      const date = new Date(dateString);
      return date.toLocaleString('hu-HU', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    };

    const clearFilters = () => {
      filters.value = { tipus: '', elolvasva: '' };
      currentPage.value = 1;
    };

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

    const unreadCount = computed(() => {
      return notifications.value.filter(n => !n.elolvasva).length;
    });

    // Helper functions
    const getTypeText = (type) => {
      const map = {
        'room_change_approved': 'Szobaváltás jóváhagyva',
        'room_change_denied': 'Szobaváltás elutasítva',
        'room_change_pending': 'Szobaváltás függőben',
        'system_announcement': 'Rendszer bejelentés',
        'student_notification': 'Diák értesítés',
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
        'student_notification': 'badge bg-primary',
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

    // Modal functions
    const openNotificationDetail = (notification) => {
      selectedNotification.value = notification;
      showNotificationDetail.value = true;
    };

    const handleModalMarkAsRead = (notification) => {
      markAsRead(notification.notification_id);
    };

    // Lifecycle
    onMounted(() => {
      getNotifications();
    });

    // Reset page when filters change
    watch(filters, () => {
      currentPage.value = 1;
    }, { deep: true });

    return {
      notifications,
      loadingNotifications,
      user,
      filters,
      currentPage,
      filteredNotifications,
      totalPages,
      paginatedNotifications,
      visiblePages,
      logout,
      markAsRead,
      markAllAsRead,
      formatDate,
      clearFilters,
      getTypeText,
      getTypeBadgeClass,
      getPriorityText,
      getPriorityBadgeClass,
      unreadCount,
      getNotifications,
      showNotificationDetail,
      selectedNotification,
      openNotificationDetail,
      handleModalMarkAsRead
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