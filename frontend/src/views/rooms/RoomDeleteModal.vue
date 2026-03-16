<template>
  <BaseModal
    :show="show"
    title="Szoba törlése"
    @close="$emit('close')"
  >
    <p>Biztosan törölni szeretné a következő szobát?</p>
    <p><strong>{{ roomData?.szoba_szama }}</strong></p>
    <p class="text-warning">
      <small>
        Figyelem: A szoba törlése csak akkor lehetséges, ha nincs benne aktív diák.
      </small>
    </p>
    
    <template #footer>
      <button type="button" class="btn btn-secondary" @click="$emit('close')">Mégse</button>
      <button type="button" class="btn btn-danger" :disabled="loading" @click="$emit('confirm')">
        {{ loading ? 'Törlés...' : 'Törlés' }}
      </button>
    </template>
  </BaseModal>
</template>

<script>
import { defineAsyncComponent } from 'vue'

const BaseModal = defineAsyncComponent(() => import('../../components/BaseModal.vue'))

export default {
  name: 'RoomDeleteModal',
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
  emits: ['close', 'confirm']
}
</script>
