<template>
  <div class="container-fluid">
    <!-- Loading Overlay -->
    <LoadingOverlay :show="loading" message="Diákok betöltése..." />
    
    <div class="row">
      <div class="col-12">
        <!-- Page Header -->
        <div class="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h2 class="mb-1">Diákok kezelése</h2>
            <p class="text-muted mb-0">Diák adatok kezelése és szobába költöztetés</p>
          </div>
          <div class="d-flex gap-2">
            <button 
              class="btn btn-primary btn-lg" 
              @click="openEnrollModal"
              :disabled="loading"
            >
              <i class="bi bi-plus-circle me-2"></i>Diák felvétele
            </button>
          </div>
        </div>
        
        <!-- Filters and Stats -->
        <div class="row mb-4">
          <div class="col-md-8">
            <StudentFilters
              v-model:searchQuery="searchQuery"
              v-model:selectedStatus="selectedStatus"
              :loading="loading"
              @clear="clearFilters"
            />
          </div>
          <div class="col-md-4">
            <StudentStats
              :loading="loading"
              :totalCount="studentsCount"
              :activeCount="activeStudentsCount"
            />
          </div>
        </div>
        
        <!-- Students Table -->
        <StudentTable
          :loading="loading"
          :students="safeFilteredStudents"
          :filteredCount="filteredStudentsCount"
          @view="viewStudent"
          @edit="editStudent"
          @transfer="transferStudent"
          @delete="deleteStudent"
        />
      </div>
    </div>

    <!-- Enroll Modal -->
    <StudentEnrollModal
      v-model:show="showEnrollModal"
      :form="enrollForm"
      :errors="errors"
      :loading="enrollLoading"
      :showValidationSummary="showValidationSummary"
      :isValid="isValid"
      @close="closeEnrollModal"
      @submit="submitEnrollment"
      @validate="validateFieldImmediate"
    />

    <!-- Edit Modal -->
    <StudentEditModal
      v-model:show="showEditModal"
      :form="editForm"
      :errors="editErrors"
      :loading="editLoading"
      :showValidationSummary="showEditValidationSummary"
      :isValid="isEditValid"
      @close="closeEditModal"
      @submit="submitEdit"
      @validate="validateEditFieldImmediate"
    />

    <!-- View Modal -->
    <StudentViewModal
      v-model:show="showViewModal"
      v-model:activeTab="activeViewTab"
      :student="viewStudentData"
      @close="closeViewModal"
    />

    <!-- Delete Modal -->
    <StudentDeleteModal
      v-model:show="showDeleteModal"
      :student="deleteStudentData"
      :loading="deleteLoading"
      @close="closeDeleteModal"
      @confirm="confirmDelete"
    />
  </div>
</template>

<script>
import { ref, onMounted, computed } from 'vue'
import api from '../services/api'
import { toast } from 'vue3-toastify'
import { getSuccessMessage, getErrorMessage, VALIDATION_MESSAGES } from '@/i18n'
import { useApiCancel } from '../composables/useApiCancel'
import { defineAsyncComponent } from 'vue'

// Import sub-components
import StudentFilters from './students/StudentFilters.vue'
import StudentStats from './students/StudentStats.vue'
import StudentTable from './students/StudentTable.vue'
import StudentEnrollModal from './students/StudentEnrollModal.vue'
import StudentEditModal from './students/StudentEditModal.vue'
import StudentViewModal from './students/StudentViewModal.vue'
import StudentDeleteModal from './students/StudentDeleteModal.vue'

// Lazy load LoadingOverlay
const LoadingOverlay = defineAsyncComponent(() => import('../components/LoadingOverlay.vue'))

/**
 * Validation rules for student forms
 */
