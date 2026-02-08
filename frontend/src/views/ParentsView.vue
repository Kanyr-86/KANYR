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
                      <span class="badge bg-info">{{ parent.diakok ? parent.diakok.length : 0 }}</span>
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
    <div class="modal fade" tabindex="-1" v-if="showCreateModal">
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
    <div class="modal fade" tabindex="-1" v-if="showEditModal">
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
    <div class="modal fade" tabindex="-1" v-if="showDeleteModal">
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
    const createLoading = ref(false)
    const updateLoading = ref(false)
    const deleteLoading = ref(false)
    
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
        const response = await api.get('/szulo')
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
          parent.diakok?.some(d => d.kapcsolat_tipusa === selectedRelationType.value)
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
        const response = await api.post('/szulo', parentData.value)
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
        const response = await api.put(`/szulo/${currentEditParentId.value}`, editParentData.value)
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

    const confirmDeleteParent = async () => {
      deleteLoading.value = true
      try {
        const response = await api.delete(`/szulo/${deleteParentData.value.szulo_id}`)
        if (response.data.success) {
          showDeleteModal.value = false
          fetchParents()
          toast.success('Szülő sikeresen törölve')
        }
      } catch (error) {
        console.error('Hiba a szülő törlése közben:', error)
        toast.error('Hiba történt a szülő törlése közben')
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
          const response = await api.get('/szulo', {
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
      createLoading,
      updateLoading,
      deleteLoading,
      parentData,
      editParentData,
      deleteParentData,
      filteredParents,
      uniqueCities,
      fetchParents,
      createParent,
      editParent,
      updateParent,
      deleteParent,
      confirmDeleteParent,
      resetCreateForm,
      debouncedSearch,
      getRelationTypeLabel,
      clearFilters
    }
  }
}
</script>