<template>
  <div class="container-fluid">
    <div class="row">
      <div class="col-12">
        <div class="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h2 class="mb-1">Diákok kezelése</h2>
            <p class="text-muted mb-0">Diák adatok kezelése és szobába költöztetés</p>
          </div>
          <div class="d-flex gap-2">
            <button class="btn btn-primary btn-lg" @click="openEnrollModal">
              <i class="bi bi-plus-circle me-2"></i>Diák felvétele
            </button>
          </div>
        </div>
        
        <!-- Szűrők és statisztikák -->
        <div class="row mb-4">
          <div class="col-md-8">
            <div class="card">
              <div class="card-body">
                <div class="row g-3">
                  <div class="col-12 col-md-6">
                    <BaseInput
                      v-model="searchQuery"
                      label="Keresés"
                      placeholder="Név, email vagy szoba alapján..."
                      type="text"
                    />
                  </div>
                  <div class="col-12 col-md-4">
                    <label class="form-label fw-semibold">Státusz</label>
                    <select class="form-select" v-model="selectedStatus">
                      <option value="">Összes státusz</option>
                      <option value="true">Aktív</option>
                      <option value="false">Inaktív</option>
                    </select>
                  </div>
                  <div class="col-12 col-md-2 d-flex align-items-end">
                    <button class="btn btn-outline-secondary w-100" @click="clearFilters">
                      <i class="bi bi-x-circle me-2"></i>Szűrők törlése
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div class="col-md-4">
            <div class="row">
              <div class="col-6">
                <div class="card">
                  <div class="card-body text-center">
                    <h6 class="card-title mb-1">Összes diák</h6>
                    <h3 class="mb-0">{{ studentsCount }}</h3>
                  </div>
                </div>
              </div>
              <div class="col-6">
                <div class="card">
                  <div class="card-body text-center">
                    <h6 class="card-title mb-1">Aktív diákok</h6>
                    <h3 class="mb-0">{{ activeStudentsCount }}</h3>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Diákok táblázat -->
        <div class="card shadow-sm">
          <div class="card-header border-0">
            <div class="d-flex justify-content-between align-items-center">
              <h6 class="mb-0">Diák lista</h6>
              <span class="badge bg-light text-dark">{{ filteredStudentsCount }} diák</span>
            </div>
          </div>
          <div class="card-body p-0">
            <div class="table-responsive">
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
                <tbody>
                  <tr v-for="student in safeFilteredStudents" :key="student.diak_id" class="align-middle">
                    <td>
                      <div class="d-flex align-items-center">
                        <div class="avatar rounded-circle d-flex align-items-center justify-content-center me-3" style="width: 40px; height: 40px;">
                          {{ getInitial(student.nev) }}
                        </div>
                        <div>
                          <div class="fw-semibold">{{ student.nev }}</div>
                          <small class="text-muted">{{ student.nem === 'férfi' ? 'Férfi' : 'Nő' }}</small>
                        </div>
                      </div>
                    </td>
                    <td class="d-none d-md-table-cell">
                      <span class="badge">{{ student.email }}</span>
                    </td>
                    <td class="d-none d-lg-table-cell">{{ student.telefonszam || '-' }}</td>
                    <td>
                      <span v-if="student.szoba" class="badge">
                        <i class="bi bi-door-closed me-1"></i>{{ student.szoba.szoba_szama }}
                      </span>
                      <span v-else class="text-muted">Nincs szoba</span>
                    </td>
                    <td>
                      <span class="badge">
                        <i class="bi" :class="student.aktiv ? 'bi-check-circle' : 'bi-x-circle'"></i>
                        {{ student.aktiv ? 'Aktív' : 'Inaktív' }}
                      </span>
                    </td>
                    <td class="text-center">
                      <div class="btn-group" role="group">
                        <button 
                          class="btn btn-outline-primary btn-sm" 
                          @click="viewStudent(student)"
                          title="Diák megtekintése"
                        >
                          <i class="bi bi-eye me-1"></i>Megtekintés
                        </button>
                        <button 
                          class="btn btn-outline-warning btn-sm" 
                          @click="editStudent(student)"
                          title="Diák szerkesztése"
                        >
                          <i class="bi bi-pencil me-1"></i>Szerkesztés
                        </button>
                        <button 
                          class="btn btn-outline-info btn-sm" 
                          @click="transferStudent(student)"
                          title="Diák költöztetése"
                        >
                          <i class="bi bi-arrow-right me-1"></i>Áthelyezés
                        </button>
                        <button 
                          class="btn btn-outline-danger btn-sm" 
                          @click="deleteStudent(student)"
                          title="Diák törlése"
                        >
                          <i class="bi bi-trash me-1"></i>Törlés
                        </button>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
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
import { useApiStore } from '../store/api'
import api from '../services/api'
import { toast } from 'vue3-toastify'
import BaseModal from '../components/BaseModal.vue'
import BaseInput from '../components/forms/BaseInput.vue'