const VALIDATION_RULES = {
  email: (value) => {
    if (!value || value.trim() === '') return VALIDATION_MESSAGES.REQUIRED
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(value.trim())) return VALIDATION_MESSAGES.EMAIL_INVALID
    return ''
  },
  telefonszam: (value) => {
    if (!value || value.trim() === '') return VALIDATION_MESSAGES.REQUIRED
    const normalized = value.replace(/\s/g, '')
    const hungarianPhoneRegex = /^(\+36|06)[1-9][0-9]{7,8}$/
    if (!hungarianPhoneRegex.test(normalized)) {
      return 'Érvénytelen telefonszám formátum (pl. +36201234567 vagy 06201234567)'
    }
    return ''
  },
  nev: (value) => {
    if (!value || value.trim() === '') return VALIDATION_MESSAGES.REQUIRED
    if (value.trim().length < 2) return VALIDATION_MESSAGES.MIN_LENGTH(2)
    if (value.trim().length > 100) return VALIDATION_MESSAGES.MAX_LENGTH(100)
    const nameRegex = /^[\p{L}\s\-'.]+$/u
    if (!nameRegex.test(value.trim())) {
      return 'A név csak betűket, szóközt és kötőjelet tartalmazhat'
    }
    return ''
  },
  szuletesi_datum: (value) => {
    if (!value || value.trim() === '') return VALIDATION_MESSAGES.REQUIRED
    const date = new Date(value)
    const now = new Date()
    if (isNaN(date.getTime())) return VALIDATION_MESSAGES.DATE_INVALID
    if (date > now) return 'A születési dátum nem lehet a jövőben'
    const age = now.getFullYear() - date.getFullYear()
    if (age < 15) return 'A diák legalább 15 éves kell legyen'
    if (age > 100) return 'Érvénytelen születési dátum'
    return ''
  },
  nem: (value) => {
    if (!value || value.trim() === '') return VALIDATION_MESSAGES.REQUIRED
    if (!['férfi', 'nő'].includes(value)) return 'Érvénytelen nem érték'
    return ''
  },
  szemelyi_igazolvany_szam: (value) => {
    if (!value || value.trim() === '') return VALIDATION_MESSAGES.REQUIRED
    const normalized = value.trim().toUpperCase()
    const idRegex = /^[0-9]{6}[A-Z]{2}$/
    if (!idRegex.test(normalized)) {
      return 'Érvénytelen formátum (6 számjegy + 2 nagybetű, pl: 123456AA)'
    }
    return ''
  },
  taj_szam: (value) => {
    if (!value || value.trim() === '') return VALIDATION_MESSAGES.REQUIRED
    const normalized = value.replace(/\s/g, '')
    const tajRegex = /^[0-9]{9}$/
    if (!tajRegex.test(normalized)) {
      return 'A TAJ szám pontosan 9 számjegyből áll'
    }
    const digits = normalized.split('').map(Number)
    const weights = [3, 7, 3, 7, 3, 7, 3, 7]
    let sum = 0
    for (let i = 0; i < 8; i++) {
      sum += digits[i] * weights[i]
    }
    const checksum = sum % 10
    if (checksum !== digits[8]) {
      return 'Érvénytelen TAJ szám (hibás ellenőrző számjegy)'
    }
    return ''
  },
  diakigazolvany_szam: (value) => {
    if (!value || value.trim() === '') return VALIDATION_MESSAGES.REQUIRED
    const normalized = value.replace(/\s/g, '')
    const studentIdRegex = /^[0-9]{8}$/
    if (!studentIdRegex.test(normalized)) {
      return 'A diákigazolvány szám pontosan 8 számjegyből áll'
    }
    return ''
  },
  kapcsolat_tipusa: (value) => {
    if (!value || value.trim() === '') return VALIDATION_MESSAGES.REQUIRED
    if (!['anya', 'apa', 'gondviselo'].includes(value)) return 'Érvénytelen kapcsolat típus'
    return ''
  }
}

const validateForm = (formData, errorsRef) => {
  let isValid = true
  Object.keys(errorsRef).forEach(key => delete errorsRef[key])
  for (const [field, value] of Object.entries(formData)) {
    if (VALIDATION_RULES[field]) {
      const error = VALIDATION_RULES[field](value)
      if (error) {
        errorsRef[field] = error
        isValid = false
      }
    }
  }
  return isValid
}

const validateField = (field, value) => {
  if (VALIDATION_RULES[field]) {
    return VALIDATION_RULES[field](value)
  }
  return ''
}

