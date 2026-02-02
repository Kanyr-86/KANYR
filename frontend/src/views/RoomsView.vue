<template>
  <div class="container-fluid">
    <div class="row">
      <div class="col-12">
        <h2>Szobák kezelése</h2>
        
        <div class="card">
          <div class="card-body">
            <div class="row mb-3">
              <div class="col-md-3">
                <input 
                  type="text" 
                  class="form-control" 
                  placeholder="Keresés szobaszám alapján"
                  v-model="searchQuery"
                >
              </div>
            </div>
            
            <div class="row">
              <div class="col-md-4" v-for="room in filteredRooms" :key="room.id">
                <div class="card mb-3">
                  <div class="card-header">
                    <h5>{{ room.szobaszam }}</h5>
                    <span class="badge bg-primary">{{ room.kapacitas }} fő</span>
                  </div>
                  <div class="card-body">
                    <p class="card-text">
                      <strong>Foglaltság:</strong> {{ room.currentOccupancy || 0 }} / {{ room.kapacitas }}
                    </p>
                    <div class="progress mb-3">
                      <div class="progress-bar" :style="{ width: getOccupancyPercentage(room) + '%' }">
                        {{ getOccupancyPercentage(room) }}%
                      </div>
                    </div>
                    
                    <div v-if="room.diakok && room.diakok.length > 0">
                      <h6>Diákok:</h6>
                      <ul class="list-group list-group-flush">
                        <li class="list-group-item" v-for="student in room.diakok" :key="student.id">
                          {{ student.nev }}
                          <span class="badge bg-success ms-2" v-if="student.aktiv">Aktív</span>
                          <span class="badge bg-danger ms-2" v-else>Inaktív</span>
                        </li>
                      </ul>
                    </div>
                    <div v-else>
                      <p class="text-muted">Nincs bent lakó</p>
                    </div>
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
import { ref, onMounted, computed } from 'vue'
import { useAuthStore } from '../store/auth'
import api from '../services/api'

export default {
  name: 'RoomsView',
  setup() {
    const rooms = ref([])
    const loading = ref(false)
    const searchQuery = ref('')
    
    const authStore = useAuthStore()

    const fetchRooms = async () => {
      loading.value = true
      try {
        const response = await api.get('/szoba')
        if (response.data.success) {
          rooms.value = response.data.data
        }
      } catch (error) {
        console.error('Hiba a szobák lekérése közben:', error)
      } finally {
        loading.value = false
      }
    }

    const filteredRooms = computed(() => {
      let result = rooms.value
      
      if (searchQuery.value) {
        result = result.filter(room => 
          room.szobaszam.toLowerCase().includes(searchQuery.value.toLowerCase())
        )
      }
      
      return result
    })

    const getOccupancyPercentage = (room) => {
      if (!room.kapacitas) return 0
      const current = room.currentOccupancy || 0
      return Math.round((current / room.kapacitas) * 100)
    }

    onMounted(() => {
      fetchRooms()
    })

    return {
      rooms,
      loading,
      searchQuery,
      filteredRooms,
      getOccupancyPercentage
    }
  }
}
</script>