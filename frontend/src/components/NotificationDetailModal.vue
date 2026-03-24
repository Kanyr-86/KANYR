<template>
  <BaseModal 
    v-model:show="isOpen" 
    :title="getTitle"
    size="lg"
  >
    <div v-if="notification" class="notification-detail">
      <!-- Header with badges -->
      <div class="notification-header mb-3">
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

      <!-- Full message content -->
      <div class="notification-message mb-4">
        <h6 class="text-muted mb-2">Üzenet</h6>
        <div class="message-content p-3 bg-light rounded">
          {{ notification.uzenet }}
        </div>
      </div>

      <!-- Student information -->
      <div v-if="notification.diak" class="notification-student mb-4">
        <h6 class="text-muted mb-2">Diák adatok</h6>
        <div class="student-info p-3 bg-light rounded">
          <div class="row">
            <div class="col-md-6">
              <strong>Név:</strong> {{ notification.diak.nev }}
            </div>
            <div class="col-md-6" v-if="notification.diak.email">
              <strong>Email:</strong> {{ notification.diak.email }}
            </div>
          </div>
          <div class="row mt-2" v-if="notification.diak.telefonszam">
            <div class="col-md-6">
              <strong>Telefon:</strong> {{ notification.diak.telefonszam }}
            </div>
          </div>
        </div>
      </div>

      <!-- Room change details -->
      <div v-if="notification.szoba_valtoztatas" class="notification-room-change mb-4">
        <h6 class="text-muted mb-2">Szobaváltás részletek</h6>
        <div class="room-change-info p-3 bg-light rounded">
          <div class="row">
            <div class="col-md-6">
              <strong>Jelenlegi szoba:</strong> 
              {{ notification.szoba_valtoztatas.jelenlegi_szoba?.szoba_szama || 'N/A' }}
            </div>
            <div class="col-md-6">
              <strong>Kívánt szoba:</strong> 
              {{ notification.szoba_valtoztatas.kivant_szoba?.szoba_szama || 'N/A' }}
            </div>
          </div>
        </div>
      </div>

      <!-- Timestamp -->
      <div class="notification-timestamp">
        <h6 class="text-muted mb-2">Időbélyeg</h6>
        <div class="timestamp-info p-3 bg-light rounded">
          <div class="row">
            <div class="col-md-6">
              <strong>Létrehozva:</strong> {{ formatDate(notification.created_at) }}
            </div>
            <div class="col-md-6" v-if="notification.olvasva_datum">
              <strong>Olvasva:</strong> {{ formatDate(notification.olvasva_datum) }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <button 
        v-if="notification && !notification.elolvasva"
        type="button" 
        class="btn btn-success"
        @click="markAsRead"
      >
        <i class="bi bi-check-lg me-1"></i>
        Olvasottnak jelölés
      </button>
      <button 
        type="button" 
        class="btn btn-secondary" 
        @click="closeModal"
      >
        Bezárás
      </button>
    </template>
  </BaseModal>
</template>

<script>
import { computed } from 'vue';
import BaseModal from './BaseModal.vue';

export default {
  name: 'NotificationDetailModal',
  components: {
    BaseModal
  },
  props: {
    modelValue: {
      type: Boolean,
      default: false
    },
    notification: {
      type: Object,
      default: null
    }
  },
  emits: ['update:modelValue', 'mark-as-read'],
  setup(props, { emit }) {
    const isOpen = computed({
      get: () => props.modelValue,
      set: (value) => emit('update:modelValue', value)
    });

    const getTitle = computed(() => {
      if (!props.notification) return 'Értesítés';
      return getTypeText(props.notification.tipus);
    });

    const closeModal = () => {
      isOpen.value = false;
    };

    const markAsRead = () => {
      if (props.notification) {
        emit('mark-as-read', props.notification);
        closeModal();
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
      return map[type] || 'Értesítés';
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

    return {
      isOpen,
      getTitle,
      closeModal,
      markAsRead,
      getTypeText,
      getTypeBadgeClass,
      getPriorityText,
      getPriorityBadgeClass,
      formatDate
    };
  }
};
</script>

<style scoped>
.notification-detail {
  line-height: 1.6;
}

.notification-header {
  padding-bottom: 1rem;
  border-bottom: 1px solid var(--border-primary);
}

.notification-message .message-content {
  font-size: 1rem;
  line-height: 1.8;
  white-space: pre-wrap;
  word-wrap: break-word;
}

.notification-student .student-info,
.notification-room-change .room-change-info,
.notification-timestamp .timestamp-info {
  font-size: 0.9rem;
}

.notification-student strong,
.notification-room-change strong,
.notification-timestamp strong {
  color: var(--text-primary);
}

h6 {
  font-size: 0.875rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
</style>