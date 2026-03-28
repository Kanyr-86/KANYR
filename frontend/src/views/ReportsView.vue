<template>
  <div class="container-fluid">
    <!-- Loading Overlay -->
    <LoadingOverlay :show="loading" message="Jelentések betöltése..." />
    
    <div class="row">
      <div class="col-12">
        <div class="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h2 class="mb-1">Jelentések és statisztikák</h2>
            <p style="color: var(--text-muted)" class="mb-0">Részletes elemzések és statisztikák a kollégiumi élet nyomon követéséhez</p>
          </div>
          <div class="d-flex gap-2">
            <button 
              class="btn btn-primary btn-lg" 
              @click="handleGenerateReport('occupancy')"
              :disabled="loading"
            >
              <i class="bi bi-bar-chart me-2"></i>Szobafoglaltsági jelentés
            </button>
            <button 
              class="btn btn-primary btn-lg" 
              @click="handleGenerateReport('bekoltozesek')"
              :disabled="loading"
            >
              <i class="bi bi-clock-history me-2"></i>Beköltözési előzmények
            </button>
          </div>
        </div>

        <div v-if="error" class="alert alert-danger" role="alert">
          {{ error }}
        </div>

        <!-- Összegző statisztikák -->
        <div class="row mb-4">
          <div class="col-md-3">
            <div class="card stat-card shadow-sm">
              <div class="card-body">
                <div class="d-flex justify-content-between align-items-center">
                  <div>
                    <h6 class="card-title mb-1">Összes diák</h6>
                    <h3 class="mb-0">
                      <template v-if="loading">
                        <span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                      </template>
                      <template v-else>{{ stats?.totalStudents || 0 }}</template>
                    </h3>
                  </div>
                  <i class="bi bi-people-fill fs-1 opacity-75"></i>
                </div>
              </div>
            </div>
          </div>

          <div class="col-md-3">
            <div class="card stat-card shadow-sm">
              <div class="card-body">
                <div class="d-flex justify-content-between align-items-center">
                  <div>
                    <h6 class="card-title mb-1">Aktív diákok</h6>
                    <h3 class="mb-0">
                      <template v-if="loading">
                        <span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                      </template>
                      <template v-else>{{ stats?.activeStudents || 0 }}</template>
                    </h3>
                  </div>
                  <i class="bi bi-person-check-fill fs-1 opacity-75"></i>
                </div>
              </div>
            </div>
          </div>

          <div class="col-md-3">
            <div class="card stat-card shadow-sm">
              <div class="card-body">
                <div class="d-flex justify-content-between align-items-center">
                  <div>
                    <h6 class="card-title mb-1">Összes szoba</h6>
                    <h3 class="mb-0">
                      <template v-if="loading">
                        <span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                      </template>
                      <template v-else>{{ stats?.totalRooms || 0 }}</template>
                    </h3>
                  </div>
                  <i class="bi bi-door-closed-fill fs-1 opacity-75"></i>
                </div>
              </div>
            </div>
          </div>

          <div class="col-md-3">
            <div class="card stat-card shadow-sm">
              <div class="card-body">
                <div class="d-flex justify-content-between align-items-center">
                  <div>
                    <h6 class="card-title mb-1">Szabad helyek</h6>
                    <h3 class="mb-0">
                      <template v-if="loading">
                        <span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                      </template>
                      <template v-else>{{ stats?.availableSpaces || 0 }}</template>
                    </h3>
                  </div>
                  <i class="bi bi-plus-circle-fill fs-1 opacity-75"></i>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Jelentés vezérlők -->
        <div class="card shadow-sm mb-4">
          <div class="card-body">
            <div class="row align-items-center">
              <div class="col-md-8">
                <h6 class="card-title mb-2">Jelentés típusának kiválasztása</h6>
                <div class="btn-group" role="group">
                  <button
                    class="btn btn-primary"
                    :class="{ active: reportType === 'occupancy' }"
                    @click="handleGenerateReport('occupancy')"
                    :disabled="loading"
                  >
                    <i class="bi bi-bar-chart me-2"></i>Szobafoglaltsági jelentés
                  </button>
                  <button
                    class="btn btn-primary"
                    :class="{ active: reportType === 'students' }"
                    @click="handleGenerateReport('students')"
                    :disabled="loading"
                  >
                    <i class="bi bi-person-lines-fill me-2"></i>Diák jelentés
                  </button>
                  <button
                    class="btn btn-primary"
                    :class="{ active: reportType === 'bekoltozesek' }"
                    @click="handleGenerateReport('bekoltozesek')"
                    :disabled="loading"
                  >
                    <i class="bi bi-clock-history me-2"></i>Beköltözési előzmények
                  </button>
                </div>
              </div>
              <div class="col-md-4 text-end">
                <div class="btn-group" role="group">
                  <button
                    class="btn btn-secondary"
                    @click="handleExport('pdf')"
                    disabled
                  >
                    <i class="bi bi-file-pdf me-2"></i>Exportálás PDF-be
                  </button>
                  <button
                    class="btn btn-secondary"
                    @click="handleExport('csv')"
                    disabled
                  >
                    <i class="bi bi-file-earmark-spreadsheet me-2"></i>Exportálás CSV-be
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Beköltözési előzmények szűrők -->
        <div v-if="reportType === 'bekoltozesek'" class="card shadow-sm mb-4">
          <div class="card-header border-0">
            <h6 class="mb-0">Szűrők</h6>
          </div>
          <div class="card-body">
            <div class="row g-3">
              <div class="col-md-3">
                <label class="form-label fw-semibold">Diák név</label>
                <div class="input-group">
                  <span class="input-group-text">
                    <i class="bi bi-person"></i>
                  </span>
                  <input 
                    type="text" 
                    class="form-control" 
                    v-model="filters.diakNev"
                    placeholder="Keresés név alapján..."
                    @input="debouncedFetchBekoltozesek"
                    :disabled="loading"
                  >
                </div>
              </div>
              <div class="col-md-3">
                <label class="form-label fw-semibold">Szoba</label>
                <select class="form-select" v-model="filters.szobaId" @change="fetchBekoltozesek" :disabled="loading">
                  <option value="">Összes szoba</option>
                  <option v-for="room in rooms" :key="room.szoba_id" :value="room.szoba_id">
                    {{ room.szoba_szama }}
                  </option>
                </select>
              </div>
              <div class="col-md-3">
                <label class="form-label fw-semibold">Dátumtól</label>
                <input 
                  type="date" 
                  class="form-control" 
                  v-model="filters.datumFrom"
                  @change="fetchBekoltozesek"
                  :disabled="loading"
                >
              </div>
              <div class="col-md-3">
                <label class="form-label fw-semibold">Dátumig</label>
                <input 
                  type="date" 
                  class="form-control" 
                  v-model="filters.datumTo"
                  @change="fetchBekoltozesek"
                  :disabled="loading"
                >
              </div>
            </div>
            <div class="row mt-3">
              <div class="col-12">
                <button class="btn btn-outline-secondary" @click="clearFilters" :disabled="loading">
                  <i class="bi bi-x-circle me-2"></i>Szűrők törlése
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Jelentés adatok -->
        <div class="card shadow-sm">
          <div class="card-header border-0">
            <h5 class="mb-0">
              {{ reportType === 'occupancy' ? 'Szobafoglaltsági jelentés' : 
                 reportType === 'bekoltozesek' ? 'Beköltözési előzmények' : 'Diák jelentés' }}
            </h5>
          </div>
          <div class="card-body">
        <!-- Szobafoglaltsági jelentés -->
            <div v-if="reportType === 'occupancy'" class="table-responsive">
              <!-- Loading skeleton for table -->
              <div v-if="loading" class="p-4">
                <div class="d-flex justify-content-center py-5">
                  <div class="text-center">
                    <div class="spinner-border text-primary" role="status" style="width: 3rem; height: 3rem;">
                      <span class="visually-hidden">Betöltés...</span>
                    </div>
                    <p class="mt-3 text-muted">Adatok betöltése...</p>
                  </div>
                </div>
              </div>
              <table v-else class="table table-hover">
                <thead class="table-light">
                  <tr>
                    <th>ID</th>
                    <th>Szoba száma</th>
                    <th>Férőhelyek</th>
                    <th>Foglalt helyek</th>
                    <th>Szabad helyek</th>
                    <th>Foglaltsági arány</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="room in rooms" :key="room.szoba_id" class="align-middle">
                    <td>{{ room.szoba_id }}</td>
                    <td>
                      <span class="badge bg-info text-dark">{{ room.szoba_szama }}</span>
                    </td>
                    <td>
                      <span class="badge bg-secondary">{{ room.osszes_hely }}</span>
                    </td>
                    <td>
                      <span class="badge bg-success">{{ room.bekoltozesek?.length || 0 }}</span>
                    </td>
                    <td>
                      <span class="badge bg-warning">{{ (room.osszes_hely || 0) - (room.bekoltozesek?.length || 0) }}</span>
                    </td>
                    <td>
                      <div class="d-flex align-items-center gap-2">
                        <div class="progress flex-grow-1" style="height: 8px;">
                          <div class="progress-bar" 
                               :class="getOccupancyProgressClass(calculateOccupancyPercentage(room))"
                               :style="{ width: calculateOccupancyPercentage(room) + '%' }">
                          </div>
                        </div>
                        <span class="fw-semibold">{{ calculateOccupancyPercentage(room) }}%</span>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- Beköltözési előzmények -->
            <div v-else-if="reportType === 'bekoltozesek'" class="table-responsive">
              <div v-if="loading || bekoltozesekLoading" class="p-4">
                <div class="d-flex justify-content-center py-5">
                  <div class="text-center">
                    <div class="spinner-border text-primary" role="status" style="width: 3rem; height: 3rem;">
                      <span class="visually-hidden">Betöltés...</span>
                    </div>
                    <p class="mt-3 text-muted">Adatok betöltése...</p>
                  </div>
                </div>
              </div>
              <div v-else-if="bekoltozesek.length === 0" class="alert alert-info">
                <i class="bi bi-info-circle me-2"></i>
                Nincs találat a megadott szűrők alapján.
              </div>
              <table v-else class="table table-hover">
                <thead class="table-light">
                  <tr>
                    <th>Diák neve</th>
                    <th>Szoba</th>
                    <th>Beköltözés dátuma</th>
                    <th>Kiköltözés dátuma</th>
                    <th>Időtartam (nap)</th>
                    <th>Státusz</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="bekoltozes in bekoltozesek" :key="bekoltozes.bekoltozes_id" class="align-middle">
                    <td>
                      <div class="d-flex align-items-center">
                        <div class="avatar rounded-circle d-flex align-items-center justify-content-center me-2" style="width: 24px; height: 24px;">
                          {{ bekoltozes.diak?.nev?.charAt(0).toUpperCase() || '?' }}
                        </div>
                        <div>
                          <div class="fw-semibold">{{ bekoltozes.diak?.nev || 'N/A' }}</div>
                          <small class="text-muted">{{ bekoltozes.diak?.email || 'N/A' }}</small>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span class="badge bg-info">{{ bekoltozes.szoba?.szoba_szama || 'N/A' }}</span>
                    </td>
                    <td>{{ formatDate(bekoltozes.bekoltozes_datum) }}</td>
                    <td>
                      <span v-if="bekoltozes.kikoltozes_datum" class="badge bg-secondary">
                        {{ formatDate(bekoltozes.kikoltozes_datum) }}
                      </span>
                      <span v-else class="text-muted">-</span>
                    </td>
                    <td>
                      <span class="badge bg-warning">{{ bekoltozes.napok_szama }}</span>
                    </td>
                    <td>
                      <span class="badge" :class="bekoltozes.kikoltozes_datum ? 'bg-secondary' : 'bg-success'">
                        <i class="bi" :class="bekoltozes.kikoltozes_datum ? 'bi-door-open' : 'bi-door-closed'"></i>
                        {{ bekoltozes.kikoltozes_datum ? 'Kiköltözött' : 'Jelenleg is lakik' }}
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- Diák jelentés -->
            <div v-else class="table-responsive">
              <!-- Loading skeleton for table -->
              <div v-if="loading" class="p-4">
                <div class="d-flex justify-content-center py-5">
                  <div class="text-center">
                    <div class="spinner-border text-primary" role="status" style="width: 3rem; height: 3rem;">
                      <span class="visually-hidden">Betöltés...</span>
                    </div>
                    <p class="mt-3 text-muted">Adatok betöltése...</p>
                  </div>
                </div>
              </div>
              <table v-else class="table table-hover">
                <thead class="table-light">
                  <tr>
                    <th class="text-primary">ID</th>
                    <th class="text-primary">Név</th>
                    <th class="text-primary">Email</th>
                    <th class="text-primary">Telefon</th>
                    <th class="text-primary">Szoba</th>
                    <th class="text-primary">Beköltözés dátuma</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="student in activeStudents" :key="student.diak_id" class="align-middle">
                    <td>{{ student.diak_id }}</td>
                    <td>
                      <div class="d-flex align-items-center">
                        <div class="avatar rounded-circle d-flex align-items-center justify-content-center me-2" style="width: 24px; height: 24px;">
                          {{ student.nev.charAt(0).toUpperCase() }}
                        </div>
                        <div>
                          <div class="fw-semibold">{{ student.nev }}</div>
                          <small class="text-muted">{{ student.nem === 'férfi' ? 'Férfi' : 'Nő' }}</small>
                        </div>
                      </div>
                    </td>
                    <td>{{ student.email }}</td>
                    <td>{{ student.telefonszam }}</td>
                    <td>
                      <span v-if="student.bekoltozesek?.[0]?.szoba" class="badge bg-info">
                        {{ student.bekoltozesek[0].szoba.szoba_szama }}
                      </span>
                      <span v-else class="text-muted">Nincs szoba</span>
                    </td>
                    <td>
                      <span class="badge bg-success">
                        {{ student.bekoltozesek?.[0]?.bekoltozes_datum 
                          ? formatDate(student.bekoltozesek[0].bekoltozes_datum)
                          : 'N/A' }}
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- Részletes statisztikák -->
        <div class="card shadow-sm mt-4">
          <div class="card-header border-0">
            <h6 class="mb-0">Részletes statisztikák</h6>
          </div>
          <div class="card-body">
            <div class="row">
              <div class="col-md-6">
                <div class="d-flex align-items-center mb-2">
                  <i class="bi bi-bar-chart-fill text-primary me-2"></i>
                  <div>
                    <strong>Átlagos foglaltsági arány:</strong>
                    <span class="badge bg-primary ms-2">{{ stats?.averageOccupancy || 0 }}%</span>
                  </div>
                </div>
                <div class="d-flex align-items-center">
                  <i class="bi bi-trophy-fill text-warning me-2"></i>
                  <div>
                    <strong>Legmagasabb foglaltságú szoba:</strong>
                    <span class="badge bg-warning ms-2">{{ stats?.mostOccupiedRoom || 'N/A' }}</span>
                  </div>
                </div>
              </div>
              <div class="col-md-6">
                <div class="d-flex align-items-center mb-2">
                  <i class="bi bi-calendar-plus-fill text-success me-2"></i>
                  <div>
                    <strong>Legutóbbi beköltözés:</strong>
                    <span class="badge bg-success ms-2">{{ formatDate(stats?.latestMoveIn) || 'N/A' }}</span>
                  </div>
                </div>
                <div class="d-flex align-items-center">
                  <i class="bi bi-calendar-x-fill text-danger me-2"></i>
                  <div>
                    <strong>Legutóbbi kiköltözés:</strong>
                    <span class="badge bg-danger ms-2">{{ formatDate(stats?.latestMoveOut) || 'N/A' }}</span>
                  </div>
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
import { defineComponent, ref, onMounted, computed, defineAsyncComponent, watch } from 'vue'
import { useAuthStore } from '../store/auth'
import { useDebounce } from '../composables/useDebounce'
import api from '../services/api'

