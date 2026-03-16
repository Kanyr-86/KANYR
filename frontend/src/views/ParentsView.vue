<template>
  <div class="container-fluid">
    <!-- Loading Overlay -->
    <LoadingOverlay :show="loading" message="Szülők betöltése..." />
    
    <div class="row">
      <div class="col-12">
        <!-- Page Header -->
        <div class="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h2 class="mb-1">Szülők kezelése</h2>
            <p class="text-muted mb-0">Szülők adatainak kezelése és gyerekeik nyomon követése</p>
          </div>
          <button 
            class="btn btn-primary btn-lg" 
            @click="showCreateModal = true"
            :disabled="loading"
          >
            <i class="bi bi-plus-circle me-2"></i>Szülő felvétele
          </button>
        </div>
        
        <!-- Filters and Stats -->
        <div class="row mb-4">
          <div class="col-md-8">
            <ParentFilters
              v-model:searchQuery="searchQuery"
              v-model:selectedCity="selectedCity"
              :cities="uniqueCities"
              :loading="loading"
              @search="debouncedSearch"
              @clear="clearFilters"
            />
          </div>
          <div class="col-md-4">
            <ParentStats
              :loading="loading"
              :totalCount="parents.length"
              :childrenCount="totalChildrenCount"
            />
          </div>
        </div>
        
        <!-- Loading skeleton for cards -->
        <div v-if="loading" class="row">
          <div class="col-12">
            <div class="d-flex justify-content-center py-5">
              <div class="text-center">
                <div class="spinner-border text-primary" role="status" style="width: 3rem; height: 3rem;">
                  <span class="visually-hidden">Betöltés...</span>
                </div>
                <p class="mt-3 text-muted">Szülők betöltése...</p>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Parent Cards Grid -->
        <div v-else class="row">
          <div 
            class="col-md-6 col-lg-4" 
            v-for="parent in filteredParents" 
            :key="parent.szulo_id"
          >
            <ParentCard
              :parent="parent"
              :loading="loading"
              @view="viewParent"
              @edit="editParent"
              @delete="deleteParent"
            />
          </div>
        </div>
      </div>
    </div>
    
    <!-- Create Modal -->
    <ParentCreateModal
      v-model:show="showCreateModal"
      :formData="parentData"
      :loading="createLoading"
      @close="closeCreateModal"
      @submit="createParent"
    />
    
    <!-- Edit Modal -->
    <ParentEditModal
      v-model:show="showEditModal"
      :formData="editParentData"
      :loading="updateLoading"
      @close="closeEditModal"
      @submit="updateParent"
    />
    
    <!-- Delete Modal -->
    <ParentDeleteModal
      v-model:show="showDeleteModal"
      :parentData="deleteParentData"
      :loading="deleteLoading"
      @close="closeDeleteModal"
      @confirm="confirmDeleteParent"
    />
    
    <!-- View Modal -->
    <ParentViewModal
      v-model:show="showViewModal"
      v-model:activeTab="activeViewTab"
      :parentData="viewParentData"
      @close="closeViewModal"
    />
  </div>
</template>

<script>
import { ref, onMounted, computed, defineAsyncComponent } from 'vue'
import api from '../services/api'
import { useDebounce } from '../composables/useDebounce'
import { toast } from 'vue3-toastify'
import { getSuccessMessage, getErrorMessage } from '@/i18n'
import { useApiCancel } from '../composables/useApiCancel'

// Import sub-components
import ParentFilters from './parents/ParentFilters.vue'
import ParentStats from './parents/ParentStats.vue'
import ParentCard from './parents/ParentCard.vue'
import ParentCreateModal from './parents/ParentCreateModal.vue'
import ParentEditModal from './parents/ParentEditModal.vue'
import ParentDeleteModal from './parents/ParentDeleteModal.vue'
import ParentViewModal from './parents/ParentViewModal.vue'

// Lazy load LoadingOverlay
const LoadingOverlay = defineAsyncComponent(() => import('../components/LoadingOverlay.vue'))

