<template>
  <div class="container-fluid">
    <div class="row">
      <div class="col-12">
        <div class="d-flex justify-content-between align-items-center mb-3">
          <h2>Szobák kezelése</h2>
          <div class="d-flex gap-2">
            <button class="btn btn-primary" @click="showCreateModal = true">
              Szoba felvétele
            </button>
            <button class="btn btn-info" @click="showBulkTransferModal = true">
              Tömeges beköltöztetés
            </button>
          </div>
        </div>
        
        <div class="card">
          <div class="card-body">
            <div class="row mb-3">
              <div class="col-md-4">
                <input 
                  type="text" 
                  class="form-control" 
                  placeholder="Szoba keresése szobaszám alapján..."
                  v-model="searchQuery"
                  @input="debouncedSearch"
                >
              </div>
              <div class="col-md-3">
                <select class="form-select" v-model="selectedCapacity">
                  <option value="">Összes férőhely</option>
                  <option value="1">1 fő</option>
                  <option value="2">2 fő</option>
                  <option value="3">3 fő</option>
                  <option value="4">4 fő</option>
                </select>
              </div>
              <div class="col-md-3">
                <select class="form-select" v-model="selectedStatus">
                  <option value="">Összes státusz</option>
                  <option value="available">Elérhető</option>
                  <option value="full">Tele</option>
                  <option value="occupied">Foglalt</option>
                </select>
              </div>
              <div class="col-md-2">
                <button class="btn btn-outline-secondary w-100" @click="clearFilters">
                  Szűrők törlése
                </button>
              </div>
            </div>
            
            <div class="row">
              <div class="col-md-4" v-for="room in filteredRooms" :key="room.szoba_id">
                <div class="card mb-3">
                  <div class="card-header d-flex justify-content-between align-items-center">
                    <h5>{{ room.szoba_szama }}</h5>
                    <div>
                      <span class="badge" :class="getRoomStatusClass(room)">
                        {{ getRoomStatusText(room) }}
                      </span>
                    </div>
                  </div>
                  <div class="card-body">
                    <p class="card-text">
                      <strong>Férőhely:</strong> {{ room.osszes_hely }} fő
                    </p>
                    <p class="card-text">
                      <strong>Jelenlegi lakók:</strong> {{ room.currentOccupancy || 0 }}
                    </p>
                    <div class="progress mb-3">
                      <div class="progress-bar" :style="{ width: getOccupancyPercentage(room) + '%' }">
                        {{ getOccupancyPercentage(room) }}%
                      </div>
                    </div>
                    
                    <div v-if="room.diakok && room.diakok.length > 0">
                      <h6>Diákok:</h6>
                      <ul class="list-group list-group-flush">
                        <li class="list-group-item" v-for="student in room.diakok" :key="student.diak_id">
                          <div>
                            <span>{{ student.nev }}</span>
                            <span class="badge bg-success ms-2" v-if="student.aktiv">Aktív</span>
                            <span class="badge bg-danger ms-2" v-else>Inaktív</span>
                          </div>
                        </li>
                      </ul>
                    </div>
                    <div v-else>
                      <p class="text-muted">Nincs bent lakó</p>
                    </div>
                    
                    <div class="mt-3">
                      <button class="btn btn-sm btn-outline-primary me-2" @click="viewRoomDetails(room)">
                        Részletek
                      </button>
                      <button class="btn btn-sm btn-outline-warning me-2" @click="editRoom(room)">
                        Szerkesztés
                      </button>
                      <button class="btn btn-sm btn-outline-danger" @click="deleteRoom(room)">
                        Törlés
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Szoba felvétel modal -->
    <div class="modal fade show" tabindex="-1" v-if="showCreateModal" style="display: block;">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Szoba felvétele</h5>
            <button type="button" class="btn-close" @click="showCreateModal = false"></button>
          </div>
          <div class="modal-body">
            <form @submit.prevent="createRoom">
              <div class="mb-3">
                <label class="form-label">Szobaszám</label>
                <input type="text" class="form-control" v-model="roomData.szoba_szama" required>
              </div>
              <div class="mb-3">
                <label class="form-label">Férőhely</label>
                <input type="number" class="form-control" v-model="roomData.osszes_hely" min="1" max="10" required>
              </div>
              
              <div class="modal-footer">
                <button type="button" class="btn btn-secondary" @click="showCreateModal = false">Mégse</button>
                <button type="submit" class="btn btn-primary" :disabled="createLoading">
                  {{ createLoading ? 'Mentés...' : 'Mentés' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Szoba szerkesztés modal -->
    <div class="modal fade show" tabindex="-1" v-if="showEditModal" style="display: block;">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Szoba szerkesztése</h5>
            <button type="button" class="btn-close" @click="showEditModal = false"></button>
          </div>
          <div class="modal-body">
            <form @submit.prevent="updateRoom">
              <div class="mb-3">
                <label class="form-label">Szobaszám</label>
                <input type="text" class="form-control" v-model="editRoomData.szoba_szama" required>
              </div>
              <div class="mb-3">
                <label class="form-label">Férőhely</label>
                <input type="number" class="form-control" v-model="editRoomData.osszes_hely" min="1" max="10" required>
              </div>
              
              <div class="modal-footer">
                <button type="button" class="btn btn-secondary" @click="showEditModal = false">Mégse</button>
                <button type="submit" class="btn btn-primary" :disabled="updateLoading">
                  {{ updateLoading ? 'Mentés...' : 'Mentés' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Tömeges beköltöztetés modal -->
    <div class="modal fade show" tabindex="-1" v-if="showBulkTransferModal" style="display: block;">
      <div class="modal-dialog modal-lg">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Tömeges beköltöztetés</h5>
            <button type="button" class="btn-close" @click="showBulkTransferModal = false"></button>
          </div>
          <div class="modal-body">
            <form @submit.prevent="bulkTransfer">
              <div class="mb-3">
                <label class="form-label">Cél szoba</label>
                <select class="form-select" v-model="bulkTransferData.szoba_id" required>
                  <option value="">Válasszon szobát</option>
                  <option v-for="room in availableRooms" :key="room.szoba_id" :value="room.szoba_id">
                    {{ room.szoba_szama }} ({{ room.osszes_hely }} fő, {{ room.currentOccupancy || 0 }}/{{ room.osszes_hely }} foglalt)
                  </option>
                </select>
              </div>
              
              <div class="mb-3">
                <label class="form-label">Beköltözés dátuma</label>
                <input type="date" class="form-control" v-model="bulkTransferData.bekoltozes_datum" required>
              </div>
              
              <div class="mb-3">
                <label class="form-label">Diákok kiválasztása</label>
                <div class="table-responsive">
                  <table class="table table-striped">
                    <thead>
                      <tr>
                        <th>Választ</th>
                        <th>Név</th>
                        <th>Email</th>
                        <th>Státusz</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="student in availableStudents" :key="student.diak_id">
                        <td>
                          <input type="checkbox" :value="student.diak_id" v-model="bulkTransferData.diak_ids">
                        </td>
                        <td>{{ student.nev }}</td>
                        <td>{{ student.email }}</td>
                        <td>
                          <span class="badge" :class="student.aktiv ? 'bg-success' : 'bg-danger'">
                            {{ student.aktiv ? 'Aktív' : 'Inaktív' }}
                          </span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
              
              <div class="modal-footer">
                <button type="button" class="btn btn-secondary" @click="showBulkTransferModal = false">Mégse</button>
                <button type="submit" class="btn btn-primary" :disabled="bulkTransferLoading">
                  {{ bulkTransferLoading ? 'Beköltöztetés...' : 'Beköltöztetés' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Törlés megerősítő modal -->
    <div class="modal fade show" tabindex="-1" v-if="showDeleteModal" style="display: block;">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Szoba törlése</h5>
            <button type="button" class="btn-close" @click="showDeleteModal = false"></button>
          </div>
          <div class="modal-body">
            <p>Biztosan törölni szeretné a következő szobát?</p>
            <p><strong>{{ deleteRoomData?.szoba_szama }}</strong></p>
            <p class="text-warning">
              <small>
                Figyelem: A szoba törlése csak akkor lehetséges, ha nincs benne aktív diák.
              </small>
            </p>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" @click="showDeleteModal = false">Mégse</button>
            <button type="button" class="btn btn-danger" @click="confirmDeleteRoom" :disabled="deleteLoading">
              {{ deleteLoading ? 'Törlés...' : 'Törlés' }}
            </button>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Szoba részletek modal -->
    <div class="modal fade show" tabindex="-1" v-if="showDetailsModal" style="display: block;">
      <div class="modal-dialog modal-lg">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Szoba részletei: {{ selectedRoomDetails?.szoba_szama }}</h5>
            <button type="button" class="btn-close" @click="showDetailsModal = false"></button>
          </div>
          <div class="modal-body">
            <div v-if="detailsLoading" class="text-center">
              <div class="spinner-border" role="status">
                <span class="visually-hidden">Betöltés...</span>
              </div>
            </div>
            <div v-else>
              <div class="row mb-3">
                <div class="col-md-6">
                  <p><strong>Férőhely:</strong> {{ selectedRoomDetails?.osszes_hely }} fő</p>
                </div>
                <div class="col-md-6">
                  <p><strong>Jelenlegi lakók:</strong> {{ selectedRoomDetails?.currentOccupancy || 0 }} fő</p>
                </div>
              </div>
              
              <h6 class="mb-3">Bent lakó diákok:</h6>
              <div v-if="selectedRoomDetails?.diakok && selectedRoomDetails.diakok.length > 0">
                <div class="table-responsive">
                  <table class="table table-striped">
                    <thead>
                      <tr>
                        <th>Név</th>
                        <th>Email</th>
                        <th>Telefon</th>
                        <th>Beköltözés dátuma</th>
                        <th>Státusz</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="student in selectedRoomDetails.diakok" :key="student.diak_id">
                        <td>{{ student.nev }}</td>
                        <td>{{ student.email || '-' }}</td>
                        <td>{{ student.telefon || '-' }}</td>
                        <td>{{ formatDate(student.bekoltozes_datum) }}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
              <div v-else class="alert alert-info">
                Nincs bent lakó ebben a szobában.
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" @click="showDetailsModal = false">Bezárás</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, computed, watch } from 'vue'
import { useAuthStore } from '../store/auth'
import api from '../services/api'
import { debounce } from 'lodash-es'
import { toast } from 'vue3-toastify'

export default {
  name: 'RoomsView',
  setup() {
    const rooms = ref([])
    const loading = ref(false)
    const searchQuery = ref('')
    const selectedCapacity = ref('')
    const selectedStatus = ref('')
    const showCreateModal = ref(false)
    const showEditModal = ref(false)
    const showDeleteModal = ref(false)
    const showBulkTransferModal = ref(false)
    const showDetailsModal = ref(false)
    const createLoading = ref(false)
    const updateLoading = ref(false)
    const deleteLoading = ref(false)
    const bulkTransferLoading = ref(false)
    const detailsLoading = ref(false)
    
    const selectedRoomDetails = ref(null)
    
    const roomData = ref({
      szoba_szama: '',
      osszes_hely: 2
    })
    
    const editRoomData = ref({
      szoba_szama: '',
      osszes_hely: 2
    })
    
    const deleteRoomData = ref(null)
    const currentEditRoomId = ref(null)
    
    const bulkTransferData = ref({
      szoba_id: '',
      bekoltozes_datum: '',
      diak_ids: []
    })
    
    const availableRooms = ref([])
    const availableStudents = ref([])
    
    const authStore = useAuthStore()

    const fetchRooms = async () => {
      loading.value = true
      try {
        const response = await api.get('/szobas')
        if (response.data.success) {
          rooms.value = response.data.data
          // Fetch occupancy for each room
          await Promise.all(rooms.value.map(room => fetchRoomOccupancy(room.szoba_id)))
        }
      } catch (error) {
        console.error('Hiba a szobák lekérése közben:', error)
        toast.error('Hiba történt a szobák betöltése közben')
      } finally {
        loading.value = false
      }
    }

    const fetchRoomOccupancy = async (roomId) => {
      try {
        const response = await api.get(`/szobas/${roomId}/occupancy`)
        if (response.data.success) {
          const room = rooms.value.find(r => r.szoba_id === roomId)
          if (room) {
            room.currentOccupancy = response.data.data.currentOccupancy
            room.diakok = response.data.data.students || []
          }
        }
      } catch (error) {
        console.error('Hiba a szoba elfoglaltságának lekérése közben:', error)
      }
    }

    const fetchAvailableRooms = async () => {
      try {
        const response = await api.get('/szobas/available')
        if (response.data.success) {
          availableRooms.value = response.data.data
        }
      } catch (error) {
        console.error('Hiba az elérhető szobák lekérése közben:', error)
      }
    }

    const fetchAvailableStudents = async () => {
      try {
        const response = await api.get('/diaks')
        if (response.data.success) {
          availableStudents.value = response.data.data.filter(s => s.aktiv)
        }
      } catch (error) {
        console.error('Hiba a diákok lekérése közben:', error)
      }
    }

    const filteredRooms = computed(() => {
      let result = rooms.value
      
      // Filter by search query (room number)
      if (searchQuery.value) {
        const query = searchQuery.value.toLowerCase()
        result = result.filter(room => 
          room.szoba_szama.toLowerCase().includes(query)
        )
      }
      
      // Filter by capacity
      if (selectedCapacity.value) {
        result = result.filter(room => room.osszes_hely.toString() === selectedCapacity.value)
      }
      
      // Filter by status
      if (selectedStatus.value) {
        result = result.filter(room => {
          const occupancy = room.currentOccupancy || 0
          const capacity = room.osszes_hely
          
          if (selectedStatus.value === 'available') {
            return occupancy < capacity
          } else if (selectedStatus.value === 'full') {
            return occupancy === capacity
          } else if (selectedStatus.value === 'occupied') {
            return occupancy > 0
          }
          return true
        })
      }
      
      return result
    })

    const getOccupancyPercentage = (room) => {
      if (!room.osszes_hely) return 0
      const current = room.currentOccupancy || 0
      return Math.round((current / room.osszes_hely) * 100)
    }

    const getRoomStatusClass = (room) => {
      const occupancy = room.currentOccupancy || 0
      const capacity = room.osszes_hely
      
      if (occupancy === 0) return 'bg-secondary'
      if (occupancy === capacity) return 'bg-danger'
      if (occupancy >= capacity * 0.8) return 'bg-warning'
      return 'bg-success'
    }

    const getRoomStatusText = (room) => {
      const occupancy = room.currentOccupancy || 0
      const capacity = room.osszes_hely
      
      if (occupancy === 0) return 'Üres'
      if (occupancy === capacity) return 'Tele'
      if (occupancy >= capacity * 0.8) return 'Majdnem tele'
      return 'Elérhető'
    }

    const createRoom = async () => {
      createLoading.value = true
      try {
        const response = await api.post('/szobas', roomData.value)
        if (response.data.success) {
          showCreateModal.value = false
          resetCreateForm()
          fetchRooms()
          toast.success('Szoba sikeresen felvéve')
        }
      } catch (error) {
        console.error('Hiba a szoba felvétele közben:', error)
        toast.error('Hiba történt a szoba felvétele közben')
      } finally {
        createLoading.value = false
      }
    }

    const editRoom = (room) => {
      currentEditRoomId.value = room.szoba_id
      editRoomData.value = {
        szoba_szama: room.szoba_szama,
        osszes_hely: room.osszes_hely
      }
      showEditModal.value = true
    }

    const updateRoom = async () => {
      updateLoading.value = true
      try {
        const response = await api.put(`/szobas/${currentEditRoomId.value}`, editRoomData.value)
        if (response.data.success) {
          showEditModal.value = false
          fetchRooms()
          toast.success('Szoba adatai sikeresen módosítva')
        }
      } catch (error) {
        console.error('Hiba a szoba módosítása közben:', error)
        toast.error('Hiba történt a szoba módosítása közben')
      } finally {
        updateLoading.value = false
      }
    }

    const deleteRoom = (room) => {
      deleteRoomData.value = room
      showDeleteModal.value = true
    }

    const confirmDeleteRoom = async () => {
      deleteLoading.value = true
      try {
        const response = await api.delete(`/szobas/${deleteRoomData.value.szoba_id}`)
        if (response.data.success) {
          showDeleteModal.value = false
          fetchRooms()
          toast.success('Szoba sikeresen törölve')
        }
      } catch (error) {
        console.error('Hiba a szoba törlése közben:', error)
        toast.error('Hiba történt a szoba törlése közben')
      } finally {
        deleteLoading.value = false
      }
    }

    const viewRoomDetails = async (room) => {
      detailsLoading.value = true
      showDetailsModal.value = true
      
      // Reaktív objektum létrehozása
      selectedRoomDetails.value = {
        szoba_szama: room.szoba_szama,
        osszes_hely: room.osszes_hely,
        currentOccupancy: room.currentOccupancy || 0,
        diakok: []
      }
      
      try {
        const response = await api.get(`/szobas/${room.szoba_id}/occupancy`)
        console.log('API válasz:', response.data)
        if (response.data.success) {
          const data = response.data.data
          console.log('Students adatok:', data.students)
          // Objektum tulajdonságainak közvetlen módosítása a reaktivitás megőrzéséhez
          selectedRoomDetails.value.currentOccupancy = data.currentOccupancy
          selectedRoomDetails.value.diakok = data.students || []
        }
      } catch (error) {
        console.error('Hiba a szoba részleteinek lekérése közben:', error)
        toast.error('Hiba történt a szoba részleteinek betöltése közben')
      } finally {
        detailsLoading.value = false
      }
    }

    const formatDate = (dateString) => {
      if (!dateString) return '-'
      const date = new Date(dateString)
      return date.toLocaleDateString('hu-HU', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    }

    const viewStudent = (student) => {
      console.log('Diák megtekintése:', student)
      toast.info(`Diák megtekintése: ${student.nev}`)
    }

    const transferStudent = async (student) => {
      try {
        // Get available rooms for transfer
        const response = await api.get('/szobas/available')
        if (response.data.success) {
          const availableRooms = response.data.data
          const currentRoom = rooms.value.find(r => r.szoba_id === student.szoba?.szoba_id)
          
          // Filter out current room and check capacity
          const transferableRooms = availableRooms.filter(room => 
            room.szoba_id !== currentRoom?.szoba_id
          )
          
          if (transferableRooms.length === 0) {
            toast.error('Nincs elérhető szabad szoba a diák áthelyezéséhez!')
            return
          }
          
          // For now, just show a success message
          toast.success(`Diák áthelyezése: ${student.nev}`)
          console.log('Diák áthelyezése:', student)
        }
      } catch (error) {
        console.error('Hiba a diák áthelyezése közben:', error)
        toast.error('Hiba történt a diák áthelyezése közben')
      }
    }

    const moveOutStudent = (student) => {
      console.log('Diák kiköltöztetése:', student)
      toast.info(`Diák kiköltöztetése: ${student.nev}`)
    }

    const bulkTransfer = async () => {
      bulkTransferLoading.value = true
      try {
        const response = await api.post('/szobas/bulk-bekoltozes', bulkTransferData.value)
        if (response.data.success) {
          showBulkTransferModal.value = false
          resetBulkTransferForm()
          fetchRooms()
          toast.success('Tömeges beköltöztetés sikeresen megtörtént')
        }
      } catch (error) {
        console.error('Hiba a tömeges beköltöztetés közben:', error)
        toast.error('Hiba történt a tömeges beköltöztetés közben')
      } finally {
        bulkTransferLoading.value = false
      }
    }

    const resetCreateForm = () => {
      roomData.value = {
        szoba_szama: '',
        osszes_hely: 2
      }
    }

    const resetBulkTransferForm = () => {
      bulkTransferData.value = {
        szoba_id: '',
        bekoltozes_datum: '',
        diak_ids: []
      }
    }

    // Debounced search function
    const debouncedSearch = debounce(async () => {
      if (searchQuery.value.trim()) {
        try {
        const response = await api.get('/szobas', {
            params: {
              prefix: searchQuery.value
            }
          })
          if (response.data.success) {
            rooms.value = response.data.data
            // Fetch occupancy for each room
            await Promise.all(rooms.value.map(room => fetchRoomOccupancy(room.szoba_id)))
          }
        } catch (error) {
          console.error('Hiba a szoba keresése közben:', error)
        }
      } else {
        // If search is empty, fetch all rooms
        fetchRooms()
      }
    }, 300)

    // Clear all filters
    const clearFilters = () => {
      searchQuery.value = ''
      selectedCapacity.value = ''
      selectedStatus.value = ''
    }

    onMounted(() => {
      fetchRooms()
      fetchAvailableRooms()
      fetchAvailableStudents()
    })

    return {
      rooms,
      loading,
      searchQuery,
      selectedCapacity,
      selectedStatus,
      showCreateModal,
      showEditModal,
      showDeleteModal,
      showBulkTransferModal,
      showDetailsModal,
      createLoading,
      updateLoading,
      deleteLoading,
      bulkTransferLoading,
      detailsLoading,
      roomData,
      editRoomData,
      deleteRoomData,
      bulkTransferData,
      selectedRoomDetails,
      availableRooms,
      availableStudents,
      filteredRooms,
      fetchRooms,
      createRoom,
      editRoom,
      updateRoom,
      deleteRoom,
      confirmDeleteRoom,
      viewRoomDetails,
      viewStudent,
      transferStudent,
      moveOutStudent,
      bulkTransfer,
      resetCreateForm,
      resetBulkTransferForm,
      debouncedSearch,
      getOccupancyPercentage,
      getRoomStatusClass,
      getRoomStatusText,
      clearFilters,
      formatDate
    }
  }
}
</script>