// Lazy load heavy components
const LoadingOverlay = defineAsyncComponent(() => import('../components/LoadingOverlay.vue'))

export default defineComponent({
  name: 'ReportsView',
  components: {
    LoadingOverlay
  },
  setup() {
    const authStore = useAuthStore()
    const reportType = ref('occupancy')
    
    const stats = ref(null)
    const rooms = ref([])
    const activeStudents = ref([])
    const loading = ref(true)
    const error = ref(null)
    
    // Beköltözések
    const bekoltozesek = ref([])
    const bekoltozesekLoading = ref(false)
    const filters = ref({
      diakNev: '',
      szobaId: '',
      datumFrom: '',
      datumTo: ''
    })

    const fetchData = async () => {
      loading.value = true
      error.value = null
      
      try {
        // Fetch statistics
        const statsResponse = await api.get('/students/statistics')
        if (statsResponse.data.success) {
          stats.value = statsResponse.data.data
        }
        
        // Fetch rooms
        const roomsResponse = await api.get('/rooms')
        if (roomsResponse.data.success) {
          rooms.value = roomsResponse.data.data
        }
        
        // Fetch active students
        const studentsResponse = await api.get('/students')
        if (studentsResponse.data.success) {
          activeStudents.value = studentsResponse.data.data.filter(s => s.aktiv)
        }
      } catch (err) {
        error.value = err.response?.data?.error || err.message || 'Hiba az adatok betöltése közben'
      } finally {
        loading.value = false
      }
    }
    
    // Beköltözések lekérdezése szűrőkkel
    const fetchBekoltozesek = async () => {
      bekoltozesekLoading.value = true
      try {
        const params = new URLSearchParams()
        if (filters.value.diakNev) params.append('diakNev', filters.value.diakNev)
        if (filters.value.szobaId) params.append('szobaId', filters.value.szobaId)
        if (filters.value.datumFrom) params.append('datumFrom', filters.value.datumFrom)
        if (filters.value.datumTo) params.append('datumTo', filters.value.datumTo)
        
        const response = await api.get(`/rooms/bekoltozesek?${params.toString()}`)
        if (response.data.success) {
          bekoltozesek.value.splice(0, bekoltozesek.value.length, ...response.data.data)
        }
      } catch (err) {
        console.error('Hiba a beköltözések lekérdezésekor:', err)
        error.value = err.response?.data?.error || err.message || 'Hiba a beköltözések lekérdezésekor'
      } finally {
        bekoltozesekLoading.value = false
      }
    }

    // Debounced keresés a diák név mezőhöz
    const { debouncedFn: debouncedFetchBekoltozesek } = useDebounce(fetchBekoltozesek, 300)
    
    // Szűrők törlése
    const clearFilters = () => {
      filters.value = {
        diakNev: '',
        szobaId: '',
        datumFrom: '',
        datumTo: ''
      }
      fetchBekoltozesek()
    }
    
    // Dátum formázása
    const formatDate = (dateString) => {
      if (!dateString) return 'N/A'
      return new Date(dateString).toLocaleDateString('hu-HU')
    }

    onMounted(() => {
      fetchData()
    })

    const calculateOccupancyPercentage = (room) => {
      const occupied = room.bekoltozesek?.length || 0
      const total = room.osszes_hely || 1
      return Math.round((occupied / total) * 100)
    }

    const getOccupancyProgressClass = (percentage) => {
      if (percentage < 50) return 'bg-success'
      if (percentage < 80) return 'bg-info'
      if (percentage < 100) return 'bg-warning'
      return 'bg-danger'
    }

    const handleGenerateReport = async (type) => {
      reportType.value = type
      
      // Frissítjük az adatokat a jelentés típusának megfelelően
      if (type === 'bekoltozesek') {
        await fetchBekoltozesek()
      } else if (type === 'occupancy') {
        // Szobák frissítése
        try {
          const roomsResponse = await api.get('/rooms')
          if (roomsResponse.data.success) {
            rooms.value = roomsResponse.data.data
          }
        } catch (err) {
          console.error('Hiba a szobák frissítésekor:', err)
        }
      } else if (type === 'students') {
        // Aktív diákok frissítése
        try {
          const studentsResponse = await api.get('/students')
          if (studentsResponse.data.success) {
            activeStudents.value = studentsResponse.data.data.filter(s => s.aktiv)
          }
        } catch (err) {
          console.error('Hiba a diákok frissítésekor:', err)
        }
      }
    }

    const handleExport = (format) => {
      alert(`Exportálás ${format.toUpperCase()} formátumban - ez a funkció még fejlesztés alatt áll`)
    }

    return {
      stats,
      rooms,
      activeStudents,
      loading,
      error,
      reportType,
      bekoltozesek,
      bekoltozesekLoading,
      filters,
      fetchBekoltozesek,
      debouncedFetchBekoltozesek,
      clearFilters,
      formatDate,
      calculateOccupancyPercentage,
      getOccupancyProgressClass,
      handleGenerateReport,
      handleExport
    }
  }
})
</script>

