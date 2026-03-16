<template>
  <BaseModal
    :show="show"
    title="Szülő szerkesztése"
    size="lg"
    @close="$emit('close')"
  >
    <form @submit.prevent="$emit('submit')">
      <div class="row">
        <div class="col-md-6">
          <h6>Szülő adatai</h6>
          <div class="mb-3">
            <BaseInput
              v-model="formData.nev"
              label="Név"
              required
            />
          </div>
          <div class="mb-3">
            <BaseInput
              v-model="formData.email"
              label="Email"
              type="email"
              required
            />
          </div>
          <div class="mb-3">
            <BaseInput
              v-model="formData.telefonszam"
              label="Telefonszám"
              type="tel"
              required
            />
          </div>
          <div class="mb-3">
            <BaseInput
              v-model="formData.szemelyi_igazolvany_szam"
              label="Személyi igazolvány szám"
              required
            />
          </div>
        </div>
        <div class="col-md-6">
          <h6>Lakcím adatai</h6>
          <div class="mb-3">
            <BaseInput
              v-model="formData.lakcimData.orszag"
              label="Ország"
              required
            />
          </div>
          <div class="mb-3">
            <BaseInput
              v-model="formData.lakcimData.iranyitoszam"
              label="Irányítószám"
              required
            />
          </div>
          <div class="mb-3">
            <BaseInput
              v-model="formData.lakcimData.varos"
              label="Város"
              required
            />
          </div>
          <div class="mb-3">
            <BaseInput
              v-model="formData.lakcimData.utca_hazszam"
              label="Utca, házszám"
              required
            />
          </div>
        </div>
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
  name: 'ParentEditModal',
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
