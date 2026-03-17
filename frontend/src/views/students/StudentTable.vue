<template>
  <div class="card shadow-sm student-table">
    <div class="card-header border-0">
      <div class="d-flex justify-content-between align-items-center">
        <h6 class="mb-0">Diák lista</h6>
        <span class="badge bg-light text-dark">
          <template v-if="loading">
            <span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
          </template>
          <template v-else>{{ filteredCount }} diák</template>
        </span>
      </div>
    </div>
    <div class="card-body p-0">
      <!-- Loading skeleton for table -->
      <div v-if="loading" class="p-4">
        <div class="d-flex justify-content-center py-5">
          <div class="text-center">
            <div class="spinner-border text-primary" role="status" style="width: 3rem; height: 3rem;">
              <span class="visually-hidden">Betöltés...</span>
            </div>
            <p class="mt-3 text-muted">Diákok betöltése...</p>
          </div>
        </div>
      </div>
      
      <!-- Desktop Table View -->
      <div v-if="!loading" class="d-none d-md-block">
        <div class="virtual-table-container">
          <!-- Table Header -->
          <table class="table table-hover mb-0">
            <thead class="table-light">
              <tr>
                <th>Név</th>
                <th class="d-none d-md-table-cell">Email</th>
                <th class="d-none d-lg-table-cell">Telefonszám</th>
                <th>Szoba</th>
                <th>Státusz</th>
                <th class="text-center">Műveletek</th>
              </tr>
            </thead>
          </table>
          <!-- Virtual Scroller Body -->
          <RecycleScroller
            class="scroller"
            :items="students"
            :item-size="72"
            key-field="diak_id"
            v-slot="{ item: student }"
          >
            <div class="student-row desktop-row">
              <div class="row g-0 align-items-center">
                <div class="col">
                  <div class="d-flex align-items-center">
                    <div class="avatar rounded-circle d-flex align-items-center justify-content-center me-3" 
                         style="width: 40px; height: 40px;"
                         v-text="getInitial(student.nev)">
                    </div>
                    <div>
                      <div class="fw-semibold" v-text="student.nev"></div>
                      <small class="text-muted">{{ student.nem === 'férfi' ? 'Férfi' : 'Nő' }}</small>
                    </div>
                  </div>
                </div>
                <div class="col d-none d-md-table-cell">
                  <span class="badge text-wrap" v-text="student.email"></span>
                </div>
                <div class="col d-none d-lg-table-cell">{{ student.telefonszam || '-' }}</div>
                <div class="col">
                  <span v-if="student.szoba" class="badge bg-info">
                    <i class="bi bi-door-closed me-1"></i>{{ student.szoba.szoba_szama }}
                  </span>
                  <span v-else class="text-muted">Nincs szoba</span>
                </div>
                <div class="col">
                  <span class="badge" :class="student.aktiv ? 'bg-success' : 'bg-secondary'">
                    <i class="bi" :class="student.aktiv ? 'bi-check-circle' : 'bi-x-circle'"></i>
                    {{ student.aktiv ? 'Aktív' : 'Inaktív' }}
                  </span>
                </div>
                <div class="col text-center">
                  <div class="btn-group" role="group">
                    <button 
                      class="btn btn-outline-primary btn-sm" 
                      @click="$emit('view', student)"
                      title="Diák megtekintése"
                      :disabled="loading"
                    >
                      <i class="bi bi-eye me-1"></i>Megtekintés
                    </button>
                    <button 
                      class="btn btn-outline-warning btn-sm" 
                      @click="$emit('edit', student)"
                      title="Diák szerkesztése"
                      :disabled="loading"
                    >
                      <i class="bi bi-pencil me-1"></i>Szerkesztés
                    </button>
                    <button 
                      class="btn btn-outline-info btn-sm" 
                      @click="$emit('transfer', student)"
                      title="Diák költöztetése"
                      :disabled="loading"
                    >
                      <i class="bi bi-arrow-right me-1"></i>Áthelyezés
                    </button>
                    <button 
                      class="btn btn-outline-danger btn-sm" 
                      @click="$emit('delete', student)"
                      title="Diák törlése"
                      :disabled="loading"
                    >
                      <i class="bi bi-trash me-1"></i>Törlés
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </RecycleScroller>
        </div>
      </div>
      
      <!-- Mobile Card View -->
      <div v-if="!loading" class="d-md-none mobile-cards-container">
        <RecycleScroller
          class="mobile-scroller"
          :items="students"
          :item-size="180"
          key-field="diak_id"
          v-slot="{ item: student }"
        >
          <div class="student-card">
            <!-- Card Header with Avatar and Name -->
            <div class="student-card-header">
              <div class="avatar rounded-circle d-flex align-items-center justify-content-center" 
                   style="width: 48px; height: 48px;"
                   v-text="getInitial(student.nev)">
              </div>
              <div class="student-info">
                <div class="student-name" v-text="student.nev"></div>
                <small class="student-gender">{{ student.nem === 'férfi' ? 'Férfi' : 'Nő' }}</small>
              </div>
              <span class="badge" :class="student.aktiv ? 'bg-success' : 'bg-secondary'">
                {{ student.aktiv ? 'Aktív' : 'Inaktív' }}
              </span>
            </div>
            
            <!-- Card Body with Details -->
            <div class="student-card-body">
              <div class="detail-row" v-if="student.email">
                <span class="detail-label">Email:</span>
                <span class="detail-value" v-text="student.email"></span>
              </div>
              <div class="detail-row" v-if="student.telefonszam">
                <span class="detail-label">Telefon:</span>
                <span class="detail-value" v-text="student.telefonszam"></span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Szoba:</span>
                <span class="detail-value">
                  <span v-if="student.szoba" class="badge bg-info">
                    <i class="bi bi-door-closed me-1"></i>{{ student.szoba.szoba_szama }}
                  </span>
                  <span v-else class="text-muted">Nincs szoba</span>
                </span>
              </div>
            </div>
            
            <!-- Card Footer with Actions -->
            <div class="student-card-footer">
              <button 
                class="btn btn-outline-primary btn-sm" 
                @click="$emit('view', student)"
                title="Diák megtekintése"
                :disabled="loading"
              >
                <i class="bi bi-eye"></i>
                <span>Megtekintés</span>
              </button>
              <button 
                class="btn btn-outline-warning btn-sm" 
                @click="$emit('edit', student)"
                title="Diák szerkesztése"
                :disabled="loading"
              >
                <i class="bi bi-pencil"></i>
                <span>Szerkesztés</span>
              </button>
              <button 
                class="btn btn-outline-info btn-sm" 
                @click="$emit('transfer', student)"
                title="Diák költöztetése"
                :disabled="loading"
              >
                <i class="bi bi-arrow-right"></i>
                <span>Áthelyezés</span>
              </button>
              <button 
                class="btn btn-outline-danger btn-sm" 
                @click="$emit('delete', student)"
                title="Diák törlése"
                :disabled="loading"
              >
                <i class="bi bi-trash"></i>
                <span>Törlés</span>
              </button>
            </div>
          </div>
        </RecycleScroller>
      </div>
    </div>
  </div>
