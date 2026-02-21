<template>
  <div class="room-change-requests">
    <div class="page-header">
      <h1>Szobaváltási kérelmek</h1>
      <div class="filter-section">
        <label for="statusFilter">Szűrés státusz szerint:</label>
        <select id="statusFilter" v-model="selectedStatus" @change="fetchRequests" class="form-select">
          <option value="">Összes</option>
          <option value="pending">Függőben</option>
          <option value="approved">Jóváhagyva</option>
          <option value="denied">Elutasítva</option>
        </select>
      </div>
    </div>

    <div class="content">
      <!-- Loading state -->
      <div v-if="loading" class="loading-container">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">Betöltés...</span>
        </div>
        <p>Kérelmek betöltése...</p>
      </div>

      <!-- Empty state -->
      <div v-else-if="requests.length === 0" class="empty-state">
        <i class="bi bi-inbox"></i>
        <h3>Nincsenek kérelmek</h3>
        <p v-if="selectedStatus">Nincs {{ getStatusText(selectedStatus) }} státuszú kérelem.</p>
        <p v-else>Még nem érkezett szobaváltási kérelem.</p>
      </div>

      <!-- Requests list -->
      <div v-else class="requests-list">
        <div 
          v-for="request in requests" 
          :key="request.valtoztatas_id" 
          class="request-card"
          :class="request.statusz"
        >
          <div class="request-header">
            <div class="student-info">
              <h4>{{ request.diak?.nev || 'Ismeretlen diák' }}</h4>
              <span class="student-email">{{ request.diak?.email }}</span>
            </div>
            <div class="status-badge" :class="request.statusz">
              {{ getStatusText(request.statusz) }}
            </div>
          </div>

          <div class="request-body">
            <div class="room-info">
              <div class="room-current">
                <span class="label">Jelenlegi szoba:</span>
                <span class="value">{{ request.jelenlegi_szoba?.szoba_szama || '-' }}</span>
              </div>
              <div class="room-arrow">
                <i class="bi bi-arrow-right"></i>
              </div>
              <div class="room-requested">
                <span class="label">Kívánt szoba:</span>
                <span class="value">{{ request.kivant_szoba?.szoba_szama || '-' }}</span>
              </div>
            </div>

            <div v-if="request.indok" class="reason">
              <span class="label">Indoklás:</span>
              <p>{{ request.indok }}</p>
            </div>

            <div class="request-meta">
              <span class="date">
                <i class="bi bi-calendar"></i>
                {{ formatDate(request.created_at) }}
              </span>
              <span v-if="request.academic_year" class="academic-year">
                <i class="bi bi-book"></i>
                {{ request.academic_year }}. tanév
              </span>
            </div>
          </div>

          <div v-if="request.statusz === 'pending'" class="request-actions">
            <button 
              class="btn btn-approve" 
              @click="openApproveModal(request)"
              :disabled="processingId === request.valtoztatas_id"
            >
              <i class="bi bi-check-circle"></i>
              Jóváhagyás
            </button>
            <button 
              class="btn btn-reject" 
              @click="openRejectModal(request)"
              :disabled="processingId === request.valtoztatas_id"
            >
              <i class="bi bi-x-circle"></i>
              Elutasítás
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Approve Confirmation Modal -->
    <div v-if="showApproveModal" class="modal-overlay" @click.self="closeModals">
      <div class="modal-content">
        <div class="modal-header">
          <h3>Kérelem jóváhagyása</h3>
          <button class="modal-close" @click="closeModals">&times;</button>
        </div>
        <div class="modal-body">
          <p>Biztosan jóváhagyja a következő kérelmet?</p>
          <div class="modal-info">
            <p><strong>Diák:</strong> {{ selectedRequest?.diak?.nev }}</p>
            <p><strong>Jelenlegi szoba:</strong> {{ selectedRequest?.jelenlegi_szoba?.szoba_szama }}</p>
            <p><strong>Új szoba:</strong> {{ selectedRequest?.kivant_szoba?.szoba_szama }}</p>
          </div>
          <p class="warning-text">
            <i class="bi bi-exclamation-triangle"></i>
            A diák át lesz költöztetve az új szobába.
          </p>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="closeModals">Mégsem</button>
          <button class="btn btn-approve" @click="confirmApprove" :disabled="processing">
            <span v-if="processing" class="spinner-border spinner-border-sm me-2"></span>
            Jóváhagyás
          </button>
        </div>
      </div>
    </div>

    <!-- Reject Modal -->
    <div v-if="showRejectModal" class="modal-overlay" @click.self="closeModals">
      <div class="modal-content">
        <div class="modal-header">
          <h3>Kérelem elutasítása</h3>
          <button class="modal-close" @click="closeModals">&times;</button>
        </div>
        <div class="modal-body">
          <p>Biztosan elutasítja a következő kérelmet?</p>
          <div class="modal-info">
            <p><strong>Diák:</strong> {{ selectedRequest?.diak?.nev }}</p>
            <p><strong>Kívánt szoba:</strong> {{ selectedRequest?.kivant_szoba?.szoba_szama }}</p>
          </div>
          <div class="form-group">
            <label for="rejectReason">Elutasítás indoka (opcionális):</label>
            <textarea 
              id="rejectReason" 
              v-model="rejectReason" 
              class="form-control"
              placeholder="Kérjük, adja meg az elutasítás okát..."
              rows="3"
            ></textarea>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="closeModals">Mégsem</button>
          <button class="btn btn-reject" @click="confirmReject" :disabled="processing">
            <span v-if="processing" class="spinner-border spinner-border-sm me-2"></span>
            Elutasítás
          </button>
        </div>
      </div>
    </div>

    <!-- Toast notification -->
    <div v-if="toast.show" class="toast-container">
      <div class="toast" :class="toast.type">
        <i :class="toast.icon"></i>
        {{ toast.message }}
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue';
import api from '../services/api';

