<template>
  <div class="container-fluid">
    <div class="row">
      <div class="col-12">
        <div class="d-flex justify-content-between align-items-center mb-3">
          <h2>Diákok kezelése</h2>
          <button class="btn btn-primary" @click="showEnrollModal = true">
            Diák felvétele
          </button>
        </div>
        
        <div class="card">
          <div class="card-body">
            <div class="row mb-3">
              <div class="col-md-4">
                <input 
                  type="text" 
                  class="form-control" 
                  placeholder="Diák keresése név vagy szobaszám alapján..."
                  v-model="searchQuery"
                  @input="debouncedSearch"
                >
              </div>
              <div class="col-md-3">
                <select class="form-select" v-model="selectedRoom">
                  <option value="">Összes szoba</option>
                  <option v-for="room in rooms" :key="room.szoba_id" :value="room.szoba_szama">
                    {{ room.szoba_szama }} ({{ getRoomOccupancy(room.szoba_szama) }}/{{ room.osszes_hely }})
                  </option>
                </select>
              </div>
              <div class="col-md-3">
                <select class="form-select" v-model="selectedStatus">
                  <option value="">Összes státusz</option>
                  <option value="true">Aktív</option>
                  <option value="false">Inaktív</option>
                </select>
              </div>
              <div class="col-md-2">
                <button class="btn btn-outline-secondary w-100" @click="clearFilters">
                  Szűrők törlése
                </button>
              </div>
            </div>
            
            <div class="table-responsive">
              <table class="table table-striped">
                <thead>
                  <tr>
                    <th>Név</th>
                    <th>Email</th>
                    <th>Telefonszám</th>
                    <th>Szoba</th>
                    <th>Státusz</th>
                    <th>Műveletek</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="student in filteredStudents" :key="student.diak_id">
                    <td>{{ student.nev }}</td>
                    <td>{{ student.email }}</td>
                    <td>{{ student.telefonszam }}</td>
                    <td>{{ student.szoba ? student.szoba.szoba_szama : 'Nincs szoba' }}</td>
                    <td>
                      <span class="badge" :class="student.aktiv ? 'bg-success' : 'bg-danger'">
                        {{ student.aktiv ? 'Aktív' : 'Inaktív' }}
                      </span>
                    </td>
                    <td>
                      <button class="btn btn-sm btn-outline-primary me-2" @click="viewStudent(student)">
                        Megtekintés
                      </button>
                      <button class="btn btn-sm btn-outline-warning me-2" @click="editStudent(student)">
                        Szerkesztés
                      </button>
                      <button class="btn btn-sm btn-outline-warning me-2" @click="transferStudent(student)">
                        Áthelyezés
                      </button>
                      <button class="btn btn-sm btn-outline-danger" @click="deleteStudent(student)">
                        Törlés
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Diák felvétel modal -->
    <div class="modal fade" tabindex="-1" v-if="showEnrollModal">
      <div class="modal-dialog modal-lg">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Diák felvétele</h5>
            <button type="button" class="btn-close" @click="showEnrollModal = false"></button>
          </div>
          <div class="modal-body">
            <form @submit.prevent="enrollStudent">
              <div class="row">
                <div class="col-md-6">
                  <h6>Diák adatai</h6>
                  <div class="mb-3">
                    <label class="form-label">Név</label>
                    <input type="text" class="form-control" v-model="enrollData.diakData.nev" required>
                  </div>
                  <div class="mb-3">
                    <label class="form-label">Email</label>
                    <input type="email" class="form-control" v-model="enrollData.diakData.email" required>
                  </div>
                  <div class="mb-3">
                    <label class="form-label">Telefonszám</label>
                    <input type="tel" class="form-control" v-model="enrollData.diakData.telefonszam" required>
                  </div>
                  <div class="mb-3">
                    <label class="form-label">Születési dátum</label>
                    <input type="date" class="form-control" v-model="enrollData.diakData.szuletesi_datum" required>
                  </div>
                  <div class="mb-3">
                    <label class="form-label">Személyi igazolvány szám</label>
                    <input type="text" class="form-control" v-model="enrollData.diakData.szemelyi_igazolvany_szam" required>
                  </div>
                  <div class="mb-3">
                    <label class="form-label">TAJ szám</label>
                    <input type="text" class="form-control" v-model="enrollData.diakData.taj_szam" required>
                  </div>
                  <div class="mb-3">
                    <label class="form-label">Diákigazolvány szám</label>
                    <input type="text" class="form-control" v-model="enrollData.diakData.diakigazolvany_szam" required>
                  </div>
                  <div class="mb-3">
                    <label class="form-label">Kapcsolat típusa</label>
                    <select class="form-select" v-model="enrollData.diakData.kapcsolat_tipusa" required>
                      <option value="anya">Anya</option>
                      <option value="apa">Apa</option>
                      <option value="gondviselo">Gondviselő</option>
                    </select>
                  </div>
                </div>
                <div class="col-md-6">
                  <h6>Szülő adatai</h6>
                  <div class="mb-3">
                    <label class="form-label">Név</label>
                    <input type="text" class="form-control" v-model="enrollData.szuloData.nev" required>
                  </div>
                  <div class="mb-3">
                    <label class="form-label">Email</label>
                    <input type="email" class="form-control" v-model="enrollData.szuloData.email" required>
                  </div>
                  <div class="mb-3">
                    <label class="form-label">Telefonszám</label>
                    <input type="tel" class="form-control" v-model="enrollData.szuloData.telefonszam" required>
                  </div>
                  <div class="mb-3">
                    <label class="form-label">Személyi igazolvány szám</label>
                    <input type="text" class="form-control" v-model="enrollData.szuloData.szemelyi_igazolvany_szam" required>
                  </div>
                  
                  <h6>Lakcím adatai</h6>
                  <div class="mb-3">
                    <label class="form-label">Ország</label>
                    <input type="text" class="form-control" v-model="enrollData.lakcimData.orszag" required>
                  </div>
                  <div class="mb-3">
                    <label class="form-label">Irányítószám</label>
                    <input type="text" class="form-control" v-model="enrollData.lakcimData.iranyitoszam" required>
                  </div>
                  <div class="mb-3">
                    <label class="form-label">Város</label>
                    <input type="text" class="form-control" v-model="enrollData.lakcimData.varos" required>
                  </div>
                  <div class="mb-3">
                    <label class="form-label">Utca, házszám</label>
                    <input type="text" class="form-control" v-model="enrollData.lakcimData.utca_hazszam" required>
                  </div>
                  
                  <div class="mb-3">
                    <label class="form-label">Szoba</label>
                    <select class="form-select" v-model="enrollData.szoba_id" required>
                      <option value="">Válasszon szobát</option>
                      <option v-for="room in rooms" :key="room.szoba_id" :value="room.szoba_id">
                        {{ room.szoba_szama }} ({{ room.osszes_hely }} fő)
                      </option>
                    </select>
                  </div>
                </div>
              </div>
              
              <div class="modal-footer">
                <button type="button" class="btn btn-secondary" @click="showEnrollModal = false">Mégse</button>
                <button type="submit" class="btn btn-primary" :disabled="enrollLoading">
                  {{ enrollLoading ? 'Mentés...' : 'Mentés' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Diák szerkesztés modal -->
    <div class="modal fade" tabindex="-1" v-if="showEditModal">
      <div class="modal-dialog modal-lg">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Diák szerkesztése</h5>
            <button type="button" class="btn-close" @click="showEditModal = false"></button>
          </div>
          <div class="modal-body">
            <form @submit.prevent="updateStudent">
              <div class="row">
                <div class="col-md-6">
                  <h6>Diák adatai</h6>
                  <div class="mb-3">
                    <label class="form-label">Név</label>
                    <input type="text" class="form-control" v-model="editStudentData.nev" required>
                  </div>
                  <div class="mb-3">
                    <label class="form-label">Email</label>
                    <input type="email" class="form-control" v-model="editStudentData.email" required>
                  </div>
                  <div class="mb-3">
                    <label class="form-label">Telefonszám</label>
                    <input type="tel" class="form-control" v-model="editStudentData.telefonszam" required>
                  </div>
                  <div class="mb-3">
                    <label class="form-label">Születési dátum</label>
                    <input type="date" class="form-control" v-model="editStudentData.szuletesi_datum" required>
                  </div>
                  <div class="mb-3">
                    <label class="form-label">Személyi igazolvány szám</label>
                    <input type="text" class="form-control" v-model="editStudentData.szemelyi_igazolvany_szam" required>
                  </div>
                  <div class="mb-3">
                    <label class="form-label">TAJ szám</label>
                    <input type="text" class="form-control" v-model="editStudentData.taj_szam" required>
                  </div>
                  <div class="mb-3">
                    <label class="form-label">Diákigazolvány szám</label>
                    <input type="text" class="form-control" v-model="editStudentData.diakigazolvany_szam" required>
                  </div>
                  <div class="mb-3">
                    <label class="form-label">Kapcsolat típusa</label>
                    <select class="form-select" v-model="editStudentData.kapcsolat_tipusa" required>
                      <option value="anya">Anya</option>
                      <option value="apa">Apa</option>
                      <option value="gondviselo">Gondviselő</option>
                    </select>
                  </div>
                </div>
                <div class="col-md-6">
                  <h6>Szülő adatai</h6>
                  <div class="mb-3">
                    <label class="form-label">Név</label>
                    <input type="text" class="form-control" v-model="editStudentData.szuloData.nev" required>
                  </div>
                  <div class="mb-3">
                    <label class="form-label">Email</label>
                    <input type="email" class="form-control" v-model="editStudentData.szuloData.email" required>
                  </div>
                  <div class="mb-3">
                    <label class="form-label">Telefonszám</label>
                    <input type="tel" class="form-control" v-model="editStudentData.szuloData.telefonszam" required>
                  </div>
                  <div class="mb-3">
                    <label class="form-label">Személyi igazolvány szám</label>
                    <input type="text" class="form-control" v-model="editStudentData.szuloData.szemelyi_igazolvany_szam" required>
                  </div>
                  
                  <h6>Lakcím adatai</h6>
                  <div class="mb-3">
                    <label class="form-label">Ország</label>
                    <input type="text" class="form-control" v-model="editStudentData.lakcimData.orszag" required>
                  </div>
                  <div class="mb-3">
                    <label class="form-label">Irányítószám</label>
                    <input type="text" class="form-control" v-model="editStudentData.lakcimData.iranyitoszam" required>
                  </div>
                  <div class="mb-3">
                    <label class="form-label">Város</label>
                    <input type="text" class="form-control" v-model="editStudentData.lakcimData.varos" required>
                  </div>
                  <div class="mb-3">
                    <label class="form-label">Utca, házszám</label>
                    <input type="text" class="form-control" v-model="editStudentData.lakcimData.utca_hazszam" required>
                  </div>
                  
                  <div class="mb-3">
                    <label class="form-label">Szoba</label>
                    <select class="form-select" v-model="editStudentData.szoba_id">
                      <option value="">Nincs szoba</option>
                      <option v-for="room in rooms" :key="room.szoba_id" :value="room.szoba_id">
                        {{ room.szoba_szama }} ({{ room.osszes_hely }} fő)
                      </option>
                    </select>
                  </div>
                </div>
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
    
    <!-- Törlés megerősítő modal -->
    <div class="modal fade" tabindex="-1" v-if="showDeleteModal">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Diák törlése</h5>
            <button type="button" class="btn-close" @click="showDeleteModal = false"></button>
          </div>
          <div class="modal-body">
            <p>Biztosan törölni szeretné a következő diákot?</p>
            <p><strong>{{ deleteStudentData?.nev }}</strong></p>
            <p class="text-warning">
              <small>
                Figyelem: A diák törlése csak akkor lehetséges, ha nincs aktív szobája.
              </small>
            </p>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" @click="showDeleteModal = false">Mégse</button>
            <button type="button" class="btn btn-danger" @click="confirmDeleteStudent" :disabled="deleteLoading">
              {{ deleteLoading ? 'Törlés...' : 'Törlés' }}
            </button>
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
  name: 'StudentsView',
  setup() {
    const students = ref([])
    const rooms = ref([])
    const loading = ref(false)
    const searchQuery = ref('')
    const selectedRoom = ref('')
    const selectedStatus = ref('')
    const showEnrollModal = ref(false)
    const enrollLoading = ref(false)
    const roomOccupancy = ref(new Map())
    
    const enrollData = ref({
      diakData: {
        nev: '',
        email: '',
        telefonszam: '',
        szuletesi_datum: '',
        szemelyi_igazolvany_szam: '',
        taj_szam: '',
        diakigazolvany_szam: '',
        kapcsolat_tipusa: 'anya'
      },
      szuloData: {
        nev: '',
        email: '',
        telefonszam: '',
        szemelyi_igazolvany_szam: ''
      },
      lakcimData: {
        orszag: '',
        iranyitoszam: '',
        varos: '',
        utca_hazszam: ''
      },
      szoba_id: ''
    })
    
    const showEditModal = ref(false)
    const showDeleteModal = ref(false)
    const updateLoading = ref(false)
    const deleteLoading = ref(false)
    
    const editStudentData = ref({
      nev: '',
      email: '',
      telefonszam: '',
      szuletesi_datum: '',
      szemelyi_igazolvany_szam: '',
      taj_szam: '',
      diakigazolvany_szam: '',
      kapcsolat_tipusa: 'anya',
      szuloData: {
        nev: '',
        email: '',
        telefonszam: '',
        szemelyi_igazolvany_szam: ''
      },
      lakcimData: {
        orszag: '',
        iranyitoszam: '',
        varos: '',
        utca_hazszam: ''
      },
      szoba_id: ''
    })
    
    const deleteStudentData = ref(null)
    const currentEditStudentId = ref(null)

    const authStore = useAuthStore()

    const fetchStudents = async () => {
      loading.value = true
      try {
        const response = await api.get('/diaks')
        if (response.data.success) {
          students.value = response.data.data
        }
      } catch (error) {
        console.error('Hiba a diákok lekérése közben:', error)
      } finally {
        loading.value = false
      }
    }

    const fetchRooms = async () => {
      try {
        const response = await api.get('/szoba')
        if (response.data.success) {
          rooms.value = response.data.data
          // Fetch room occupancy for each room
          await Promise.all(rooms.value.map(room => fetchRoomOccupancy(room.szoba_szama)))
        }
      } catch (error) {
        console.error('Hiba a szobák lekérése közben:', error)
      }
    }

    const fetchRoomOccupancy = async (roomNumber) => {
      try {
        const room = rooms.value.find(r => r.szoba_szama === roomNumber)
        if (room) {
          const response = await api.get(`/szoba/${room.szoba_id}/occupancy`)
          if (response.data.success) {
            roomOccupancy.value.set(roomNumber, response.data.data.currentOccupancy)
          }
        }
      } catch (error) {
        console.error('Hiba a szoba elfoglaltságának lekérése közben:', error)
      }
    }

    const filteredStudents = computed(() => {
      let result = students.value
      
      // Filter by search query (name, email, or room number)
      if (searchQuery.value) {
        const query = searchQuery.value.toLowerCase()
        result = result.filter(student => 
          student.nev.toLowerCase().includes(query) ||
          student.email.toLowerCase().includes(query) ||
          student.szoba?.szoba_szama?.toString().includes(query)
        )
      }
      
      // Filter by room
      if (selectedRoom.value) {
        result = result.filter(student => student.szoba?.szoba_szama === selectedRoom.value)
      }
      
      // Filter by status
      if (selectedStatus.value !== '') {
        result = result.filter(student => student.aktiv.toString() === selectedStatus.value)
      }
      
      return result
    })

    const enrollStudent = async () => {
      enrollLoading.value = true
      try {
        const response = await api.post('/diaks/enroll', enrollData.value)
        if (response.data.success) {
          showEnrollModal.value = false
          resetEnrollForm()
          fetchStudents()
        }
      } catch (error) {
        console.error('Hiba a diák felvétele közben:', error)
      } finally {
        enrollLoading.value = false
      }
    }

    const resetEnrollForm = () => {
      enrollData.value = {
        diakData: {
          nev: '',
          email: '',
          telefonszam: '',
          szuletesi_datum: '',
          szemelyi_igazolvany_szam: '',
          taj_szam: '',
          diakigazolvany_szam: '',
          kapcsolat_tipusa: 'anya'
        },
        szuloData: {
          nev: '',
          email: '',
          telefonszam: '',
          szemelyi_igazolvany_szam: ''
        },
        lakcimData: {
          orszag: '',
          iranyitoszam: '',
          varos: '',
          utca_hazszam: ''
        },
        szoba_id: ''
      }
    }

    // Debounced search function
    const debouncedSearch = debounce(async () => {
      if (searchQuery.value.trim()) {
        try {
          const response = await api.get('/diaks/search', {
            params: {
              nev: searchQuery.value,
              email: searchQuery.value,
              szoba_szama: searchQuery.value
            }
          })
          if (response.data.success) {
            students.value = response.data.data
          }
        } catch (error) {
          console.error('Hiba a diák keresése közben:', error)
        }
      } else {
        // If search is empty, fetch all students
        fetchStudents()
      }
    }, 300)

    // Get room occupancy for display
    const getRoomOccupancy = (roomNumber) => {
      return roomOccupancy.value.get(roomNumber) || 0
    }

    // Clear all filters
    const clearFilters = () => {
      searchQuery.value = ''
      selectedRoom.value = ''
      selectedStatus.value = ''
    }

    // Check if room has capacity for transfer
    const canTransferToRoom = (student, targetRoom) => {
      const currentRoom = rooms.value.find(r => r.szoba_szama === student.szoba?.szoba_szama)
      const targetRoomData = rooms.value.find(r => r.szoba_szama === targetRoom)
      
      if (!targetRoomData) return false
      
      // Check if target room has capacity
      const currentOccupancy = students.value.filter(s => s.szoba?.szoba_szama === targetRoom).length
      return currentOccupancy < targetRoomData.osszes_hely
    }

    const viewStudent = (student) => {
      // Diák részletes megtekintése
      console.log('Diák megtekintése:', student)
    }

    const transferStudent = async (student) => {
      // Diák áthelyezése
      try {
        // Check room capacity before transfer
        const availableRooms = rooms.value.filter(room => 
          room.szoba_szama !== student.szoba?.szoba_szama &&
          canTransferToRoom(student, room.szoba_szama)
        )
        
        if (availableRooms.length === 0) {
          toast.error('Nincs elérhető szabad szoba a diák áthelyezéséhez!')
          return
        }
        
        // For now, just show a success message
        // In a real implementation, this would open a modal to select the target room
        toast.success(`Diák áthelyezése: ${student.nev}`)
        console.log('Diák áthelyezése:', student)
        
      } catch (error) {
        console.error('Hiba a diák áthelyezése közben:', error)
        toast.error('Hiba történt a diák áthelyezése közben')
      }
    }

    const moveOutStudent = (student) => {
      // Diák kiköltöztetése
      console.log('Diák kiköltöztetése:', student)
    }

    const editStudent = (student) => {
      currentEditStudentId.value = student.diak_id
      editStudentData.value = {
        nev: student.nev,
        email: student.email,
        telefonszam: student.telefonszam,
        szuletesi_datum: student.szuletesi_datum,
        szemelyi_igazolvany_szam: student.szemelyi_igazolvany_szam,
        taj_szam: student.taj_szam,
        diakigazolvany_szam: student.diakigazolvany_szam,
        kapcsolat_tipusa: student.kapcsolat_tipusa,
        szuloData: {
          nev: student.szulo?.nev || '',
          email: student.szulo?.email || '',
          telefonszam: student.szulo?.telefonszam || '',
          szemelyi_igazolvany_szam: student.szulo?.szemelyi_igazolvany_szam || ''
        },
        lakcimData: {
          orszag: student.lakcim?.orszag || '',
          iranyitoszam: student.lakcim?.iranyitoszam || '',
          varos: student.lakcim?.varos || '',
          utca_hazszam: student.lakcim?.utca_hazszam || ''
        },
        szoba_id: student.szoba?.szoba_id || ''
      }
      showEditModal.value = true
    }

    const updateStudent = async () => {
      updateLoading.value = true
      try {
        const response = await api.put(`/diaks/${currentEditStudentId.value}`, editStudentData.value)
        if (response.data.success) {
          showEditModal.value = false
          fetchStudents()
          toast.success('Diák adatai sikeresen módosítva')
        }
      } catch (error) {
        console.error('Hiba a diák módosítása közben:', error)
        toast.error('Hiba történt a diák módosítása közben')
      } finally {
        updateLoading.value = false
      }
    }

    const deleteStudent = (student) => {
      deleteStudentData.value = student
      showDeleteModal.value = true
    }

    const confirmDeleteStudent = async () => {
      deleteLoading.value = true
      try {
        const response = await api.delete(`/diaks/${deleteStudentData.value.diak_id}`)
        if (response.data.success) {
          showDeleteModal.value = false
          fetchStudents()
          toast.success('Diák sikeresen törölve')
        }
      } catch (error) {
        console.error('Hiba a diák törlése közben:', error)
        toast.error('Hiba történt a diák törlése közben')
      } finally {
        deleteLoading.value = false
      }
    }

    onMounted(() => {
      fetchStudents()
      fetchRooms()
    })

    return {
      students,
      rooms,
      loading,
      searchQuery,
      selectedRoom,
      selectedStatus,
      showEnrollModal,
      enrollLoading,
      enrollData,
      roomOccupancy,
      filteredStudents,
      fetchStudents,
      enrollStudent,
      viewStudent,
      transferStudent,
      moveOutStudent,
      editStudent,
      updateStudent,
      deleteStudent,
      confirmDeleteStudent,
      debouncedSearch,
      getRoomOccupancy,
      clearFilters,
      canTransferToRoom,
      showEditModal,
      showDeleteModal,
      updateLoading,
      deleteLoading,
      editStudentData,
      deleteStudentData
    }
  }
}
</script>