<style scoped>
/* Typography Hierarchy - Section Headers (inherited from DashboardView) */
.card-header h5 {
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 0;
}

/* Dark theme adjustments for typography */
[data-theme="dark"] .card-header h5 {
  color: var(--text-secondary);
}

/* Status Indicators (.status-indicator) - Pulse animations */
.status-indicator {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 0.875rem;
  font-weight: 600;
  transition: all 0.3s ease;
}

.status-indicator.online {
  background-color: rgba(16, 185, 129, 0.1);
  border: 1px solid rgba(16, 185, 129, 0.3);
  color: var(--success-700);
  animation: pulse 2s infinite;
}

.status-indicator.offline {
  background-color: rgba(100, 116, 139, 0.1);
  border: 1px solid rgba(100, 116, 139, 0.3);
  color: var(--secondary-700);
}

.status-indicator.warning {
  background-color: rgba(245, 158, 11, 0.1);
  border: 1px solid rgba(245, 158, 11, 0.3);
  color: var(--warning-700);
}

@keyframes pulse {
  0% {
    box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.4);
    transform: scale(1);
  }
  70% {
    box-shadow: 0 0 0 10px rgba(16, 185, 129, 0);
    transform: scale(1.05);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(16, 185, 129, 0);
    transform: scale(1);
  }
}