export default {
  name: 'StudentsView',
  setup() {
    // State
    const students = ref([])
    const rooms = ref([])
    const parents = ref([])
    const addresses = ref([])
    const loading = ref(false)
    const searchQuery = ref('')
    const selectedStatus = ref('')

    // Computed properties with safety checks
    const studentsCount = computed(() => {
      console.log('studentsCount computed, students.value:', students.value)
      if (!students.value || !Array.isArray(students.value)) {
        console.warn('students.value is not an array:', students.value)
        return 0
      }
      return students.value.length
    })

    const activeStudentsCount = computed(() => {
      console.log('activeStudentsCount computed, students.value:', students.value)
      if (!students.value || !Array.isArray(students.value)) {
        console.warn('students.value is not an array in activeStudentsCount:', students.value)
        return 0
      }
      return students.value.filter(student => student && student.aktiv).length
    })

    const safeFilteredStudents = computed(() => {
      console.log('safeFilteredStudents computed, students.value:', students.value)
      if (!students.value || !Array.isArray(students.value)) {
        console.warn('students.value is not an array in safeFilteredStudents:', students.value)
        return []
      }
      
      let result = [...students.value]
      
      // Filter by search query
      if (searchQuery.value) {
        const query = searchQuery.value.toLowerCase()
        result = result.filter(student => {
          if (!student) return false
          const matchesName = student.nev?.toLowerCase().includes(query) || false
          const matchesEmail = student.email?.toLowerCase().includes(query) || false
          const matchesRoomNumber = student.szoba?.szoba_szama?.toString().includes(query) || false
          const matchesNoRoom = !student.szoba && (query.includes('nincs') || query.includes('nincs szoba'))
          return matchesName || matchesEmail || matchesRoomNumber || matchesNoRoom
        })
      }
      
      // Filter by status
      if (selectedStatus.value !== '') {
        const statusBool = selectedStatus.value === 'true'
        result = result.filter(student => student && Boolean(student.aktiv) === statusBool)
      }
      
      return result
    })

    const filteredStudentsCount = computed(() => {
      return safeFilteredStudents.value.length
    })

    // Helper function to get initial
    const getInitial = (name) => {
      if (!name || typeof name !== 'string') return '?'
      return name.charAt(0).toUpperCase()
    }

    // Fetch students with detailed logging
    const fetchStudents = async () => {
      console.log('=== fetchStudents START ===')
      loading.value = true
      try {
        console.log('Calling API: /diaks?includeRelations=true')
        const response = await api.get('/diaks?includeRelations=true')
        console.log('API Response:', response)
        console.log('Response data:', response.data)
        console.log('Response data type:', typeof response.data)
        
        if (response.data && response.data.success) {
          const data = response.data.data
          console.log('Data from response:', data)
          console.log('Data type:', typeof data)
          console.log('Is Array:', Array.isArray(data))
          
          if (Array.isArray(data)) {
            students.value = data
            console.log('Students loaded successfully:', students.value.length, 'items')
          } else {
            console.error('ERROR: Data is not an array! Setting empty array.')
            students.value = []
          }
        } else {
          console.error('ERROR: Response not successful:', response.data)
          students.value = []
        }
      } catch (error) {
        console.error('ERROR in fetchStudents:', error)
        console.error('Error message:', error.message)
        console.error('Error response:', error.response?.data)
        students.value = []
      } finally {
        loading.value = false
        console.log('=== fetchStudents END ===')
        console.log('Final students.value:', students.value)
        console.log('Is students.value an array?', Array.isArray(students.value))
      }
    }

    // Other methods (placeholders - keeping only the essential ones for the fix)
    const clearFilters = () => {
      searchQuery.value = ''
      selectedStatus.value = ''
    }

    const openEnrollModal = () => {
      toast.info('Diák felvétel funkció - később implementálva')
    }

    const viewStudent = (student) => {
      console.log('View student:', student)
    }

    const editStudent = (student) => {
      console.log('Edit student:', student)
    }

    const transferStudent = (student) => {
      console.log('Transfer student:', student)
    }

    const deleteStudent = (student) => {
      console.log('Delete student:', student)
    }

    // Lifecycle
    onMounted(() => {
      console.log('=== StudentsView mounted ===')
      console.log('Initial students.value:', students.value)
      fetchStudents()
    })

    return {
      // State
      students,
      loading,
      searchQuery,
      selectedStatus,
      // Computed
      studentsCount,
      activeStudentsCount,
      safeFilteredStudents,
      filteredStudentsCount,
      // Methods
      clearFilters,
      openEnrollModal,
      viewStudent,
      editStudent,
      transferStudent,
      deleteStudent,
      getInitial,
      fetchStudents
    }
  }
}
</script>

<style scoped>
.avatar {
  background-color: var(--bs-primary);
  color: white;
  font-weight: bold;
}
</style>