export default {
  name: 'RoomChangeRequestsView',
  setup() {
    const requests = ref([]);
    const loading = ref(false);
    const processing = ref(false);
    const processingId = ref(null);
    const selectedStatus = ref('');
    const selectedRequest = ref(null);
    const showApproveModal = ref(false);
    const showRejectModal = ref(false);
    const rejectReason = ref('');
    const toast = ref({
      show: false,
      type: '',
      message: '',
      icon: ''
    });

    const fetchRequests = async () => {
      loading.value = true;
      try {
        const params = selectedStatus.value ? { status: selectedStatus.value } : {};
        const response = await api.get('/szobavaltoztatas/students/room-change-requests', { params });
        
        if (response.data.success) {
          requests.value = response.data.data;
        } else {
          showToast('error', 'Hiba történt a kérelmek lekérésekor');
        }
      } catch (error) {
        console.error('Hiba a kérelmek lekérésekor:', error);
        showToast('error', 'Nem sikerült betölteni a kérelmeket');
      } finally {
        loading.value = false;
      }
    };

    const openApproveModal = (request) => {
      selectedRequest.value = request;
      showApproveModal.value = true;
    };

    const openRejectModal = (request) => {
      selectedRequest.value = request;
      rejectReason.value = '';
      showRejectModal.value = true;
    };

    const closeModals = () => {
      showApproveModal.value = false;
      showRejectModal.value = false;
      selectedRequest.value = null;
      rejectReason.value = '';
    };

    const confirmApprove = async () => {
      if (!selectedRequest.value) return;
      
      processing.value = true;
      processingId.value = selectedRequest.value.valtoztatas_id;
      
      try {
        const response = await api.put(`/szobavaltoztatas/${selectedRequest.value.valtoztatas_id}/approve`);
        
        if (response.data.success) {
          showToast('success', 'Kérelem sikeresen jóváhagyva');
          await fetchRequests();
        } else {
          showToast('error', response.data.error || 'Hiba történt a jóváhagyás során');
        }
      } catch (error) {
        console.error('Hiba a jóváhagyás során:', error);
        showToast('error', error.response?.data?.error || 'Nem sikerült jóváhagyni a kérelmet');
      } finally {
        processing.value = false;
        processingId.value = null;
        closeModals();
      }
    };

    const confirmReject = async () => {
      if (!selectedRequest.value) return;
      
      processing.value = true;
      processingId.value = selectedRequest.value.valtoztatas_id;
      
      try {
        const response = await api.put(`/szobavaltoztatas/${selectedRequest.value.valtoztatas_id}/reject`, {
          indok: rejectReason.value || null
        });
        
        if (response.data.success) {
          showToast('success', 'Kérelem sikeresen elutasítva');
          await fetchRequests();
        } else {
          showToast('error', response.data.error || 'Hiba történt az elutasítás során');
        }
      } catch (error) {
        console.error('Hiba az elutasítás során:', error);
        showToast('error', error.response?.data?.error || 'Nem sikerült elutasítani a kérelmet');
      } finally {
        processing.value = false;
        processingId.value = null;
        closeModals();
      }
    };

    const getStatusText = (status) => {
      const statusMap = {
        pending: 'Függőben',
        approved: 'Jóváhagyva',
        denied: 'Elutasítva'
      };
      return statusMap[status] || status;
    };

    const formatDate = (dateString) => {
      const date = new Date(dateString);
      return date.toLocaleDateString('hu-HU', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    };

    const showToast = (type, message) => {
      const icons = {
        success: 'bi bi-check-circle',
        error: 'bi bi-exclamation-circle',
        warning: 'bi bi-exclamation-triangle'
      };
      
      toast.value = {
        show: true,
        type,
        message,
        icon: icons[type] || 'bi bi-info-circle'
      };
      
      setTimeout(() => {
        toast.value.show = false;
      }, 4000);
    };

    onMounted(() => {
      fetchRequests();
    });

    return {
      requests,
      loading,
      processing,
      processingId,
      selectedStatus,
      selectedRequest,
      showApproveModal,
      showRejectModal,
      rejectReason,
      toast,
      fetchRequests,
      openApproveModal,
      openRejectModal,
      closeModals,
      confirmApprove,
      confirmReject,
      getStatusText,
      formatDate
    };
  }
};
</script>

<style scoped>
.room-change-requests {
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
  flex-wrap: wrap;
  gap: 1rem;
}

.page-header h1 {
  margin: 0;
  color: #ffffff;
  font-size: 2rem;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.3);
}