/* Dark theme adjustments for status indicators */
[data-theme="dark"] .status-indicator.online {
  background-color: rgba(52, 211, 153, 0.15);
  border-color: rgba(52, 211, 153, 0.4);
  color: var(--success-500);
  animation: pulse-dark 2s infinite;
}

[data-theme="dark"] .status-indicator.offline {
  background-color: rgba(148, 163, 184, 0.15);
  border-color: rgba(148, 163, 184, 0.4);
  color: var(--text-secondary);
}

[data-theme="dark"] .status-indicator.warning {
  background-color: rgba(251, 191, 36, 0.15);
  border-color: rgba(251, 191, 36, 0.4);
  color: var(--warning-500);
}

@keyframes pulse-dark {
  0% {
    box-shadow: 0 0 0 0 rgba(52, 211, 153, 0.6);
    transform: scale(1);
  }
  70% {
    box-shadow: 0 0 0 12px rgba(52, 211, 153, 0);
    transform: scale(1.05);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(52, 211, 153, 0);
    transform: scale(1);
  }
}

/* Dark theme overrides for ReportsView */
[data-theme="dark"] .container-fluid {
  background-color: var(--bg-page);
}

[data-theme="dark"] strong {
  color: var(--text-primary);
}

/* Fix icon colors in dark theme */
[data-theme="dark"] .bi {
  color: var(--text-primary);
}

