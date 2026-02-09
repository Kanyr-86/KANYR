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
                  class="btn btn-primary"
                  @click="handleGenerateReport('students')"
                >
                  Diák jelentés
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

        <!-- Report Data -->
        <div class="card">
          <div class="card-header">
            <h5>{{ reportType === 'occupancy' ? 'Szobafoglaltsági jelentés' : 'Diák jelentés' }}</h5>
          </div>
          <div class="card-body">
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
      calculateOccupancyPercentage,
      handleGenerateReport,
      handleExport
    }
  }
})
</script>