.filter-section {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.filter-section label {
  color: var(--powder-blue, #a7cced);
  font-weight: 500;
}

.form-select {
  padding: 0.5rem 1rem;
  border: 1px solid var(--steel-blue, #82a0bc);
  border-radius: 4px;
  background-color: #fff;
  font-size: 0.9rem;
  min-width: 150px;
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem;
  color: #666;
}

.empty-state {
  text-align: center;
  padding: 3rem;
  color: #666;
}

.empty-state i {
  font-size: 4rem;
  color: #ccc;
  margin-bottom: 1rem;
}

.empty-state h3 {
  margin: 0 0 0.5rem;
  color: #333;
}

.requests-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.request-card {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  border-left: 4px solid #ccc;
}

.request-card.pending {
  border-left-color: #ffc107;
}

.request-card.approved {
  border-left-color: #28a745;
}

.request-card.denied {
  border-left-color: #dc3545;
}

.request-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.5rem;
  background-color: #f8f9fa;
  border-bottom: 1px solid #e9ecef;
}

.student-info h4 {
  margin: 0;
  color: #333;
  font-size: 1.1rem;
}

.student-email {
  font-size: 0.85rem;
  color: #666;
}

.status-badge {
  padding: 0.35rem 0.75rem;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 600;
  text-transform: uppercase;
}

.status-badge.pending {
  background-color: #fff3cd;
  color: #856404;
}

.status-badge.approved {
  background-color: #d4edda;
  color: #155724;
}

.status-badge.denied {
  background-color: #f8d7da;
  color: #721c24;
}

.request-body {
  padding: 1.5rem;
}

.room-info {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
  flex-wrap: wrap;
}

.room-current,
.room-requested {
  flex: 1;
  min-width: 150px;
}

.room-info .label {
  display: block;
  font-size: 0.8rem;
  color: #666;
  margin-bottom: 0.25rem;
}

.room-info .value {
  font-size: 1.25rem;
  font-weight: 600;
  color: #333;
}

.room-arrow {
  color: var(--steel-blue, #82a0bc);
  font-size: 1.5rem;
}

.reason {
  background-color: #f8f9fa;
  padding: 1rem;
  border-radius: 4px;
  margin-bottom: 1rem;
}

.reason .label {
  font-size: 0.8rem;
  color: #666;
  margin-bottom: 0.25rem;
}

.reason p {
  margin: 0;
  color: #333;
}

.request-meta {
  display: flex;
  gap: 1.5rem;
  font-size: 0.85rem;
  color: #666;
}

.request-meta i {
  margin-right: 0.5rem;
}

.request-actions {
  display: flex;
  gap: 0.75rem;
  padding: 1rem 1.5rem;
  background-color: #f8f9fa;
  border-top: 1px solid #e9ecef;
}

.btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.6rem 1.2rem;
  border-radius: 4px;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  border: none;
  transition: all 0.2s;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-approve {
  background-color: #28a745;
  color: white;
}

.btn-approve:hover:not(:disabled) {
  background-color: #218838;
}

.btn-reject {
  background-color: #dc3545;
  color: white;
}

.btn-reject:hover:not(:disabled) {
  background-color: #c82333;
}

.btn-secondary {
  background-color: #6c757d;
  color: white;
}

.btn-secondary:hover:not(:disabled) {
  background-color: #5a6268;
}

/* Modal styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1050;
}

.modal-content {
  background: white;
  border-radius: 8px;
  width: 100%;
  max-width: 500px;
  margin: 1rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid #e9ecef;
}

.modal-header h3 {
  margin: 0;
  font-size: 1.25rem;
  color: #333;
}

.modal-close {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #666;
  padding: 0;
  line-height: 1;
}

.modal-close:hover {
  color: #333;
}

.modal-body {
  padding: 1.5rem;
}

.modal-info {
  background-color: #f8f9fa;
  padding: 1rem;
  border-radius: 4px;
  margin: 1rem 0;
}

.modal-info p {
  margin: 0.5rem 0;
}

.warning-text {
  color: #856404;
  background-color: #fff3cd;
  padding: 0.75rem;
  border-radius: 4px;
  margin-top: 1rem;
}

.warning-text i {
  margin-right: 0.5rem;
}

.form-group {
  margin-top: 1rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: #333;
}

.form-control {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #ced4da;
  border-radius: 4px;
  font-size: 0.9rem;
}

.form-control:focus {
  outline: none;
  border-color: #007bff;
  box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  padding: 1rem 1.5rem;
  border-top: 1px solid #e9ecef;
  background-color: #f8f9fa;
}

/* Toast styles */
.toast-container {
  position: fixed;
  bottom: 2rem;
  right: 2rem;
  z-index: 1100;
}

.toast {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem 1.5rem;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  animation: slideIn 0.3s ease;
}

@keyframes slideIn {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

.toast.success {
  background-color: #d4edda;
  color: #155724;
}

.toast.error {
  background-color: #f8d7da;
  color: #721c24;
}

.toast.warning {
  background-color: #fff3cd;
  color: #856404;
}

/* Responsive */
@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .room-info {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .room-arrow {
    transform: rotate(90deg);
    align-self: center;
  }
  
  .request-meta {
    flex-direction: column;
    gap: 0.5rem;
  }
  
  .request-actions {
    flex-direction: column;
  }
}
</style>