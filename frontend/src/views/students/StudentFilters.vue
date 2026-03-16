<template>
  <div class="card">
    <div class="card-body">
      <div class="row g-3">
        <div class="col-12 col-md-6">
          <BaseInput
            v-model="localSearchQuery"
            label="Keresés"
            placeholder="Név, email vagy szoba alapján..."
            type="text"
            :disabled="loading"
          />
        </div>
        <div class="col-12 col-md-4">
          <label class="form-label fw-semibold">Státusz</label>
          <select class="form-select" v-model="localSelectedStatus" :disabled="loading">
            <option value="">Összes státusz</option>
            <option value="true">Aktív</option>
            <option value="false">Inaktív</option>
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
</template>

<script>
import { computed } from 'vue'
import BaseInput from '../../components/forms/BaseInput.vue'

export default {
  name: 'StudentFilters',
  components: { BaseInput },
  props: {
    searchQuery: { type: String, default: '' },
    selectedStatus: { type: String, default: '' },
    loading: { type: Boolean, default: false }
  },
  emits: ['update:searchQuery', 'update:selectedStatus', 'clear'],
  setup(props, { emit }) {
    const localSearchQuery = computed({
      get: () => props.searchQuery,
      set: (val) => emit('update:searchQuery', val)
    })
    
    const localSelectedStatus = computed({
      get: () => props.selectedStatus,
      set: (val) => emit('update:selectedStatus', val)
    })
    
    const clearFilters = () => emit('clear')
    
    return { localSearchQuery, localSelectedStatus, clearFilters }
  }
}
</script>
