  <template>
  <div class="container-fluid">
    <!-- Loading Overlay -->
    <LoadingOverlay :show="loading" message="Szülők betöltése..." />
    
    <div class="row">
      <div class="col-12">
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
                      placeholder="Név vagy email alapján..."
                      type="text"
                      @input="debouncedSearch"
                      :disabled="loading"
                    />
                  </div>
                  <div class="col-12 col-md-4">
                    <label class="form-label fw-semibold">Város</label>
                    <select class="form-select" v-model="selectedCity" :disabled="loading">
                      <option value="">Összes város</option>
                      <option v-for="city in uniqueCities" :key="city" :value="city">
                        {{ city }}
                      </option>
                    </select>
                  </div>
                  <div class="col-12 col-md-2 d-flex align-items-end">
                    <button 
                      class="btn btn-outline-secondary w-100" 
                      @click="clearFilters"
                      :disabled="loading"
                    >
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
                    <h6 class="card-title mb-1">Összes szülő</h6>
                    <h3 class="mb-0">
                      <template v-if="loading">
                        <span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                      </template>
                      <template v-else>{{ parents.length }}</template>
                    </h3>
                  </div>
                </div>
              </div>
              <div class="col-6">
                <div class="card">
                  <div class="card-body text-center">
                    <h6 class="card-title mb-1">Összes gyerek</h6>
                    <h3 class="mb-0">
                      <template v-if="loading">
                        <span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                      </template>
                      <template v-else>{{ totalChildrenCount }}</template>
                    </h3>
                  </div>
                </div>
              </div>
            </div>
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
        
        <!-- Szülők kártyák -->
        <div v-else class="row">
          <div class="col-md-6 col-lg-4" v-for="parent in filteredParents" :key="parent.szulo_id">
            <div class="card shadow-sm h-100">
              <div class="card-header border-0">
                <div class="d-flex justify-content-between align-items-center">
                  <div>
                    <h5 class="mb-0">{{ parent.nev }}</h5>
                    <small class="text-muted">{{ getRelationTypeLabel(parent.kapcsolat_tipusa) }}</small>
                  </div>
                  <div>
                    <span class="badge">
                      {{ parent.diaks ? parent.diaks.length : 0 }} gyerek
                    </span>
                  </div>
                </div>
              </div>
              <div class="card-body">
                <div class="row mb-3">
                  <div class="col-6">
                    <div class="d-flex align-items-center">
                      <i class="bi bi-envelope-fill me-2"></i>
                      <div>
                        <div class="fw-semibold">{{ parent.email }}</div>
                        <small class="text-muted">Email</small>
                      </div>
                    </div>
                  </div>
                  <div class="col-6">
                    <div class="d-flex align-items-center">
                      <i class="bi bi-telephone-fill me-2"></i>
                      <div>
                        <div class="fw-semibold">{{ parent.telefonszam }}</div>
                        <small class="text-muted">Telefon</small>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div class="mb-3">
                  <div class="d-flex align-items-start">
                    <i class="bi bi-geo-alt-fill me-2 mt-1"></i>
                    <div>
                      <div class="fw-semibold">
                        {{ parent.lakcim ? `${parent.lakcim.varos}, ${parent.lakcim.utca_hazszam}` : 'Nincs megadva' }}
                      </div>
                      <small class="text-muted">Lakcím</small>
                    </div>
                  </div>
                </div>
                
                <div v-if="parent.diaks && parent.diaks.length > 0">
                  <h6 class="mb-2">Gyerekek:</h6>
                  <div class="list-group list-group-flush">
                    <div class="list-group-item d-flex justify-content-between align-items-center" 
                         v-for="diak in parent.diaks" :key="diak.diak_id">
                      <div class="d-flex align-items-center">
                        <div class="avatar rounded-circle d-flex align-items-center justify-content-center me-2" style="width: 24px; height: 24px;">
                          {{ diak.nev.charAt(0).toUpperCase() }}
                        </div>
                        <div>
                          <div class="fw-semibold">{{ diak.nev }}</div>
                          <small class="text-muted">{{ formatDate(diak.szuletesi_datum) }}</small>
                        </div>
                      </div>
                      <span class="badge">
                        {{ getRelationTypeLabel(diak.kapcsolat_tipusa) }}
                      </span>
                    </div>
                  </div>
                </div>
                <div v-else>
                  <div class="alert alert-light border text-center mb-0">
                    <i class="bi bi-emoji-frown me-2"></i>
                    <span>Nincs hozzárendelve gyerek</span>
                  </div>
                </div>
              </div>
              <div class="card-footer border-0">
                <div class="d-flex justify-content-between">
                  <button 
                    class="btn btn-outline-primary btn-sm" 
                    @click="viewParent(parent)"
                    :disabled="loading"
                  >
                    <i class="bi bi-eye me-1"></i>Megtekintés
                  </button>
                  <div class="btn-group" role="group">
                    <button 
                      class="btn btn-outline-warning btn-sm" 
                      @click="editParent(parent)"
                      :disabled="loading"
                    >
                      <i class="bi bi-pencil me-1"></i>Szerkesztés
                    </button>
                    <button 
                      class="btn btn-outline-danger btn-sm" 
                      @click="deleteParent(parent)"
                      :disabled="loading"
                    >
                      <i class="bi bi-trash me-1"></i>Törlés
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Szülő felvétel modal -->
    <div class="modal fade show" tabindex="-1" v-if="showCreateModal" style="display: block;">
      <div class="modal-dialog modal-lg">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Szülő felvétele</h5>
            <button type="button" class="btn-close" @click="showCreateModal = false"></button>
          </div>
          <div class="modal-body">
            <form @submit.prevent="createParent">
              <div class="row">
                <div class="col-md-6">
                  <h6>Szülő adatai</h6>
                  <div class="mb-3">
                    <label class="form-label">Név</label>
                    <BaseInput
                      v-model="parentData.nev"
                      label="Név"
                      required
                    />
                  </div>
                  <div class="mb-3">
                    <label class="form-label">Email</label>
                    <BaseInput
                      v-model="parentData.email"
                      label="Email"
                      type="email"
                      required
                    />
                  </div>
                  <div class="mb-3">
                    <label class="form-label">Telefonszám</label>
                    <BaseInput
                      v-model="parentData.telefonszam"
                      label="Telefonszám"
                      type="tel"
                      required
                    />
                  </div>
                  <div class="mb-3">
                    <BaseInput
                      v-model="parentData.szemelyi_igazolvany_szam"
                      label="Személyi igazolvány szám"
                      required
                    />
                  </div>
                </div>
                <div class="col-md-6">
                  <h6>Lakcím adatai</h6>
                  <div class="mb-3">
                    <BaseInput
                      v-model="parentData.lakcimData.orszag"
                      label="Ország"
                      required
                    />
                  </div>
                  <div class="mb-3">
                    <BaseInput
                      v-model="parentData.lakcimData.iranyitoszam"
                      label="Irányítószám"
                      required
                    />
                  </div>
                  <div class="mb-3">
                    <BaseInput
                      v-model="parentData.lakcimData.varos"
                      label="Város"
                      required
                    />
                  </div>
                  <div class="mb-3">
                    <BaseInput
                      v-model="parentData.lakcimData.utca_hazszam"
                      label="Utca, házszám"
                      required
                    />
                  </div>
                </div>
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
    
    <!-- Szülő szerkesztés modal -->
    <div class="modal fade show" tabindex="-1" v-if="showEditModal" style="display: block;">
      <div class="modal-dialog modal-lg">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Szülő szerkesztése</h5>
            <button type="button" class="btn-close" @click="showEditModal = false"></button>
          </div>
          <div class="modal-body">
            <form @submit.prevent="updateParent">
              <div class="row">
                <div class="col-md-6">
                  <h6>Szülő adatai</h6>
                  <div class="mb-3">
                    <BaseInput
                      v-model="editParentData.nev"
                      label="Név"
                      required
                    />
                  </div>
                  <div class="mb-3">
                    <BaseInput
                      v-model="editParentData.email"
                      label="Email"
                      type="email"
                      required
                    />
                  </div>
                  <div class="mb-3">
                    <BaseInput
                      v-model="editParentData.telefonszam"
                      label="Telefonszám"
                      type="tel"
                      required
                    />
                  </div>
                  <div class="mb-3">
                    <BaseInput
                      v-model="editParentData.szemelyi_igazolvany_szam"
                      label="Személyi igazolvány szám"
                      required
                    />
                  </div>
                </div>
                <div class="col-md-6">
                  <h6>Lakcím adatai</h6>
                  <div class="mb-3">
                    <BaseInput
                      v-model="editParentData.lakcimData.orszag"
                      label="Ország"
                      required
                    />
                  </div>
                  <div class="mb-3">
                    <BaseInput
                      v-model="editParentData.lakcimData.iranyitoszam"
                      label="Irányítószám"
                      required
                    />
                  </div>
                  <div class="mb-3">
                    <BaseInput
                      v-model="editParentData.lakcimData.varos"
                      label="Város"
                      required
                    />
                  </div>
                  <div class="mb-3">
                    <BaseInput
                      v-model="editParentData.lakcimData.utca_hazszam"
                      label="Utca, házszám"
                      required
                    />
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
    <div class="modal fade show" tabindex="-1" v-if="showDeleteModal" style="display: block;">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Szülő törlése</h5>
            <button type="button" class="btn-close" @click="showDeleteModal = false"></button>
          </div>
          <div class="modal-body">
            <p>Biztosan törölni szeretné a következő szülőt?</p>
            <p><strong>{{ deleteParentData?.nev }}</strong></p>
            <p>
              <small>
                Figyelem: A szülő törlése csak akkor lehetséges, ha nincs hozzárendelve aktív diák.
              </small>
            </p>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" @click="showDeleteModal = false">Mégse</button>
            <button type="button" class="btn btn-danger" @click="confirmDeleteParent" :disabled="deleteLoading">
              {{ deleteLoading ? 'Törlés...' : 'Törlés' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Megtekintés modal -->
    <div class="modal fade show" tabindex="-1" v-if="showViewModal" style="display: block;">
      <div class="modal-dialog modal-lg">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Szülő adatai - {{ viewParentData?.nev }}</h5>
            <button type="button" class="btn-close" @click="closeViewModal"></button>
          </div>
          <div class="modal-body">
            <!-- Tab navigáció -->
            <ul class="nav nav-tabs mb-3">
              <li class="nav-item">
                <button 
                  class="nav-link" 
                  :class="{ active: activeViewTab === 'adatok' }"
                  @click="activeViewTab = 'adatok'"
                >
                  Adatok
                </button>
              </li>
              <li class="nav-item">
                <button 
                  class="nav-link" 
                  :class="{ active: activeViewTab === 'gyerekek' }"
                  @click="activeViewTab = 'gyerekek'"
                >
                  Gyerekek 
                  <span v-if="viewParentData?.diaks?.length > 0" class="badge">
                    {{ viewParentData.diaks.length }}
                  </span>
                </button>
              </li>
            </ul>

            <!-- Adatok tab -->
            <div v-if="activeViewTab === 'adatok' && viewParentData">
              <div class="row">
                <div class="col-md-6">
                  <h6 class="mb-3">Személyes adatok</h6>
                  <div class="card mb-3">
                    <div class="card-body">
                      <div class="mb-2">
                        <strong>Név:</strong>
                        <span class="ms-2">{{ viewParentData.nev }}</span>
                      </div>
                      <div class="mb-2">
                        <strong>Email:</strong>
                        <span class="ms-2">{{ viewParentData.email }}</span>
                      </div>
                      <div class="mb-2">
                        <strong>Telefonszám:</strong>
                        <span class="ms-2">{{ viewParentData.telefonszam }}</span>
                      </div>
                      <div class="mb-2">
                        <strong>Személyi igazolvány szám:</strong>
                        <span class="ms-2">{{ viewParentData.szemelyi_igazolvany_szam }}</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div class="col-md-6">
                  <h6 class="mb-3">Lakcím</h6>
                  <div class="card">
                    <div class="card-body">
                      <div class="mb-2" v-if="viewParentData.lakcim">
                        <strong>Ország:</strong>
                        <span class="ms-2">{{ viewParentData.lakcim.orszag || '-' }}</span>
                      </div>
                      <div class="mb-2" v-if="viewParentData.lakcim">
                        <strong>Irányítószám:</strong>
                        <span class="ms-2">{{ viewParentData.lakcim.iranyitoszam || '-' }}</span>
                      </div>
                      <div class="mb-2" v-if="viewParentData.lakcim">
                        <strong>Város:</strong>
                        <span class="ms-2">{{ viewParentData.lakcim.varos || '-' }}</span>
                      </div>
                      <div class="mb-2" v-if="viewParentData.lakcim">
                        <strong>Utca, házszám:</strong>
                        <span class="ms-2">{{ viewParentData.lakcim.utca_hazszam || '-' }}</span>
                      </div>
                      <div v-if="!viewParentData.lakcim" class="text-muted">
                        Nincs megadva lakcím
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Gyerekek tab -->
            <div v-if="activeViewTab === 'gyerekek' && viewParentData">
              <div v-if="viewParentData.diaks && viewParentData.diaks.length > 0">
                <div class="table-responsive">
                  <table class="table table-striped table-hover">
                    <thead>
                      <tr>
                        <th>Név</th>
                        <th>Email</th>
                        <th>Születési dátum</th>
                        <th>Kapcsolat típusa</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="diak in viewParentData.diaks" :key="diak.diak_id">
                        <td>{{ diak.nev }}</td>
                        <td>{{ diak.email }}</td>
                        <td>{{ formatDate(diak.szuletesi_datum) }}</td>
                        <td>
                          <span class="badge">{{ getRelationTypeLabel(diak.kapcsolat_tipusa) }}</span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
              <div v-else class="text-center py-4">
                <div class="text-muted">
                  <i class="bi bi-people fs-1"></i>
                  <p class="mt-2">Ehhez a szülőhöz még nem tartozik gyerek.</p>
                </div>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" @click="closeViewModal">Bezárás</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, computed, watch, defineAsyncComponent } from 'vue'
import { useAuthStore } from '../store/auth'
import api from '../services/api'
import { useDebounce } from '../composables/useDebounce'
import { toast } from 'vue3-toastify'
import { getSuccessMessage, getErrorMessage } from '@/i18n'
import { useApiCancel } from '../composables/useApiCancel'

// Lazy load heavy components
const BaseInput = defineAsyncComponent(() => import('../components/forms/BaseInput.vue'))
const LoadingOverlay = defineAsyncComponent(() => import('../components/LoadingOverlay.vue'))

export default {
  name: 'ParentsView',
  components: {
    LoadingOverlay,
    BaseInput
  },
  setup() {
    // API request cancellation
    const { createAbortController, isAbortError } = useApiCancel()
    
    const parents = ref([])
    const loading = ref(false)
    const searchQuery = ref('')
    const selectedCity = ref('')
    const showCreateModal = ref(false)
    const showEditModal = ref(false)
    const showDeleteModal = ref(false)
    const showViewModal = ref(false)
    const createLoading = ref(false)
    const updateLoading = ref(false)
    const deleteLoading = ref(false)
    const activeViewTab = ref('adatok')
    
    const viewParentData = ref(null)
    
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
    
    const authStore = useAuthStore()

    const fetchParents = async () => {
      loading.value = true
      const { signal } = createAbortController()
      try {
        const response = await api.get('/szulos', { signal })
        if (response.data.success) {
          parents.value = response.data.data
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

    const getRelationTypeLabel = (type) => {
      const labels = {
        'anya': 'Anya',
        'apa': 'Apa',
        'gondviselo': 'Gondviselő'
      }
      return labels[type] || type
    }

    const createParent = async () => {
      createLoading.value = true
      try {
        const response = await api.post('/szulos', parentData.value)
        if (response.data.success) {
          showCreateModal.value = false
          resetCreateForm()
          fetchParents()
          toast.success(getSuccessMessage('CREATE_SUCCESS'))
        }
      } catch (error) {
        console.error(getErrorMessage('CREATE_ERROR'), error)
        toast.error(getErrorMessage('CREATE_ERROR'))
      } finally {
        createLoading.value = false
      }
    }

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

    const updateParent = async () => {
      updateLoading.value = true
      try {
        const response = await api.put(`/szulos/${currentEditParentId.value}`, editParentData.value)
        if (response.data.success) {
          showEditModal.value = false
          fetchParents()
          toast.success(getSuccessMessage('UPDATE_SUCCESS'))
        }
      } catch (error) {
        console.error(getErrorMessage('UPDATE_ERROR'), error)
        toast.error(getErrorMessage('UPDATE_ERROR'))
      } finally {
        updateLoading.value = false
      }
    }

    const deleteParent = (parent) => {
      deleteParentData.value = parent
      showDeleteModal.value = true
    }

    const viewParent = (parent) => {
      viewParentData.value = parent
      activeViewTab.value = 'adatok'
      showViewModal.value = true
    }

    const closeViewModal = () => {
      showViewModal.value = false
      viewParentData.value = null
    }

    const formatDate = (dateString) => {
      if (!dateString) return '-'
      const date = new Date(dateString)
      return date.toLocaleDateString('hu-HU')
    }

    const confirmDeleteParent = async () => {
      deleteLoading.value = true
      try {
        const response = await api.delete(`/szulos/${deleteParentData.value.szulo_id}`)
        if (response.data.success) {
          showDeleteModal.value = false
          fetchParents()
          toast.success(getSuccessMessage('DELETE_SUCCESS'))
        } else {
          // Hiba a válaszban
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
          const response = await api.get('/szulos', {
            params: {
              search: searchQuery.value
            }
          })
          if (response.data.success) {
            parents.value = response.data.data
          }
        } catch (error) {
          console.error('Hiba a szülő keresése közben:', error)
        }
      } else {
        // If search is empty, fetch all parents
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
      parents,
      loading,
      searchQuery,
      selectedCity,
      showCreateModal,
      showEditModal,
      showDeleteModal,
      showViewModal,
      createLoading,
      updateLoading,
      deleteLoading,
      activeViewTab,
      parentData,
      editParentData,
      deleteParentData,
      viewParentData,
      filteredParents,
      uniqueCities,
      fetchParents,
      createParent,
      editParent,
      updateParent,
      deleteParent,
      confirmDeleteParent,
      viewParent,
      closeViewModal,
      formatDate,
      resetCreateForm,
      debouncedSearch,
      getRelationTypeLabel,
      clearFilters
    }
  }
}
</script>
