<template>
  <BaseModal
    :show="show"
    title="Szoba szerkesztése"
    @close="$emit('close')"
  >
    <form @submit.prevent="$emit('submit')">
      <div class="mb-3">
        <BaseInput
          v-model="formData.szoba_szama"
          label="Szobaszám"
          required
        />
      </div>
      <div class="mb-3">
        <BaseInput
          v-model="formData.osszes_hely"
          label="Férőhely"
          type="number"
          min="1"
          max="10"
          required
        />
      </div>
    </form>
    
    <template #footer>
      <button type="button" class="btn btn-secondary" @click="$emit('close')">Mégse</button>
      <button type="button" class="btn btn-primary" :disabled="loading" @click="$emit('submit')">
        {{ loading ? 'Mentés...' : 'Mentés' }}
      </button>
    </template>
  </BaseModal>
</template>

<script>
import { defineAsyncComponent } from 'vue'

const BaseModal = defineAsyncComponent(() => import('../../components/BaseModal.vue'))
const BaseInput = defineAsyncComponent(() => import('../../components/forms/BaseInput.vue'))

export default {
  name: 'RoomEditModal',
  components: {
    BaseModal,
    BaseInput
  },
  props: {
    show: {
      type: Boolean,
      required: true
    },
    formData: {
      type: Object,
      required: true
    },
    loading: {
      type: Boolean,
      default: false
    }
  },
  emits: ['close', 'submit']
}
</script>
