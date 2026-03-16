<template>
  <div class="container-fluid">
    <!-- Loading Overlay -->
    <LoadingOverlay :show="loading" message="Szobák betöltése..." />
    
    <div class="row">
      <div class="col-12">
        <!-- Page Header -->
        <div class="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h2 class="mb-1">Szobák kezelése</h2>
            <p class="text-muted mb-0">Szobák kezelése és tömeges beköltöztetés</p>
          </div>
          <div class="d-flex gap-2">
            <button 
              class="btn btn-primary btn-lg" 
              @click="showCreateModal = true"
              :disabled="loading"
            >
              <i class="bi bi-plus-circle me-2"></i>Szoba felvétele
            </button>
            <button 
              class="btn btn-info btn-lg" 
              @click="openBulkTransferModal"
              :disabled="loading"
            >
              <i class="bi bi-people me-2"></i>Tömeges beköltöztetés
            </button>
          </div>
        </div>
        
        <!-- Filters and Stats -->
        <div class="row mb-4">
          <div class="col-md-8">
            <RoomFilters
              v-model:searchQuery="searchQuery"
              v-model:selectedCapacity="selectedCapacity"
              v-model:selectedStatus="selectedStatus"
              :loading="loading"
              @search="debouncedSearch"
              @clear="clearFilters"
            />
          </div>
          <div class="col-md-4">
            <RoomStats
              :loading="loading"
              :totalCount="rooms.length"
              :availableCount="availableRoomsCount"
            />
          </div>
        </div>
        
        <!-- Rooms Grid -->
        <RoomGrid
          :loading="loading"
          :rooms="filteredRooms"
          @view="viewRoomDetails"
          @edit="editRoom"
          @delete="deleteRoom"
        />
      </div>
    </div>
    
    <!-- Create Modal -->
    <RoomCreateModal
      v-model:show="showCreateModal"
      :formData="roomData"
      :loading="createLoading"
      @close="closeCreateModal"
      @submit="createRoom"
    />
    
    <!-- Edit Modal -->
    <RoomEditModal
      v-model:show="showEditModal"
      :formData="editRoomData"
      :loading="updateLoading"
      @close="closeEditModal"
      @submit="updateRoom"
    />
    
    <!-- Delete Modal -->
    <RoomDeleteModal
      v-model:show="showDeleteModal"
      :roomData="deleteRoomData"
      :loading="deleteLoading"
      @close="closeDeleteModal"
      @confirm="confirmDeleteRoom"
    />
    
    <!-- Details Modal -->
    <RoomDetailsModal
      v-model:show="showDetailsModal"
      :roomData="selectedRoomDetails"
      :loading="detailsLoading"
      @close="closeDetailsModal"
    />
    
    <!-- Bulk Transfer Modal -->
    <RoomBulkTransferModal
      v-model:show="showBulkTransferModal"
      :step="bulkTransferStep"
      :formData="bulkTransferData"
      :availableRooms="availableRoomsForBulkTransfer"
      :availableStudents="availableStudents"
      :selectedRoom="selectedRoomForTransfer"
      :loading="bulkTransferLoading"
      @close="closeBulkTransferModal"
      @select-room="selectRoomForBulkTransfer"
      @next-step="nextBulkTransferStep"
      @toggle-student="toggleStudentSelection"
      @submit="bulkTransfer"
    />
  </div>
</template>

<script>
import { ref, onMounted, computed, defineAsyncComponent } from 'vue'
import api from '../services/api'
import { toast } from 'vue3-toastify'
import { getSuccessMessage, getErrorMessage, ROOM_MESSAGES } from '@/i18n'
import { useApiCancel } from '../composables/useApiCancel'
import { debounce } from 'lodash-es'

// Import sub-components
import RoomFilters from './rooms/RoomFilters.vue'
import RoomStats from './rooms/RoomStats.vue'
import RoomGrid from './rooms/RoomGrid.vue'
import RoomCreateModal from './rooms/RoomCreateModal.vue'
import RoomEditModal from './rooms/RoomEditModal.vue'
import RoomDeleteModal from './rooms/RoomDeleteModal.vue'
import RoomDetailsModal from './rooms/RoomDetailsModal.vue'
import RoomBulkTransferModal from './rooms/RoomBulkTransferModal.vue'

// Lazy load LoadingOverlay
const LoadingOverlay = defineAsyncComponent(() => import('../components/LoadingOverlay.vue'))

