<template>
  <div class="card shadow-sm">
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
      <div class="table-responsive">
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
        
        <div v-else class="virtual-table-container">
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
            <div class="student-row">
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
                  <span class="badge" v-text="student.email"></span>
                </div>
                <div class="col d-none d-lg-table-cell">{{ student.telefonszam || '-' }}</div>
                <div class="col">
                  <span v-if="student.szoba" class="badge">
                    <i class="bi bi-door-closed me-1"></i>{{ student.szoba.szoba_szama }}
                  </span>
                  <span v-else class="text-muted">Nincs szoba</span>
                </div>
                <div class="col">
                  <span class="badge">
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
</style>
