<template>
  <div class="card shadow-sm h-100">
    <div class="card-header border-0">
      <div class="d-flex justify-content-between align-items-center">
        <div>
          <h5 class="mb-0">{{ parent.nev }}</h5>
<small style="color: var(--text-muted)">{{ getRelationTypeLabel(parent.kapcsolat_tipusa) }}</small>
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
          @click="$emit('view', parent)"
          :disabled="loading"
        >
          <i class="bi bi-eye me-1"></i>Megtekintés
        </button>
        <div class="btn-group" role="group">
          <button 
            class="btn btn-outline-warning btn-sm" 
            @click="$emit('edit', parent)"
            :disabled="loading"
          >
            <i class="bi bi-pencil me-1"></i>Szerkesztés
          </button>
          <button 
            class="btn btn-outline-danger btn-sm" 
            @click="$emit('delete', parent)"
            :disabled="loading"
          >
            <i class="bi bi-trash me-1"></i>Törlés
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ParentCard',
  props: {
    parent: {
      type: Object,
      required: true
    },
    loading: {
      type: Boolean,
      default: false
    }
  },
  emits: ['view', 'edit', 'delete'],
  setup() {
    const getRelationTypeLabel = (type) => {
      const labels = {
        'anya': 'Anya',
        'apa': 'Apa',
        'gondviselo': 'Gondviselő'
      }
      return labels[type] || type
    }

    const formatDate = (dateString) => {
      if (!dateString) return '-'
      const date = new Date(dateString)
      return date.toLocaleDateString('hu-HU')
    }

    return {
      getRelationTypeLabel,
      formatDate
    }
  }
}
</script>

<style scoped>
.avatar {
  background: linear-gradient(135deg, var(--primary-500), var(--primary-600));
  color: white;
  font-size: 10px;
  font-weight: bold;
}
</style>
