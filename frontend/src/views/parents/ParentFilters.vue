<template>
  <div class="card">
    <div class="card-body">
      <div class="row g-3">
        <div class="col-12 col-md-6">
          <BaseInput
            v-model="localSearchQuery"
            label="Keresés"
            placeholder="Név vagy email alapján..."
            type="text"
            @input="$emit('search')"
            :disabled="loading"
          />
        </div>
        <div class="col-12 col-md-4">
          <label class="form-label fw-semibold">Város</label>
          <select class="form-select" v-model="localSelectedCity" :disabled="loading">
            <option value="">Összes város</option>
            <option v-for="city in cities" :key="city" :value="city">
              {{ city }}
            </option>
          </select>
        </div>
        <div class="col-12 col-md-2 d-flex align-items-end">
          <button 
            class="btn btn-outline-secondary w-100" 
            @click="$emit('clear')"
            :disabled="loading"
          >
            <i class="bi bi-x-circle me-2"></i>Törlés
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { defineAsyncComponent, computed } from 'vue'

const BaseInput = defineAsyncComponent(() => import('../../components/forms/BaseInput.vue'))

export default {
  name: 'ParentFilters',
  components: {
    BaseInput
  },
  props: {
    searchQuery: {
      type: String,
      default: ''
    },
    selectedCity: {
      type: String,
      default: ''
    },
    cities: {
      type: Array,
      default: () => []
    },
    loading: {
      type: Boolean,
      default: false
    }
  },
  emits: ['update:searchQuery', 'update:selectedCity', 'search', 'clear'],
  setup(props, { emit }) {
    const localSearchQuery = computed({
      get: () => props.searchQuery,
      set: (value) => emit('update:searchQuery', value)
    })

    const localSelectedCity = computed({
      get: () => props.selectedCity,
      set: (value) => emit('update:selectedCity', value)
    })

    return {
      localSearchQuery,
      localSelectedCity
    }
  }
}
</script>
