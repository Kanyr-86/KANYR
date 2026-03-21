<template>
  <BaseModal
    v-model:show="show"
    title="Diák szerkesztése"
    size="lg"
    @close="$emit('close')"
  >
    <form @submit.prevent="submit" id="editForm">
      <div class="row">
        <!-- Személyes adatok -->
        <div class="col-md-6">
          <h6 class="mb-3 text-primary">
            <i class="bi bi-person me-2"></i>Személyes adatok
          </h6>
          
          <BaseInput
            v-model="form.nev"
            label="Teljes név"
            placeholder="Add meg a diák teljes nevét"
            :error="errors.nev"
            required
            @blur="validateField('nev', form.nev)"
          />
          
          <BaseInput
            v-model="form.email"
            label="Email cím"
            type="email"
            placeholder="pelda@email.hu"
            :error="errors.email"
            required
            @blur="validateField('email', form.email)"
          />
          
          <BaseInput
            v-model="form.telefonszam"
            label="Telefonszám"
            type="tel"
            placeholder="+36 20 123 4567 vagy 06201234567"
            :error="errors.telefonszam"
            required
            @blur="validateField('telefonszam', form.telefonszam)"
          />
<small style="color: var(--text-muted)" class="d-block mb-2">
            Formátum: +36 20 123 4567, 06 20 123 4567, vagy 06201234567
          </small>
          
          <BaseInput
            v-model="form.szuletesi_datum"
            label="Születési dátum"
            type="date"
            :error="errors.szuletesi_datum"
            required
            @blur="validateField('szuletesi_datum', form.szuletesi_datum)"
          />
          
          <BaseSelect
            v-model="form.nem"
            label="Nem"
            :options="nemOptions"
            placeholder="Válassz nemet"
            :error="errors.nem"
            required
            @change="validateField('nem', form.nem)"
          />
        </div>
        
        <!-- Azonosító adatok -->
        <div class="col-md-6">
          <h6 class="mb-3 text-primary">
            <i class="bi bi-card-text me-2"></i>Azonosító adatok
          </h6>
          
          <BaseInput
            v-model="form.szemelyi_igazolvany_szam"
            label="Személyi igazolvány szám"
            placeholder="123456AA"
            :error="errors.szemelyi_igazolvany_szam"
            required
            @blur="validateField('szemelyi_igazolvany_szam', form.szemelyi_igazolvany_szam)"
          />
          <small class="text-muted d-block mb-2">
            Formátum: 6 számjegy + 2 betű (pl: 123456AA)
          </small>
          
          <BaseInput
            v-model="form.taj_szam"
            label="TAJ szám"
            placeholder="123 456 789"
            :error="errors.taj_szam"
            required
            @blur="validateField('taj_szam', form.taj_szam)"
          />
          <small class="text-muted d-block mb-2">
            Formátum: 9 számjegy (pl: 123456789)
          </small>
          
          <BaseInput
            v-model="form.diakigazolvany_szam"
            label="Diákigazolvány szám"
            placeholder="12345678"
            :error="errors.diakigazolvany_szam"
            required
            @blur="validateField('diakigazolvany_szam', form.diakigazolvany_szam)"
          />
          
          <BaseSelect
            v-model="form.kapcsolat_tipusa"
            label="Kapcsolat típusa"
            :options="kapcsolatOptions"
            placeholder="Válassz kapcsolat típust"
            :error="errors.kapcsolat_tipusa"
            required
            @change="validateField('kapcsolat_tipusa', form.kapcsolat_tipusa)"
          />
          
          <div class="form-check mt-3">
            <input
              class="form-check-input"
              type="checkbox"
              id="aktivCheck"
              v-model="form.aktiv"
            >
            <label class="form-check-label" for="aktivCheck">
              Aktív státusz
            </label>
          </div>
        </div>
      </div>

      <!-- Validation Summary -->
      <div v-if="showValidationSummary && !isValid" class="alert alert-danger mt-3">
        <h6 class="alert-heading">
          <i class="bi bi-exclamation-triangle me-2"></i>Kérjük, javítsa a következő hibákat:
        </h6>
        <ul class="mb-0 mt-2">
          <li v-for="(error, field) in errors" :key="field" v-if="error">
            <strong>{{ getFieldLabel(field) }}:</strong> {{ error }}
          </li>
        </ul>
      </div>
    </form>

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
        type="submit" 
        class="btn btn-primary" 
        form="editForm"
        :disabled="loading"
      >
        <span v-if="loading" class="spinner-border spinner-border-sm me-2" role="status"></span>
        {{ loading ? 'Mentés...' : 'Módosítások mentése' }}
      </button>
    </template>
  </BaseModal>
</template>

<script>
import BaseModal from '../../components/BaseModal.vue'
import BaseInput from '../../components/forms/BaseInput.vue'
import BaseSelect from '../../components/forms/BaseSelect.vue'

export default {
  name: 'StudentEditModal',
  components: { BaseModal, BaseInput, BaseSelect },
  props: {
    show: { type: Boolean, default: false },
    form: { type: Object, required: true },
    errors: { type: Object, default: () => ({}) },
    loading: { type: Boolean, default: false },
    showValidationSummary: { type: Boolean, default: false },
    isValid: { type: Boolean, default: true }
  },
  emits: ['close', 'submit', 'validate'],
  setup(props, { emit }) {
    const nemOptions = [
      { value: 'férfi', label: 'Férfi' },
      { value: 'nő', label: 'Nő' }
    ]
    
    const kapcsolatOptions = [
      { value: 'anya', label: 'Anya' },
      { value: 'apa', label: 'Apa' },
      { value: 'gondviselo', label: 'Gondviselő' }
    ]
    
    const validateField = (field, value) => emit('validate', field, value)
    const submit = () => emit('submit')
    
    const getFieldLabel = (field) => {
      const labels = {
        'nev': 'Teljes név',
        'email': 'Email cím',
        'telefonszam': 'Telefonszám',
        'szuletesi_datum': 'Születési dátum',
        'nem': 'Nem',
        'szemelyi_igazolvany_szam': 'Személyi igazolvány szám',
        'taj_szam': 'TAJ szám',
        'diakigazolvany_szam': 'Diákigazolvány szám',
        'kapcsolat_tipusa': 'Kapcsolat típusa'
      }
      return labels[field] || field
    }
    
    return { nemOptions, kapcsolatOptions, validateField, submit, getFieldLabel }
  }
}
</script>
