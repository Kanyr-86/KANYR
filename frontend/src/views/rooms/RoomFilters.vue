<template>
  <div class="card">
    <div class="card-body">
      <div class="row g-3">
        <div class="col-12 col-md-4">
          <BaseInput
            v-model="localSearchQuery"
            label="Keresés"
            placeholder="Szobaszám alapján..."
            type="text"
            @input="onSearchInput"
            :disabled="loading"
          />
        </div>
        <div class="col-12 col-md-3">
          <label class="form-label fw-semibold">Férőhely</label>
          <select class="form-select" v-model="localSelectedCapacity" :disabled="loading">
            <option value="">Összes férőhely</option>
            <option value="1">1 fő</option>
            <option value="2">2 fő</option>
            <option value="3">3 fő</option>
            <option value="4">4 fő</option>
          </select>
        </div>
        <div class="col-12 col-md-3">
          <label class="form-label fw-semibold">Státusz</label>
          <select class="form-select" v-model="localSelectedStatus" :disabled="loading">
            <option value="">Összes státusz</option>
            <option value="empty">Üres</option>
            <option value="available">Van szabad hely</option>
            <option value="full">Tele</option>
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
  name: 'RoomFilters',
  components: { BaseInput },
  props: {
    searchQuery: { type: String, default: '' },
    selectedCapacity: { type: String, default: '' },
    selectedStatus: { type: String, default: '' },
    loading: { type: Boolean, default: false }
  },
  emits: ['update:searchQuery', 'update:selectedCapacity', 'update:selectedStatus', 'search', 'clear'],
  setup(props, { emit }) {
    const localSearchQuery = computed({
      get: () => props.searchQuery,
      set: (val) => emit('update:searchQuery', val)
    })
    
    const localSelectedCapacity = computed({
      get: () => props.selectedCapacity,
      set: (val) => emit('update:selectedCapacity', val)
    })
    
    const localSelectedStatus = computed({
      get: () => props.selectedStatus,
      set: (val) => emit('update:selectedStatus', val)
    })
    
    const onSearchInput = () => emit('search')
    const clearFilters = () => emit('clear')
    
    return { localSearchQuery, localSelectedCapacity, localSelectedStatus, onSearchInput, clearFilters }
  }
}
</script>