export default {
  name: 'ParentsView',
  components: {
    LoadingOverlay,
    ParentFilters,
    ParentStats,
    ParentCard,
    ParentCreateModal,
    ParentEditModal,
    ParentDeleteModal,
    ParentViewModal
  },
  setup() {
    // API request cancellation
    const { createAbortController, isAbortError } = useApiCancel()
    
    const parents = ref([])
    const loading = ref(false)
    const searchQuery = ref('')
    const selectedCity = ref('')
    
    // Modal visibility
    const showCreateModal = ref(false)
    const showEditModal = ref(false)
    const showDeleteModal = ref(false)
    const showViewModal = ref(false)
    
    // Modal loading states
    const createLoading = ref(false)
    const updateLoading = ref(false)
    const deleteLoading = ref(false)
    
    // View modal state
    const activeViewTab = ref('adatok')
    const viewParentData = ref(null)
    
    // Form data
    const parentData = ref({
      nev: '',
      email: '',
      telefonszam: '',
      szemelyi_igazolvany_szam: '',
      lakcimData: {
        orszag: '',
        iranyitoszam: '',
        varos: '',
        utca_hazszam: ''
      }
    })
    
    const editParentData = ref({
      nev: '',
      email: '',
      telefonszam: '',
      szemelyi_igazolvany_szam: '',
      lakcimData: {
        orszag: '',
        iranyitoszam: '',
        varos: '',
        utca_hazszam: ''
      }
    })
    
    const deleteParentData = ref(null)
    const currentEditParentId = ref(null)

    const fetchParents = async () => {
      loading.value = true
      const { signal } = createAbortController()
      try {
        const response = await api.get('/parents', { signal })
        if (response.data.success) {
          parents.value.splice(0, parents.value.length, ...response.data.data)
        }
      } catch (error) {
        if (isAbortError(error)) {
          console.log('Request was aborted - component unmounted')
          return
        }
        console.error(getErrorMessage('LOAD_ERROR'), error)
        toast.error(getErrorMessage('LOAD_ERROR'))
      } finally {
        loading.value = false
      }
    }

    const filteredParents = computed(() => {
      let result = parents.value
      
      // Filter by search query (name or email)
      if (searchQuery.value) {
        const query = searchQuery.value.toLowerCase()
        result = result.filter(parent => 
          parent.nev.toLowerCase().includes(query) ||
          parent.email.toLowerCase().includes(query)
        )
      }
      
      // Filter by city
      if (selectedCity.value) {
        result = result.filter(parent => 
          parent.lakcim?.varos === selectedCity.value
        )
      }
      
      return result
    })

    const totalChildrenCount = computed(() => {
      return parents.value.reduce((total, parent) => {
        return total + (parent.diaks ? parent.diaks.length : 0)
      }, 0)
    })

    const uniqueCities = computed(() => {
      const cities = new Set()
      parents.value.forEach(parent => {
        if (parent.lakcim?.varos) {
          cities.add(parent.lakcim.varos)
        }
      })
      return Array.from(cities).sort()
    })

    // Modal methods - Create
    const closeCreateModal = () => {
      showCreateModal.value = false
      resetCreateForm()
    }

    const createParent = async () => {
      createLoading.value = true
      try {
        const response = await api.post('/parents', parentData.value)
        if (response.data.success) {
          toast.success(getSuccessMessage('CREATE_SUCCESS'))
          closeCreateModal()
          fetchParents()
        }
      } catch (error) {
        console.error(getErrorMessage('CREATE_ERROR'), error)
        toast.error(getErrorMessage('CREATE_ERROR'))
      } finally {
        createLoading.value = false
      }
    }

    // Modal methods - Edit
    const editParent = (parent) => {
      currentEditParentId.value = parent.szulo_id
      editParentData.value = {
        nev: parent.nev,
        email: parent.email,
        telefonszam: parent.telefonszam,
        szemelyi_igazolvany_szam: parent.szemelyi_igazolvany_szam,
        lakcimData: {
          orszag: parent.lakcim?.orszag || '',
          iranyitoszam: parent.lakcim?.iranyitoszam || '',
          varos: parent.lakcim?.varos || '',
          utca_hazszam: parent.lakcim?.utca_hazszam || ''
        }
      }
      showEditModal.value = true
    }

    const closeEditModal = () => {
      showEditModal.value = false
      currentEditParentId.value = null
    }

    const updateParent = async () => {
      updateLoading.value = true
      try {
        const response = await api.put(`/parents/${currentEditParentId.value}`, editParentData.value)
        if (response.data.success) {
          toast.success(getSuccessMessage('UPDATE_SUCCESS'))
          closeEditModal()
          fetchParents()
        }
      } catch (error) {
        console.error(getErrorMessage('UPDATE_ERROR'), error)
        toast.error(getErrorMessage('UPDATE_ERROR'))
      } finally {
        updateLoading.value = false
      }
    }

    // Modal methods - Delete
    const deleteParent = (parent) => {
      deleteParentData.value = parent
      showDeleteModal.value = true
    }

    const closeDeleteModal = () => {
      showDeleteModal.value = false
      deleteParentData.value = null
    }

    const confirmDeleteParent = async () => {
      if (!deleteParentData.value) return
      
      deleteLoading.value = true
      try {
        const response = await api.delete(`/parents/${deleteParentData.value.szulo_id}`)
        if (response.data.success) {
          toast.success(getSuccessMessage('DELETE_SUCCESS'))
          closeDeleteModal()
          fetchParents()
        } else {
          const errorMsg = response.data.error || response.data.message || getErrorMessage('UNKNOWN_ERROR')
          toast.error(errorMsg)
        }
      } catch (error) {
        console.error(getErrorMessage('DELETE_ERROR'), error)
        const errorMsg = error.response?.data?.error || error.response?.data?.message || getErrorMessage('DELETE_ERROR')
        toast.error(errorMsg)
      } finally {
        deleteLoading.value = false
      }
    }

    // Modal methods - View
    const viewParent = (parent) => {
      viewParentData.value = parent
      activeViewTab.value = 'adatok'
      showViewModal.value = true
    }

    const closeViewModal = () => {
      showViewModal.value = false
      viewParentData.value = null
    }

    const resetCreateForm = () => {
      parentData.value = {
        nev: '',
        email: '',
        telefonszam: '',
        szemelyi_igazolvany_szam: '',
        lakcimData: {
          orszag: '',
          iranyitoszam: '',
          varos: '',
          utca_hazszam: ''
        }
      }
    }

    // Debounced search function using composable
    const { debouncedFn: debouncedSearch } = useDebounce(async () => {
      if (searchQuery.value.trim()) {
        try {
          const response = await api.get('/parents', {
            params: { search: searchQuery.value }
          })
          if (response.data.success) {
            parents.value.splice(0, parents.value.length, ...response.data.data)
          }
        } catch (error) {
          console.error('Hiba a szülő keresése közben:', error)
        }
      } else {
        fetchParents()
      }
    }, 300)

    // Clear all filters
    const clearFilters = () => {
      searchQuery.value = ''
      selectedCity.value = ''
    }

    onMounted(() => {
      fetchParents()
    })

    return {
      // State
      parents,
      loading,
      searchQuery,
      selectedCity,
      // Modal visibility
      showCreateModal,
      showEditModal,
      showDeleteModal,
      showViewModal,
      // Modal loading
      createLoading,
      updateLoading,
      deleteLoading,
      // View modal
      activeViewTab,
      viewParentData,
      // Form data
      parentData,
      editParentData,
      deleteParentData,
      // Computed
      filteredParents,
      uniqueCities,
      totalChildrenCount,
      // Methods
      fetchParents,
      createParent,
      closeCreateModal,
      editParent,
      closeEditModal,
      updateParent,
      deleteParent,
      closeDeleteModal,
      confirmDeleteParent,
      viewParent,
      closeViewModal,
      debouncedSearch,
      clearFilters
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
