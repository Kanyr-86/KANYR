<template>
  <div class="container-fluid">
    <div class="row">
      <div class="col-12">
        <div class="d-flex justify-content-between align-items-center mb-3">
          <h2>Szülők kezelése</h2>
          <button class="btn btn-primary" @click="showCreateModal = true">
            Szülő felvétele
          </button>
        </div>
        
        <div class="card">
          <div class="card-body">
            <div class="row mb-3">
              <div class="col-md-4">
                <input 
                  type="text" 
                  class="form-control" 
                  placeholder="Szülő keresése név vagy email alapján..."
                  v-model="searchQuery"
                  @input="debouncedSearch"
                >
              </div>
              <div class="col-md-3">
                <select class="form-select" v-model="selectedRelationType">
                  <option value="">Összes kapcsolat típus</option>
                  <option value="anya">Anya</option>
                  <option value="apa">Apa</option>
                  <option value="gondviselo">Gondviselő</option>
                </select>
              </div>
              <div class="col-md-3">
                <select class="form-select" v-model="selectedCity">
                  <option value="">Összes város</option>
                  <option v-for="city in uniqueCities" :key="city" :value="city">
                    {{ city }}
                  </option>
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
                    <th>Kapcsolat típusa</th>
                    <th>Lakcím</th>
                    <th>Diákok</th>
                    <th>Műveletek</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="parent in filteredParents" :key="parent.szulo_id">
                    <td>{{ parent.nev }}</td>
                    <td>{{ parent.email }}</td>
                    <td>{{ parent.telefonszam }}</td>
                    <td>
                      <span class="badge bg-primary">{{ getRelationTypeLabel(parent.kapcsolat_tipusa) }}</span>
                    </td>
                    <td>{{ parent.lakcim ? `${parent.lakcim.varos}, ${parent.lakcim.utca_hazszam}` : 'Nincs megadva' }}</td>
                    <td>
                      <span class="badge bg-info">{{ parent.diaks ? parent.diaks.length : 0 }}</span>
                    </td>
                    <td>
                      <button class="btn btn-sm btn-outline-primary me-2" @click="viewParent(parent)">
                        Megtekintés
                      </button>
                      <button class="btn btn-sm btn-outline-warning me-2" @click="editParent(parent)">
                        Szerkesztés
                      </button>
                      <button class="btn btn-sm btn-outline-danger" @click="deleteParent(parent)">
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
                    <input type="text" class="form-control" v-model="parentData.nev" required>
                  </div>
                  <div class="mb-3">
                    <label class="form-label">Email</label>
                    <input type="email" class="form-control" v-model="parentData.email" required>
                  </div>
                  <div class="mb-3">
                    <label class="form-label">Telefonszám</label>
                    <input type="tel" class="form-control" v-model="parentData.telefonszam" required>
                  </div>
                  <div class="mb-3">
                    <label class="form-label">Személyi igazolvány szám</label>
                    <input type="text" class="form-control" v-model="parentData.szemelyi_igazolvany_szam" required>
                  </div>
                </div>
                <div class="col-md-6">
                  <h6>Lakcím adatai</h6>
                  <div class="mb-3">
                    <label class="form-label">Ország</label>
                    <input type="text" class="form-control" v-model="parentData.lakcimData.orszag" required>
                  </div>
                  <div class="mb-3">
                    <label class="form-label">Irányítószám</label>
                    <input type="text" class="form-control" v-model="parentData.lakcimData.iranyitoszam" required>
                  </div>
                  <div class="mb-3">
                    <label class="form-label">Város</label>
                    <input type="text" class="form-control" v-model="parentData.lakcimData.varos" required>
                  </div>
                  <div class="mb-3">
                    <label class="form-label">Utca, házszám</label>
                    <input type="text" class="form-control" v-model="parentData.lakcimData.utca_hazszam" required>
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
                    <label class="form-label">Név</label>
                    <input type="text" class="form-control" v-model="editParentData.nev" required>
                  </div>
                  <div class="mb-3">
                    <label class="form-label">Email</label>
                    <input type="email" class="form-control" v-model="editParentData.email" required>
                  </div>
                  <div class="mb-3">
                    <label class="form-label">Telefonszám</label>
                    <input type="tel" class="form-control" v-model="editParentData.telefonszam" required>
                  </div>
                  <div class="mb-3">
                    <label class="form-label">Személyi igazolvány szám</label>
                    <input type="text" class="form-control" v-model="editParentData.szemelyi_igazolvany_szam" required>
                  </div>
                </div>
                <div class="col-md-6">
                  <h6>Lakcím adatai</h6>
                  <div class="mb-3">
                    <label class="form-label">Ország</label>
                    <input type="text" class="form-control" v-model="editParentData.lakcimData.orszag" required>
                  </div>
                  <div class="mb-3">
                    <label class="form-label">Irányítószám</label>
                    <input type="text" class="form-control" v-model="editParentData.lakcimData.iranyitoszam" required>
                  </div>
                  <div class="mb-3">
                    <label class="form-label">Város</label>
                    <input type="text" class="form-control" v-model="editParentData.lakcimData.varos" required>
                  </div>
                  <div class="mb-3">
                    <label class="form-label">Utca, házszám</label>
                    <input type="text" class="form-control" v-model="editParentData.lakcimData.utca_hazszam" required>
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
            <p class="text-warning">
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
                  <span v-if="viewParentData?.diaks?.length > 0" class="badge bg-secondary">
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
                          <span class="badge bg-primary">{{ getRelationTypeLabel(diak.kapcsolat_tipusa) }}</span>
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
import { ref, onMounted, computed, watch } from 'vue'
import { useAuthStore } from '../store/auth'
import api from '../services/api'
import { debounce } from 'lodash-es'
import { toast } from 'vue3-toastify'

export default {
  name: 'ParentsView',
  setup() {
    const parents = ref([])
    const loading = ref(false)
    const searchQuery = ref('')
    const selectedRelationType = ref('')
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
      try {
        const response = await api.get('/szulos')
        if (response.data.success) {
          parents.value = response.data.data
        }
      } catch (error) {
        console.error('Hiba a szülők lekérése közben:', error)
        toast.error('Hiba történt a szülők betöltése közben')
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
      
      // Filter by relation type
      if (selectedRelationType.value) {
        result = result.filter(parent => 
          parent.diaks?.some(d => d.kapcsolat_tipusa === selectedRelationType.value)
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
          toast.success('Szülő sikeresen felvéve')
        }
      } catch (error) {
        console.error('Hiba a szülő felvétele közben:', error)
        toast.error('Hiba történt a szülő felvétele közben')
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
          toast.success('Szülő adatai sikeresen módosítva')
        }
      } catch (error) {
        console.error('Hiba a szülő módosítása közben:', error)
        toast.error('Hiba történt a szülő módosítása közben')
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
          toast.success('Szülő sikeresen törölve')
        } else {
          // Hiba a válaszban
          const errorMsg = response.data.error || response.data.message || 'Ismeretlen hiba történt'
          toast.error(errorMsg)
        }
      } catch (error) {
        console.error('Hiba a szülő törlése közben:', error)
        const errorMsg = error.response?.data?.error || error.response?.data?.message || 'Hiba történt a szülő törlése közben'
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

    // Debounced search function
    const debouncedSearch = debounce(async () => {
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
      selectedRelationType.value = ''
      selectedCity.value = ''
    }

    onMounted(() => {
      fetchParents()
    })

    return {
      parents,
      loading,
      searchQuery,
      selectedRelationType,
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