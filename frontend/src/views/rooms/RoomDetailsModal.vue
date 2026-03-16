<template>
  <BaseModal
    :show="show"
    :title="`Szoba részletei: ${roomData?.szoba_szama || ''}`"
    size="lg"
    @close="$emit('close')"
  >
    <div v-if="loading" class="text-center">
      <div class="spinner-border" role="status">
        <span class="visually-hidden">Betöltés...</span>
      </div>
    </div>
    <div v-else>
      <div class="row mb-3">
        <div class="col-md-6">
          <p><strong>Férőhely:</strong> {{ roomData?.osszes_hely }} fő</p>
        </div>
        <div class="col-md-6">
          <p><strong>Jelenlegi lakók:</strong> {{ roomData?.currentOccupancy || 0 }} fő</p>
        </div>
      </div>
      
      <h6 class="mb-3">Bent lakó diákok:</h6>
      <div v-if="roomData?.diakok && roomData.diakok.length > 0">
        <div class="table-responsive">
          <table class="table table-striped">
            <thead>
              <tr>
                <th>Név</th>
                <th>Email</th>
                <th>Telefon</th>
                <th>Beköltözés dátuma</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="student in roomData.diakok" :key="student.diak_id">
                <td v-text="student.nev"></td>
                <td v-text="student.email || '-'"></td>
                <td v-text="student.telefon || '-'"></td>
                <td>{{ formatDate(student.bekoltozes_datum) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      <div v-else class="alert alert-info">
        Nincs bent lakó ebben a szobában.
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
  name: 'RoomDetailsModal',
  components: {
    BaseModal
  },
  props: {
    show: {
      type: Boolean,
      required: true
    },
    roomData: {
      type: Object,
      default: null
    },
    loading: {
      type: Boolean,
      default: false
    }
  },
  emits: ['close'],
  setup() {
    const formatDate = (dateString) => {
      if (!dateString) return '-'
      const date = new Date(dateString)
      return date.toLocaleDateString('hu-HU', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    }

    return {
      formatDate
    }
  }
}
</script>