export default {
  name: 'StudentsView',
  components: {
    LoadingOverlay,
    StudentFilters,
    StudentStats,
    StudentTable,
    StudentEnrollModal,
    StudentEditModal,
    StudentViewModal,
    StudentDeleteModal
  },
  setup() {
    const { createAbortController, isAbortError } = useApiCancel()
    
    // State
    const students = ref([])
    const loading = ref(false)
    const searchQuery = ref('')
    const selectedStatus = ref('')
    
    // Modal loading states
    const enrollLoading = ref(false)
    const editLoading = ref(false)
    const deleteLoading = ref(false)
    
    // Modal visibility states
    const showEnrollModal = ref(false)
    const showEditModal = ref(false)
    const showViewModal = ref(false)
    const showDeleteModal = ref(false)
    
    // Modal data
    const viewStudentData = ref(null)
    const deleteStudentData = ref(null)
    const activeViewTab = ref('adatok')
    
    // Forms
    const enrollForm = ref({
      nev: '',
      email: '',
      telefonszam: '',
      szuletesi_datum: '',
      nem: '',
      szemelyi_igazolvany_szam: '',
      taj_szam: '',
      diakigazolvany_szam: '',
      kapcsolat_tipusa: ''
    })
    
    const editForm = ref({
      nev: '',
      email: '',
      telefonszam: '',
      szuletesi_datum: '',
      nem: '',
      szemelyi_igazolvany_szam: '',
      taj_szam: '',
      diakigazolvany_szam: '',
      kapcsolat_tipusa: '',
      aktiv: true
    })
    
    const currentEditId = ref(null)
    
    // Form errors
    const errors = ref({})
    const editErrors = ref({})
    const showValidationSummary = ref(false)
    const showEditValidationSummary = ref(false)

    // Computed properties
    const studentsCount = computed(() => students.value?.length || 0)
    const activeStudentsCount = computed(() => students.value?.filter(s => s?.aktiv).length || 0)

    const safeFilteredStudents = computed(() => {
      if (!students.value || !Array.isArray(students.value)) return []
      
      let result = [...students.value]
      
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
      
      if (selectedStatus.value !== '') {
        const statusBool = selectedStatus.value === 'true'
        result = result.filter(student => student && Boolean(student.aktiv) === statusBool)
      }
      
      return result
    })

    const filteredStudentsCount = computed(() => safeFilteredStudents.value.length)
    const isValid = computed(() => Object.values(errors.value).every(error => !error))
    const isEditValid = computed(() => Object.values(editErrors.value).every(error => !error))

    // Methods
    const fetchStudents = async () => {
      loading.value = true
      const { signal } = createAbortController()
      try {
        const response = await api.get('/students?includeRelations=true', { signal })
        if (response.data?.success) {
          const data = Array.isArray(response.data.data) ? response.data.data : []
          students.value.splice(0, students.value.length, ...data)
        } else {
          students.value.splice(0, students.value.length)
        }
      } catch (error) {
        if (isAbortError(error)) return
        console.error('Error fetching students:', error)
        students.value.splice(0, students.value.length)
      } finally {
        loading.value = false
      }
    }

    const clearFilters = () => {
      searchQuery.value = ''
      selectedStatus.value = ''
    }

    const validateFieldImmediate = (field, value) => {
      errors.value[field] = validateField(field, value)
    }
    
    const validateEditFieldImmediate = (field, value) => {
      editErrors.value[field] = validateField(field, value)
    }

    // Modal methods - Enroll
    const openEnrollModal = () => {
      showEnrollModal.value = true
      errors.value = {}
      showValidationSummary.value = false
    }
    
    const closeEnrollModal = () => {
      showEnrollModal.value = false
      enrollForm.value = {
        nev: '',
        email: '',
        telefonszam: '',
        szuletesi_datum: '',
        nem: '',
        szemelyi_igazolvany_szam: '',
        taj_szam: '',
        diakigazolvany_szam: '',
        kapcsolat_tipusa: ''
      }
      errors.value = {}
      showValidationSummary.value = false
    }
    
    const submitEnrollment = async () => {
      const isFormValid = validateForm(enrollForm.value, errors.value)
      
      if (!isFormValid) {
        showValidationSummary.value = true
        toast.error('Kérjük, javítsa a hibákat a mentés előtt!')
        return
      }
      
      enrollLoading.value = true
      try {
        const response = await api.post('/students', enrollForm.value)
        if (response.data.success) {
          toast.success(getSuccessMessage('ENROLL_SUCCESS'))
          closeEnrollModal()
          fetchStudents()
        }
      } catch (error) {
        console.error(getErrorMessage('CREATE_ERROR'), error)
        toast.error(error.response?.data?.error || getErrorMessage('CREATE_ERROR'))
      } finally {
        enrollLoading.value = false
      }
    }

    // Modal methods - View
    const viewStudent = (student) => {
      viewStudentData.value = student
      activeViewTab.value = 'adatok'
      showViewModal.value = true
    }
    
    const closeViewModal = () => {
      showViewModal.value = false
      viewStudentData.value = null
    }

    // Modal methods - Edit
    const editStudent = (student) => {
      currentEditId.value = student.diak_id
      editForm.value = {
        nev: student.nev || '',
        email: student.email || '',
        telefonszam: student.telefonszam || '',
        szuletesi_datum: student.szuletesi_datum || '',
        nem: student.nem || '',
        szemelyi_igazolvany_szam: student.szemelyi_igazolvany_szam || '',
        taj_szam: student.taj_szam || '',
        diakigazolvany_szam: student.diakigazolvany_szam || '',
        kapcsolat_tipusa: student.kapcsolat_tipusa || '',
        aktiv: student.aktiv || false
      }
      editErrors.value = {}
      showEditValidationSummary.value = false
      showEditModal.value = true
    }
    
    const closeEditModal = () => {
      showEditModal.value = false
      currentEditId.value = null
      editErrors.value = {}
      showEditValidationSummary.value = false
    }
    
    const submitEdit = async () => {
      const isFormValid = validateForm(editForm.value, editErrors.value)
      
      if (!isFormValid) {
        showEditValidationSummary.value = true
        toast.error('Kérjük, javítsa a hibákat a mentés előtt!')
        return
      }
      
      editLoading.value = true
      try {
        const response = await api.put(`/students/${currentEditId.value}`, editForm.value)
        if (response.data.success) {
          toast.success(getSuccessMessage('UPDATE_SUCCESS'))
          closeEditModal()
          fetchStudents()
        }
      } catch (error) {
        console.error(getErrorMessage('UPDATE_ERROR'), error)
        toast.error(error.response?.data?.error || getErrorMessage('UPDATE_ERROR'))
      } finally {
        editLoading.value = false
      }
    }

    // Modal methods - Transfer
    const transferStudent = (student) => {
      toast.info(`${student.nev} költöztetése - funkció fejlesztés alatt`)
    }

    // Modal methods - Delete
    const deleteStudent = (student) => {
      deleteStudentData.value = student
      showDeleteModal.value = true
    }
    
    const closeDeleteModal = () => {
      showDeleteModal.value = false
      deleteStudentData.value = null
    }
    
    const confirmDelete = async () => {
      if (!deleteStudentData.value) return
      
      deleteLoading.value = true
      try {
        const response = await api.delete(`/students/${deleteStudentData.value.diak_id}`)
        if (response.data.success) {
          toast.success(getSuccessMessage('DELETE_SUCCESS'))
          closeDeleteModal()
          fetchStudents()
        } else {
          toast.error(response.data.error || getErrorMessage('DELETE_ERROR'))
        }
      } catch (error) {
        console.error(getErrorMessage('DELETE_ERROR'), error)
        toast.error(error.response?.data?.error || getErrorMessage('DELETE_ERROR'))
      } finally {
        deleteLoading.value = false
      }
    }

    onMounted(() => {
      fetchStudents()
    })

    return {
      // State
      students,
      loading,
      searchQuery,
      selectedStatus,
      // Modal loading states
      enrollLoading,
      editLoading,
      deleteLoading,
      // Modal visibility states
      showEnrollModal,
      showEditModal,
      showViewModal,
      showDeleteModal,
      // Modal data
      viewStudentData,
      deleteStudentData,
      activeViewTab,
      // Forms
      enrollForm,
      editForm,
      // Form errors
      errors,
      editErrors,
      showValidationSummary,
      showEditValidationSummary,
      // Computed
      studentsCount,
      activeStudentsCount,
      safeFilteredStudents,
      filteredStudentsCount,
      isValid,
      isEditValid,
      // Methods
      clearFilters,
      openEnrollModal,
      closeEnrollModal,
      submitEnrollment,
      viewStudent,
      closeViewModal,
      editStudent,
      closeEditModal,
      submitEdit,
      transferStudent,
      deleteStudent,
      closeDeleteModal,
      confirmDelete,
      validateFieldImmediate,
      validateEditFieldImmediate
    }
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
</style>