[data-theme="dark"] .btn-primary .bi,
[data-theme="dark"] .btn-secondary .bi,
[data-theme="dark"] .btn-success .bi,
[data-theme="dark"] .btn-danger .bi,
[data-theme="dark"] .btn-warning .bi,
[data-theme="dark"] .btn-info .bi {
  color: inherit;
}

[data-theme="dark"] .badge .bi {
  color: inherit;
}

[data-theme="dark"] .input-group-text .bi {
  color: var(--text-primary);
}

[data-theme="dark"] .alert .bi {
  color: inherit;
}

[data-theme="dark"] .text-primary.bi {
  color: var(--primary-600) !important;
}

[data-theme="dark"] .text-success.bi {
  color: var(--success-500) !important;
}

[data-theme="dark"] .text-warning.bi {
  color: var(--warning-500) !important;
}

[data-theme="dark"] .text-danger.bi {
  color: var(--danger-500) !important;
}

[data-theme="dark"] .text-info.bi {
  color: var(--info-500) !important;
}

[data-theme="dark"] .text-secondary.bi {
  color: var(--secondary-500) !important;
}

[data-theme="dark"] .card {
  background-color: var(--bg-card);
  border-color: var(--border-primary);
}

[data-theme="dark"] .card-header {
  background-color: var(--bg-tertiary);
  border-bottom-color: var(--border-primary);
}