export default {
  name: 'RoomsView',
  components: {
    LoadingOverlay,
    RoomFilters,
    RoomStats,
    RoomGrid,
    RoomCreateModal,
    RoomEditModal,
    RoomDeleteModal,
    RoomDetailsModal,
    RoomBulkTransferModal
  },
  setup() {
    const { createAbortController, isAbortError } = useApiCancel()
    
    // State
    const rooms = ref([])
    const loading = ref(false)
    const searchQuery = ref('')
    const selectedCapacity = ref('')
    const selectedStatus = ref('')
    
    // Modal visibility
    const showCreateModal = ref(false)
    const showEditModal = ref(false)
    const showDeleteModal = ref(false)
    const showDetailsModal = ref(false)
    const showBulkTransferModal = ref(false)
    
    // Modal loading states
    const createLoading = ref(false)
    const updateLoading = ref(false)
    const deleteLoading = ref(false)
    const detailsLoading = ref(false)
    const bulkTransferLoading = ref(false)
    
    // Room data
    const roomData = ref({ szoba_szama: '', osszes_hely: 2 })
    const editRoomData = ref({ szoba_szama: '', osszes_hely: 2 })
    const deleteRoomData = ref(null)
    const selectedRoomDetails = ref(null)
    const currentEditRoomId = ref(null)
    
    // Bulk transfer state
    const bulkTransferStep = ref(1)
    const selectedRoomForTransfer = ref(null)
    const availableRoomsForBulkTransfer = ref([])
    const availableStudents = ref([])
    const bulkTransferData = ref({
      szoba_id: '',
      bekoltozes_datum: new Date().toISOString().split('T')[0],
      diak_ids: []
    })

    // Computed
    const availableRoomsCount = computed(() => {
      return rooms.value.filter(room => {
        const occupancy = room.currentOccupancy || 0
        return occupancy < room.osszes_hely
      }).length
    })

    const filteredRooms = computed(() => {
      let result = [...rooms.value]
      
      if (searchQuery.value) {
        const query = searchQuery.value.toLowerCase()
        result = result.filter(room => 
          room.szoba_szama.toLowerCase().includes(query)
        )
      }
      
      if (selectedCapacity.value) {
        result = result.filter(room => room.osszes_hely.toString() === selectedCapacity.value)
      }
      
      if (selectedStatus.value) {
        result = result.filter(room => {
          const occupancy = room.currentOccupancy || 0
          const capacity = room.osszes_hely
          
          switch (selectedStatus.value) {
            case 'empty': return occupancy === 0
            case 'available': return occupancy > 0 && occupancy < capacity
            case 'full': return occupancy === capacity
            default: return true
          }
        })
      }
      
      return result
    })

    // Methods
    const fetchRooms = async () => {
      loading.value = true
      const { signal } = createAbortController()
      try {
        const response = await api.get('/rooms', { signal })
        if (response.data.success) {
          rooms.value = response.data.data
          await Promise.all(rooms.value.map(room => fetchRoomOccupancy(room.szoba_id)))
        }
      } catch (error) {
        if (isAbortError(error)) return
        console.error(getErrorMessage('LOAD_ERROR'), error)
        toast.error(getErrorMessage('LOAD_ERROR'))
      } finally {
        loading.value = false
      }
    }

    const fetchRoomOccupancy = async (roomId) => {
      const { signal } = createAbortController()
      try {
        const response = await api.get(`/rooms/${roomId}/occupancy`, { signal })
        if (response.data.success) {
          const room = rooms.value.find(r => r.szoba_id === roomId)
          if (room) {
            room.currentOccupancy = response.data.data.currentOccupancy
            room.diakok = response.data.data.students || []
          }
        }
      } catch (error) {
        if (isAbortError(error)) return
        console.error('Hiba a szoba elfoglaltságának lekérése közben:', error)
      }
    }

    // Create modal methods
    const closeCreateModal = () => {
      showCreateModal.value = false
      roomData.value = { szoba_szama: '', osszes_hely: 2 }
    }

    const createRoom = async () => {
      createLoading.value = true
      try {
        const response = await api.post('/rooms', roomData.value)
        if (response.data.success) {
          toast.success('Szoba sikeresen felvéve')
          closeCreateModal()
          fetchRooms()
        }
      } catch (error) {
        console.error('Hiba a szoba felvétele közben:', error)
        toast.error('Hiba történt a szoba felvétele közben')
      } finally {
        createLoading.value = false
      }
    }

    // Edit modal methods
    const editRoom = (room) => {
      currentEditRoomId.value = room.szoba_id
      editRoomData.value = {
        szoba_szama: room.szoba_szama,
        osszes_hely: room.osszes_hely
      }
      showEditModal.value = true
    }

    const closeEditModal = () => {
      showEditModal.value = false
      currentEditRoomId.value = null
      editRoomData.value = { szoba_szama: '', osszes_hely: 2 }
    }

    const updateRoom = async () => {
      updateLoading.value = true
      try {
        const response = await api.put(`/rooms/${currentEditRoomId.value}`, editRoomData.value)
        if (response.data.success) {
          toast.success('Szoba adatai sikeresen módosítva')
          closeEditModal()
          fetchRooms()
        }
      } catch (error) {
        console.error('Hiba a szoba módosítása közben:', error)
        toast.error('Hiba történt a szoba módosítása közben')
      } finally {
        updateLoading.value = false
      }
    }

    // Delete modal methods
    const deleteRoom = (room) => {
      deleteRoomData.value = room
      showDeleteModal.value = true
    }

    const closeDeleteModal = () => {
      showDeleteModal.value = false
      deleteRoomData.value = null
    }

    const confirmDeleteRoom = async () => {
      if (!deleteRoomData.value) return
      
      deleteLoading.value = true
      try {
        const response = await api.delete(`/rooms/${deleteRoomData.value.szoba_id}`)
        if (response.data.success) {
          toast.success('Szoba sikeresen törölve')
          closeDeleteModal()
          fetchRooms()
        } else {
          toast.error(response.data.error || 'Hiba történt a szoba törlése közben')
        }
      } catch (error) {
        console.error('Hiba a szoba törlése közben:', error)
        toast.error(error.response?.data?.error || 'Hiba történt a szoba törlése közben')
      } finally {
        deleteLoading.value = false
      }
    }

    // Details modal methods
    const viewRoomDetails = async (room) => {
      detailsLoading.value = true
      showDetailsModal.value = true
      
      selectedRoomDetails.value = {
        szoba_szama: room.szoba_szama,
        osszes_hely: room.osszes_hely,
        currentOccupancy: room.currentOccupancy || 0,
        diakok: []
      }
      
      try {
        const response = await api.get(`/szobas/${room.szoba_id}/occupancy`)
        if (response.data.success) {
          const data = response.data.data
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

    const closeDetailsModal = () => {
      showDetailsModal.value = false
      selectedRoomDetails.value = null
    }

    // Bulk transfer methods
    const openBulkTransferModal = async () => {
      showBulkTransferModal.value = true
      bulkTransferStep.value = 1
      selectedRoomForTransfer.value = null
      bulkTransferData.value = {
        szoba_id: '',
        bekoltozes_datum: new Date().toISOString().split('T')[0],
        diak_ids: []
      }
      
      await fetchRoomsWithDetailsForTransfer()
      await fetchAvailableStudents()
    }

    const fetchRoomsWithDetailsForTransfer = async () => {
      const { signal } = createAbortController()
      try {
        const response = await api.get('/szobas', { signal })
        if (response.data.success) {
          const roomsData = response.data.data
          
          await Promise.allSettled(roomsData.map(async (room) => {
            const { signal } = createAbortController()
            try {
              const occupancyResponse = await api.get(`/szobas/${room.szoba_id}/occupancy`, { signal })
              if (occupancyResponse.data.success) {
                room.currentOccupancy = occupancyResponse.data.data.currentOccupancy
              }
            } catch (error) {
              if (!isAbortError(error)) {
                room.currentOccupancy = 0
              }
            }
          }))
          
          availableRoomsForBulkTransfer.value = roomsData.filter(room => {
            const occupancy = room.currentOccupancy || 0
            return occupancy < room.osszes_hely
          })
        }
      } catch (error) {
        if (isAbortError(error)) return
        console.error('Hiba a szobák lekérése közben:', error)
        toast.error('Hiba történt a szobák betöltése közben')
      }
    }

    const fetchAvailableStudents = async () => {
      const { signal } = createAbortController()
      try {
        const response = await api.get('/students', { signal })
        if (response.data.success) {
          availableStudents.value = response.data.data
        }
      } catch (error) {
        if (isAbortError(error)) return
        console.error('Hiba a diákok lekérése közben:', error)
      }
    }

    const selectRoomForBulkTransfer = (room) => {
      selectedRoomForTransfer.value = room
      bulkTransferData.value.szoba_id = room.szoba_id
      bulkTransferStep.value = 2
    }

    const nextBulkTransferStep = () => {
      if (bulkTransferStep.value < 3) {
        bulkTransferStep.value++
      }
    }

    const toggleStudentSelection = (studentId) => {
      const index = bulkTransferData.value.diak_ids.indexOf(studentId)
      if (index > -1) {
        bulkTransferData.value.diak_ids.splice(index, 1)
      } else {
        bulkTransferData.value.diak_ids.push(studentId)
      }
    }

    const closeBulkTransferModal = () => {
      if (bulkTransferStep.value > 1) {
        bulkTransferStep.value--
        if (bulkTransferStep.value === 1) {
          selectedRoomForTransfer.value = null
          bulkTransferData.value.szoba_id = ''
        }
      } else {
        showBulkTransferModal.value = false
        bulkTransferStep.value = 1
        selectedRoomForTransfer.value = null
        bulkTransferData.value = {
          szoba_id: '',
          bekoltozes_datum: new Date().toISOString().split('T')[0],
          diak_ids: []
        }
      }
    }

    const bulkTransfer = async () => {
      bulkTransferLoading.value = true
      try {
        const response = await api.post('/rooms/bulk-bekoltozes', bulkTransferData.value)
        if (response.data.success) {
          const data = response.data.data
          showBulkTransferModal.value = false
          fetchRooms()
          
          const newCount = data.new_move_ins || 0
          const transferCount = data.transfer_count || 0
          
          if (newCount > 0 && transferCount > 0) {
            toast.success(`${newCount} új beköltöztetés és ${transferCount} átköltöztetés sikeres!`)
          } else if (transferCount > 0) {
            toast.success(`${transferCount} diák sikeresen átköltöztetve!`)
          } else {
            toast.success(`${newCount} diák sikeresen beköltöztetve!`)
          }
        }
      } catch (error) {
        console.error('Hiba a tömeges beköltöztetés közben:', error)
        toast.error(error.response?.data?.error || 'Hiba történt a tömeges beköltöztetés közben')
      } finally {
        bulkTransferLoading.value = false
      }
    }

    // Search and filters
    const debouncedSearch = debounce(async () => {
      if (searchQuery.value.trim()) {
        try {
          const response = await api.get('/rooms', {
            params: { prefix: searchQuery.value }
          })
          if (response.data.success) {
            rooms.value = response.data.data
            await Promise.all(rooms.value.map(room => fetchRoomOccupancy(room.szoba_id)))
          }
        } catch (error) {
          console.error('Hiba a szoba keresése közben:', error)
        }
      } else {
        fetchRooms()
      }
    }, 300)

    const clearFilters = () => {
      searchQuery.value = ''
      selectedCapacity.value = ''
      selectedStatus.value = ''
      fetchRooms()
    }

    onMounted(() => {
      fetchRooms()
    })

    return {
      // State
      rooms,
      loading,
      searchQuery,
      selectedCapacity,
      selectedStatus,
      // Modal visibility
      showCreateModal,
      showEditModal,
      showDeleteModal,
      showDetailsModal,
      showBulkTransferModal,
      // Modal loading
      createLoading,
      updateLoading,
      deleteLoading,
      detailsLoading,
      bulkTransferLoading,
      // Data
      roomData,
      editRoomData,
      deleteRoomData,
      selectedRoomDetails,
      bulkTransferData,
      availableRoomsForBulkTransfer,
      availableStudents,
      selectedRoomForTransfer,
      bulkTransferStep,
      // Computed
      availableRoomsCount,
      filteredRooms,
      // Methods
      fetchRooms,
      createRoom,
      closeCreateModal,
      editRoom,
      closeEditModal,
      updateRoom,
      deleteRoom,
      closeDeleteModal,
      confirmDeleteRoom,
      viewRoomDetails,
      closeDetailsModal,
      openBulkTransferModal,
      closeBulkTransferModal,
      selectRoomForBulkTransfer,
      nextBulkTransferStep,
      toggleStudentSelection,
      bulkTransfer,
      debouncedSearch,
      clearFilters
    }
  }
}
</script>
