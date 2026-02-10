<template>
  <div class="container-fluid">
    <div class="row">
      <div class="col-12">
        <h2 class="mb-4">Jelentések és statisztikák</h2>

        <div v-if="error" class="alert alert-danger" role="alert">
          {{ error }}
        </div>

        <!-- Summary Statistics -->
        <div class="row mb-4">
          <div class="col-md-3">
            <div class="card text-white bg-primary">
              <div class="card-body text-center">
                <h5 class="card-title">Összes diák</h5>
                <h2 class="card-text">{{ stats?.totalStudents || 0 }}</h2>
              </div>
            </div>
          </div>

          <div class="col-md-3">
            <div class="card text-white bg-success">
              <div class="card-body text-center">
                <h5 class="card-title">Aktív diákok</h5>
                <h2 class="card-text">{{ stats?.activeStudents || 0 }}</h2>
              </div>
            </div>
          </div>

          <div class="col-md-3">
            <div class="card text-white bg-info">
              <div class="card-body text-center">
                <h5 class="card-title">Összes szoba</h5>
                <h2 class="card-text">{{ stats?.totalRooms || 0 }}</h2>
              </div>
            </div>
          </div>

          <div class="col-md-3">
            <div class="card text-white bg-warning">
              <div class="card-body text-center">
                <h5 class="card-title">Szabad helyek</h5>
                <h2 class="card-text">{{ stats?.availableSpaces || 0 }}</h2>
              </div>
            </div>
          </div>
        </div>

        <!-- Report Controls -->
        <div class="card mb-4">
          <div class="card-body">
            <h5 class="card-title mb-3">Jelentés típusának kiválasztása</h5>
            <div class="row">
              <div class="col-md-6 mb-3">
                <button
                  class="btn btn-primary me-2"
                  @click="handleGenerateReport('occupancy')"
                >
                  Szobafoglaltsági jelentés
                </button>
                <button
                  class="btn btn-primary me-2"
                  @click="handleGenerateReport('students')"
                >
                  Diák jelentés
                </button>
                <button
                  class="btn btn-info"
                  @click="handleGenerateReport('bekoltozesek')"
                >
                  Beköltözési előzmények
                </button>
              </div>
              <div class="col-md-6">
                <button
                  class="btn btn-secondary me-2"
                  @click="handleExport('pdf')"
                  disabled
                >
                  Exportálás PDF-be
                </button>
                <button
                  class="btn btn-secondary"
                  @click="handleExport('csv')"
                  disabled
                >
                  Exportálás CSV-be
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Beköltözési előzmények szűrők -->
        <div v-if="reportType === 'bekoltozesek'" class="card mb-4">
          <div class="card-header">
            <h5 class="card-title mb-0">Szűrők</h5>
          </div>
          <div class="card-body">
            <div class="row g-3">
              <div class="col-md-3">
                <label class="form-label">Diák név</label>
                <input 
                  type="text" 
                  class="form-control" 
                  v-model="filters.diakNev"
                  placeholder="Keresés név alapján..."
                  @input="fetchBekoltozesek"
                >
              </div>
              <div class="col-md-3">
                <label class="form-label">Szoba</label>
                <select class="form-select" v-model="filters.szobaId" @change="fetchBekoltozesek">
                  <option value="">Összes szoba</option>
                  <option v-for="room in rooms" :key="room.szoba_id" :value="room.szoba_id">
                    {{ room.szoba_szama }}
                  </option>
                </select>
              </div>
              <div class="col-md-3">
                <label class="form-label">Dátumtól</label>
                <input 
                  type="date" 
                  class="form-control" 
                  v-model="filters.datumFrom"
                  @change="fetchBekoltozesek"
                >
              </div>
              <div class="col-md-3">
                <label class="form-label">Dátumig</label>
                <input 
                  type="date" 
                  class="form-control" 
                  v-model="filters.datumTo"
                  @change="fetchBekoltozesek"
                >
              </div>
            </div>
            <div class="row mt-3">
              <div class="col-12">
                <button class="btn btn-outline-secondary" @click="clearFilters">
                  Szűrők törlése
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Report Data -->
        <div class="card">
          <div class="card-header">
            <h5>
              {{ reportType === 'occupancy' ? 'Szobafoglaltsági jelentés' : 
                 reportType === 'bekoltozesek' ? 'Beköltözési előzmények' : 'Diák jelentés' }}
            </h5>
          </div>
          <div class="card-body">
            <!-- Szobafoglaltsági jelentés -->
            <div v-if="reportType === 'occupancy'" class="table-responsive">
              <table class="table table-striped">
                <thead>
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
                  <tr v-for="room in rooms" :key="room.szoba_id">
                    <td>{{ room.szoba_id }}</td>
                    <td>{{ room.szoba_szama }}</td>
                    <td>{{ room.osszes_hely }}</td>
                    <td>{{ room.bekoltozesek?.length || 0 }}</td>
                    <td>{{ (room.osszes_hely || 0) - (room.bekoltozesek?.length || 0) }}</td>
                    <td>
                      {{ calculateOccupancyPercentage(room) }}%
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- Beköltözési előzmények -->
            <div v-else-if="reportType === 'bekoltozesek'" class="table-responsive">
              <div v-if="bekoltozesekLoading" class="text-center py-4">
                <div class="spinner-border" role="status">
                  <span class="visually-hidden">Betöltés...</span>
                </div>
              </div>
              <div v-else-if="bekoltozesek.length === 0" class="alert alert-info">
                Nincs találat a megadott szűrők alapján.
              </div>
              <table v-else class="table table-striped table-hover">
                <thead>
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
                  <tr v-for="bekoltozes in bekoltozesek" :key="bekoltozes.bekoltozes_id">
                    <td>{{ bekoltozes.diak?.nev || 'N/A' }}</td>
                    <td>{{ bekoltozes.szoba?.szoba_szama || 'N/A' }}</td>
                    <td>{{ formatDate(bekoltozes.bekoltozes_datum) }}</td>
                    <td>{{ bekoltozes.kikoltozes_datum ? formatDate(bekoltozes.kikoltozes_datum) : '-' }}</td>
                    <td>{{ bekoltozes.napok_szama }}</td>
                    <td>
                      <span class="badge" :class="bekoltozes.kikoltozes_datum ? 'bg-secondary' : 'bg-success'">
                        {{ bekoltozes.kikoltozes_datum ? 'Kiköltözött' : 'Jelenleg is lakik' }}
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- Diák jelentés -->
            <div v-else class="table-responsive">
              <table class="table table-striped">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Név</th>
                    <th>Email</th>
                    <th>Telefon</th>
                    <th>Szoba</th>
                    <th>Beköltözés dátuma</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="student in activeStudents" :key="student.diak_id">
                    <td>{{ student.diak_id }}</td>
                    <td>{{ student.nev }}</td>
                    <td>{{ student.email }}</td>
                    <td>{{ student.telefonszam }}</td>
                    <td>{{ student.bekoltozesek?.[0]?.szoba?.szoba_szama || 'N/A' }}</td>
                    <td>
                      {{ student.bekoltozesek?.[0]?.bekoltozes_datum 
                        ? new Date(student.bekoltozesek?.[0]?.bekoltozes_datum).toLocaleDateString()
                        : 'N/A' }}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- Additional Statistics -->
        <div class="card mt-4">
          <div class="card-body">
            <h5 class="card-title mb-3">Részletes statisztikák</h5>
            <div class="row">
              <div class="col-md-6">
                <p><strong>Átlagos foglaltsági arány:</strong> {{ stats?.averageOccupancy || 0 }}%</p>
                <p><strong>Legmagasabb foglaltságú szoba:</strong> {{ stats?.mostOccupiedRoom || 'N/A' }}</p>
              </div>
              <div class="col-md-6">
                <p><strong>Legutóbbi beköltözés:</strong> {{ stats?.latestMoveIn || 'N/A' }}</p>
                <p><strong>Legutóbbi kiköltözés:</strong> {{ stats?.latestMoveOut || 'N/A' }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { defineComponent, ref, onMounted, computed } from 'vue'
import { useAuthStore } from '../store/auth'
import api from '../services/api'

export default defineComponent({
  name: 'ReportsView',
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
        const statsResponse = await api.get('/diak/statistics')
        if (statsResponse.data.success) {
          stats.value = statsResponse.data.data
        }
        
        // Fetch rooms
        const roomsResponse = await api.get('/szoba')
        if (roomsResponse.data.success) {
          rooms.value = roomsResponse.data.data
        }
        
        // Fetch active students
        const studentsResponse = await api.get('/diaks')
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
        
        const response = await api.get(`/szoba/bekoltozesek?${params.toString()}`)
        if (response.data.success) {
          bekoltozesek.value = response.data.data
        }
      } catch (err) {
        console.error('Hiba a beköltözések lekérdezésekor:', err)
        error.value = err.response?.data?.error || err.message || 'Hiba a beköltözések lekérdezésekor'
      } finally {
        bekoltozesekLoading.value = false
      }
    }
    
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

    const handleGenerateReport = async (type) => {
      reportType.value = type
      if (type === 'bekoltozesek') {
        await fetchBekoltozesek()
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
      clearFilters,
      formatDate,
      calculateOccupancyPercentage,
      handleGenerateReport,
      handleExport
    }
  }
})
</script>