[data-theme="dark"] .card-body {
  background-color: var(--bg-card);
}

[data-theme="dark"] .btn-primary {
  background-color: var(--primary-600);
  border-color: var(--primary-600);
}

[data-theme="dark"] .btn-primary:hover {
  background-color: var(--primary-700);
  border-color: var(--primary-700);
}

[data-theme="dark"] .btn-secondary {
  background-color: var(--secondary-600);
  border-color: var(--secondary-600);
}

[data-theme="dark"] .btn-secondary:hover {
  background-color: var(--secondary-700);
  border-color: var(--secondary-700);
}

[data-theme="dark"] .btn-outline-secondary {
  border-color: var(--border-primary);
  color: var(--text-primary);
  background-color: transparent;
}

[data-theme="dark"] .btn-outline-secondary:hover {
  background-color: var(--bg-tertiary);
  border-color: var(--border-primary);
}

[data-theme="dark"] .table {
  background-color: var(--bg-card);
}

[data-theme="dark"] .table-hover tbody tr:hover {
  background-color: var(--bg-tertiary);
}

[data-theme="dark"] .table-light {
  background-color: var(--bg-tertiary);
}

[data-theme="dark"] .badge {
  background-color: var(--bg-tertiary);
  border: 1px solid var(--border-primary);
  color: var(--text-primary);
}

