<template>
  <BaseModal
    :show="show"
    :title="`Szülő adatai - ${parentData?.nev || ''}`"
    size="lg"
    @close="$emit('close')"
  >
    <!-- Tab navigation -->
    <ul class="nav nav-tabs mb-3">
      <li class="nav-item">
        <button 
          class="nav-link" 
          :class="{ active: activeTab === 'adatok' }"
          @click="$emit('update:activeTab', 'adatok')"
        >
          Adatok
        </button>
      </li>
      <li class="nav-item">
        <button 
          class="nav-link" 
          :class="{ active: activeTab === 'gyerekek' }"
          @click="$emit('update:activeTab', 'gyerekek')"
        >
          Gyerekek 
          <span v-if="parentData?.diaks?.length > 0" class="badge">
            {{ parentData.diaks.length }}
          </span>
        </button>
      </li>
    </ul>

    <!-- Adatok tab -->
    <div v-if="activeTab === 'adatok' && parentData">
      <div class="row">
        <div class="col-md-6">
          <h6 class="mb-3">Személyes adatok</h6>
          <div class="card mb-3">
            <div class="card-body">
              <div class="mb-2">
                <strong>Név:</strong>
                <span class="ms-2">{{ parentData.nev }}</span>
              </div>
              <div class="mb-2">
                <strong>Email:</strong>
                <span class="ms-2">{{ parentData.email }}</span>
              </div>
              <div class="mb-2">
                <strong>Telefonszám:</strong>
                <span class="ms-2">{{ parentData.telefonszam }}</span>
              </div>
              <div class="mb-2">
                <strong>Személyi igazolvány szám:</strong>
                <span class="ms-2">{{ parentData.szemelyi_igazolvany_szam }}</span>
              </div>
            </div>
          </div>
        </div>
        <div class="col-md-6">
          <h6 class="mb-3">Lakcím</h6>
          <div class="card">
            <div class="card-body">
              <div class="mb-2" v-if="parentData.lakcim">
                <strong>Ország:</strong>
                <span class="ms-2">{{ parentData.lakcim.orszag || '-' }}</span>
              </div>
              <div class="mb-2" v-if="parentData.lakcim">
                <strong>Irányítószám:</strong>
                <span class="ms-2">{{ parentData.lakcim.iranyitoszam || '-' }}</span>
              </div>
              <div class="mb-2" v-if="parentData.lakcim">
                <strong>Város:</strong>
                <span class="ms-2">{{ parentData.lakcim.varos || '-' }}</span>
              </div>
              <div class="mb-2" v-if="parentData.lakcim">
                <strong>Utca, házszám:</strong>
                <span class="ms-2">{{ parentData.lakcim.utca_hazszam || '-' }}</span>
              </div>
<div v-if="!parentData.lakcim" style="color: var(--text-muted)">
                Nincs megadva lakcím
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Gyerekek tab -->
    <div v-if="activeTab === 'gyerekek' && parentData">
      <div v-if="parentData.diaks && parentData.diaks.length > 0">
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
              <tr v-for="diak in parentData.diaks" :key="diak.diak_id">
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
    
    <template #footer>
      <button type="button" class="btn btn-secondary" @click="$emit('close')">Bezárás</button>
    </template>
  </BaseModal>
</template>

<script>
import { defineAsyncComponent } from 'vue'

const BaseModal = defineAsyncComponent(() => import('../../components/BaseModal.vue'))

export default {
  name: 'ParentViewModal',
  components: {
    BaseModal
  },
  props: {
    show: {
      type: Boolean,
      required: true
    },
    parentData: {
      type: Object,
      default: null
    },
    activeTab: {
      type: String,
      default: 'adatok'
    }
  },
  emits: ['close', 'update:activeTab'],
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