</template>

<script>
import { RecycleScroller } from 'vue-virtual-scroller'

export default {
  name: 'StudentTable',
  components: { RecycleScroller },
  props: {
    loading: { type: Boolean, default: false },
    students: { type: Array, default: () => [] },
    filteredCount: { type: Number, default: 0 }
  },
  emits: ['view', 'edit', 'transfer', 'delete'],
  setup() {
    const getInitial = (name) => {
      if (!name || typeof name !== 'string') return '?'
      return name.charAt(0).toUpperCase()
    }
    
    return { getInitial }
  }
}
</script>

<style scoped>
.avatar {
  background: linear-gradient(135deg, var(--primary-600), var(--primary-700));
  color: white;
  font-weight: bold;
}

/* High contrast avatar */
[data-theme="high-contrast"] .avatar {
  background: var(--primary-600);
  color: var(--text-inverse);
  border: 2px solid var(--border-primary);
}

/* Virtual Scroller Styles */
.virtual-table-container {
  display: flex;
  flex-direction: column;
}

.scroller {
  height: 500px;
  overflow-y: auto;
}

.student-row {
  padding: 12px 16px;
  border-bottom: 1px solid var(--border-light, #dee2e6);
  background: white;
  transition: background-color 0.2s ease;
}

.student-row:hover {
  background-color: var(--bg-hover, #f8f9fa);
}

.student-row .col {
  padding: 0 8px;
  display: flex;
  align-items: center;
}

.student-row .col:first-child {
  padding-left: 0;
}

.student-row .col:last-child {
  padding-right: 0;
  justify-content: center;
}

/* Ensure button group stays compact */
.student-row .btn-group {
  flex-wrap: wrap;
  gap: 2px;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .scroller {
    height: 400px;
  }
  
  .student-row {
    padding: 8px 12px;
  }
  
  .student-row .btn-group .btn {
    padding: 0.25rem 0.5rem;
    font-size: 0.75rem;
  }
}

/* Dark mode support */
[data-theme="dark"] .student-row {
  background: var(--bg-card, #2d3748);
  border-bottom-color: var(--border-dark, #4a5568);
}

[data-theme="dark"] .student-row:hover {
  background-color: var(--bg-hover, #374151);
}

/* ==========================================
 * MOBILE CARD LAYOUT
 * ========================================== */
.mobile-cards-container {
  padding: 8px;
}

.mobile-scroller {
  height: calc(100vh - 200px);
  min-height: 400px;
  overflow-y: auto;
}

.student-card {
  background: var(--bg-card, white);
  border: 1px solid var(--border-primary, #dee2e6);
  border-radius: var(--border-radius-md, 8px);
  margin-bottom: 12px;
  padding: 16px;
  box-shadow: var(--shadow-card, 0 1px 3px rgba(0,0,0,0.1));
  transition: box-shadow 0.2s ease, transform 0.2s ease;
}

.student-card:active {
  transform: scale(0.98);
}

/* Card Header */
.student-card-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--border-light, #e9ecef);
}

.student-card-header .avatar {
  flex-shrink: 0;
  width: 48px;
  height: 48px;
  font-size: 1.25rem;
}

.student-info {
  flex: 1;
  min-width: 0;
}

.student-name {
  font-weight: 600;
  font-size: 1rem;
  color: var(--text-primary, #212529);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.student-gender {
  color: var(--text-muted, #6c757d);
  font-size: 0.875rem;
}

/* Card Body */
.student-card-body {
  margin-bottom: 12px;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid var(--border-light, #f1f3f5);
}

.detail-row:last-child {
  border-bottom: none;
}

.detail-label {
  font-weight: 600;
  color: var(--text-body, #495057);
  font-size: 0.875rem;
}

.detail-value {
  color: var(--text-primary, #212529);
  font-size: 0.875rem;
  text-align: right;
  word-break: break-word;
  max-width: 60%;
}

/* Card Footer */
.student-card-footer {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
  padding-top: 12px;
  border-top: 1px solid var(--border-light, #e9ecef);
}

.student-card-footer .btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 10px 8px;
  font-size: 0.8125rem;
  font-weight: 500;
  border-radius: var(--border-radius-sm, 6px);
}

.student-card-footer .btn i {
  font-size: 0.875rem;
}

/* ==========================================
 * DARK MODE - MOBILE CARDS
 * ========================================== */
[data-theme="dark"] .student-card {
  background: var(--bg-card, #2d3748);
  border-color: var(--border-primary, #4a5568);
}

[data-theme="dark"] .student-card-header {
  border-bottom-color: var(--border-dark, #4a5568);
}

[data-theme="dark"] .student-name {
  color: var(--text-primary, #f7fafc);
}

[data-theme="dark"] .student-gender {
  color: var(--text-muted, #a0aec0);
}

[data-theme="dark"] .detail-row {
  border-bottom-color: var(--border-dark, #4a5568);
}

[data-theme="dark"] .detail-label {
  color: var(--text-body, #cbd5e0);
}

[data-theme="dark"] .detail-value {
  color: var(--text-primary, #f7fafc);
}

[data-theme="dark"] .student-card-footer {
  border-top-color: var(--border-dark, #4a5568);
}

/* ==========================================
 * HIGH CONTRAST - MOBILE CARDS
 * ========================================== */
[data-theme="high-contrast"] .student-card {
  background: var(--bg-card);
  border: 2px solid var(--border-primary);
}

[data-theme="high-contrast"] .student-card-header {
  border-bottom: 2px solid var(--border-primary);
}

[data-theme="high-contrast"] .student-name {
  color: var(--text-primary);
}

[data-theme="high-contrast"] .detail-row {
  border-bottom: 1px solid var(--border-primary);
}

[data-theme="high-contrast"] .detail-label {
  color: var(--text-primary);
  font-weight: 700;
}

[data-theme="high-contrast"] .detail-value {
  color: var(--text-primary);
}

[data-theme="high-contrast"] .student-card-footer {
  border-top: 2px solid var(--border-primary);
}

[data-theme="high-contrast"] .student-card-footer .btn {
  border-width: 2px;
}

/* ==========================================
 * TOUCH DEVICE OPTIMIZATIONS
 * ========================================== */
@media (hover: none) and (pointer: coarse) {
  .student-card-footer .btn {
    min-height: 44px; /* Minimum touch target size */
  }
  
  .student-card-footer .btn:active {
    transform: scale(0.96);
  }
}

/* ==========================================
 * SMALL MOBILE SCREENS
 * ========================================== */
@media (max-width: 360px) {
  .student-card {
    padding: 12px;
  }
  
  .student-card-header .avatar {
    width: 40px;
    height: 40px;
    font-size: 1rem;
  }
  
  .student-card-footer {
    grid-template-columns: 1fr;
  }
  
  .student-card-footer .btn {
    padding: 8px;
  }
}
</style>
