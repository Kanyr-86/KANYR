<template>
  <BaseModal
    :show="show"
    title="Szülő törlése"
    @close="$emit('close')"
  >
    <p>Biztosan törölni szeretné a következő szülőt?</p>
    <p><strong>{{ parentData?.nev }}</strong></p>
    <p>
      <small>
        Figyelem: A szülő törlése csak akkor lehetséges, ha nincs hozzárendelve aktív diák.
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
  name: 'ParentDeleteModal',
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
    loading: {
      type: Boolean,
      default: false
    }
  },
  emits: ['close', 'confirm']
}
</script>