[data-theme="dark"] .badge.bg-info {
  background-color: var(--info-500);
  color: var(--text-inverse);
}

[data-theme="dark"] .badge.bg-secondary {
  background-color: var(--secondary-600);
  color: var(--text-inverse);
}

[data-theme="dark"] .badge.bg-success {
  background-color: var(--success-500);
  color: var(--text-inverse);
}

[data-theme="dark"] .badge.bg-warning {
  background-color: var(--warning-500);
  color: var(--text-inverse);
}

[data-theme="dark"] .badge.bg-primary {
  background-color: var(--primary-600);
  color: var(--text-inverse);
}

[data-theme="dark"] .text-muted {
  color: var(--text-muted) !important;
}

[data-theme="dark"] .text-primary {
  color: var(--primary-600) !important;
}

[data-theme="dark"] .text-success {
  color: var(--success-500) !important;
}

[data-theme="dark"] .text-warning {
  color: var(--warning-500) !important;
}

[data-theme="dark"] .text-danger {
  color: var(--danger-500) !important;
}

[data-theme="dark"] .alert {
  background-color: var(--bg-tertiary);
  border-color: var(--border-primary);
  color: var(--text-primary);
}

[data-theme="dark"] .alert.alert-danger {
  background-color: rgba(239, 68, 68, 0.1);
  border-color: rgba(239, 68, 68, 0.3);
  color: var(--danger-500);
}

[data-theme="dark"] .alert.alert-info {
  background-color: rgba(59, 130, 246, 0.1);
  border-color: rgba(59, 130, 246, 0.3);
  color: var(--primary-600);
}

[data-theme="dark"] .form-control {
  background-color: var(--bg-tertiary);
  border-color: var(--border-primary);
  color: var(--text-primary);
}

[data-theme="dark"] .form-control:focus {
  background-color: var(--bg-tertiary);
  border-color: var(--primary-600);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

[data-theme="dark"] .form-select:focus {
  background-color: var(--bg-tertiary);
  border-color: var(--primary-600);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

[data-theme="dark"] .input-group-text {
  background-color: var(--bg-tertiary);
  border-color: var(--border-primary);
  color: var(--text-primary);
}

[data-theme="dark"] .progress {
  background-color: var(--bg-tertiary);
  border: 1px solid var(--border-primary);
}

[data-theme="dark"] .progress-bar {
  background-color: var(--success-500);
}

[data-theme="dark"] .progress-bar.bg-info {
  background-color: var(--info-500);
}

[data-theme="dark"] .progress-bar.bg-warning {
  background-color: var(--warning-500);
}

[data-theme="dark"] .progress-bar.bg-danger {
  background-color: var(--danger-500);
}

</style>
