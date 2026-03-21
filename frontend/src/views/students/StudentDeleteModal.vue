<template>
  <BaseModal
    v-model:show="show"
    title="Diák törlése"
    size="md"
    @close="$emit('close')"
  >
    <div v-if="student">
      <p>Biztosan törölni szeretné a következő diákot?</p>
      <p><strong v-text="student?.nev || 'N/A'"></strong></p>
      <p>
<small style="color: var(--text-muted)">
          Figyelem: A diák törlése csak akkor lehetséges, ha nincs hozzárendelve aktív szoba.
        </small>
      </p>
    </div>

    <template #footer>
      <button 
        type="button" 
        class="btn btn-secondary" 
        @click="$emit('close')"
        :disabled="loading"
      >
        Mégse
      </button>
      <button 
        type="button" 
        class="btn btn-danger" 
        @click="$emit('confirm')"
        :disabled="loading"
      >
        <span v-if="loading" class="spinner-border spinner-border-sm me-2" role="status"></span>
        {{ loading ? 'Törlés...' : 'Törlés' }}
      </button>
    </template>
  </BaseModal>
</template>

<script>
import BaseModal from '../../components/BaseModal.vue'

export default {
  name: 'StudentDeleteModal',
  components: { BaseModal },
  props: {
    show: { type: Boolean, default: false },
    student: { type: Object, default: null },
    loading: { type: Boolean, default: false }
  },
  emits: ['close', 'confirm']
}
</script>
