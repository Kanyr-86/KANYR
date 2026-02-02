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
              <div class="col-md-3">
                <input 
                  type="text" 
                  class="form-control" 
                  placeholder="Keresés név alapján"
                  v-model="searchQuery"
                >
              </div>
              <div class="col-md-3">
                <select class="form-select" v-model="filterStatus">
                  <option value="">Összes státusz</option>
                  <option value="true">Aktív</option>
                  <option value="false">Inaktív</option>
                </select>
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
                  <tr v-for="student in filteredStudents" :key="student.id">
                    <td>{{ student.nev }}</td>
                    <td>{{ student.email }}</td>
                    <td>{{ student.telefonszam }}</td>
                    <td>{{ student.szoba ? student.szoba.szobaszam : 'Nincs szoba' }}</td>
                    <td>
                      <span class="badge" :class="student.aktiv ? 'bg-success' : 'bg-danger'">
                        {{ student.aktiv ? 'Aktív' : 'Inaktív' }}
                      </span>
                    </td>
                    <td>
                      <button class="btn btn-sm btn-outline-primary me-2" @click="viewStudent(student)">
                        Megtekintés
                      </button>
                      <button class="btn btn-sm btn-outline-warning me-2" @click="transferStudent(student)">
                        Áthelyezés
                      </button>
                      <button class="btn btn-sm btn-outline-danger" @click="moveOutStudent(student)">
                        Kiköltöztetés
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
                      <option v-for="room in rooms" :key="room.id" :value="room.id">
                        {{ room.szobaszam }} ({{ room.kapacitas }} fő)
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
  </div>
</template>

<script>
import { ref, onMounted, computed } from 'vue'
import { useAuthStore } from '../store/auth'
import api from '../services/api'

export default {
  name: 'StudentsView',
  setup() {
    const students = ref([])
    const rooms = ref([])
    const loading = ref(false)
    const searchQuery = ref('')
    const filterStatus = ref('')
    const showEnrollModal = ref(false)
    const enrollLoading = ref(false)
    
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

    const authStore = useAuthStore()

    const fetchStudents = async () => {
      loading.value = true
      try {
        const response = await api.get('/diak')
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
        }
      } catch (error) {
        console.error('Hiba a szobák lekérése közben:', error)
      }
    }

    const filteredStudents = computed(() => {
      let result = students.value
      
      if (searchQuery.value) {
        result = result.filter(student => 
          student.nev.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
          student.email.toLowerCase().includes(searchQuery.value.toLowerCase())
        )
      }
      
      if (filterStatus.value !== '') {
        result = result.filter(student => student.aktiv.toString() === filterStatus.value)
      }
      
      return result
    })

    const enrollStudent = async () => {
      enrollLoading.value = true
      try {
        const response = await api.post('/diak/enroll', enrollData.value)
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

    const viewStudent = (student) => {
      // Diák részletes megtekintése
      console.log('Diák megtekintése:', student)
    }

    const transferStudent = (student) => {
      // Diák áthelyezése
      console.log('Diák áthelyezése:', student)
    }

    const moveOutStudent = (student) => {
      // Diák kiköltöztetése
      console.log('Diák kiköltöztetése:', student)
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
      filterStatus,
      showEnrollModal,
      enrollLoading,
      enrollData,
      filteredStudents,
      fetchStudents,
      enrollStudent,
      viewStudent,
      transferStudent,
      moveOutStudent
    }
  }
}
</script>