<template>
  <div class="container-fluid">
    <div class="row">
      <div class="col-12">
        <div class="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h2 class="mb-1">Űrlap Fejlesztések Demo</h2>
<p style="color: var(--text-muted)" class="mb-0">Auto-mentés, mező súgók és inline validáció bemutatása</p>
          </div>
          <div class="d-flex gap-2">
            <button class="btn btn-outline-secondary" @click="resetForm">
              <i class="bi bi-arrow-clockwise me-2"></i>Alaphelyzet
            </button>
            <button class="btn btn-outline-info" @click="fillWithValidData">
              <i class="bi bi-check-circle me-2"></i>Érvényes adatok
            </button>
            <button class="btn btn-outline-warning" @click="fillWithInvalidData">
              <i class="bi bi-exclamation-triangle me-2"></i>Hibás adatok
            </button>
          </div>
        </div>

        <!-- Demo tabs -->
        <ul class="nav nav-tabs mb-4">
          <li class="nav-item">
            <button 
              class="nav-link" 
              :class="{ active: activeTab === 'enhanced' }"
              @click="activeTab = 'enhanced'"
            >
              <i class="bi bi-stars me-2"></i>Enhanced űrlap
            </button>
          </li>
          <li class="nav-item">
            <button 
              class="nav-link" 
              :class="{ active: activeTab === 'original' }"
              @click="activeTab = 'original'"
            >
              <i class="bi bi-file-earmark-text me-2"></i>Eredeti űrlap
            </button>
          </li>
          <li class="nav-item">
            <button 
              class="nav-link" 
              :class="{ active: activeTab === 'comparison' }"
              @click="activeTab = 'comparison'"
            >
              <i class="bi bi-columns me-2"></i>Összehasonlítás
            </button>
          </li>
        </ul>

        <!-- Enhanced Form Demo -->
        <div v-if="activeTab === 'enhanced'" class="card shadow-sm">
          <div class="card-header">
            <h6 class="mb-0">Enhanced űrlap (Auto-mentés + Validáció + Mező súgók)</h6>
          </div>
          <div class="card-body">
            <EnhancedForm
              v-model="formData"
              :validation-rules="validationRules"
              :auto-save-config="autoSaveConfig"
              :validation-config="validationConfig"
              :show-auto-save="true"
              :show-validation-summary="true"
              :show-stats="true"
              :submit-text="'Mentés & Tesztelés'"
              @submit="handleEnhancedSubmit"
              @reset="resetForm"
              @cancel="handleCancel"
            >
              <div class="row">
                <!-- Personal Information -->
                <div class="col-md-6">
                  <h6 class="mb-3 text-primary">
                    <i class="bi bi-person me-2"></i>Személyes adatok
                  </h6>
                  
                  <div class="mb-3">
                    <BaseInput
                      v-model="formData.nev"
                      label="Teljes név"
                      placeholder="Add meg a teljes nevet"
                      :error="getFieldError('nev')"
                      @blur="validateField('nev', formData.nev)"
                    />
                    <FieldHint
                      text="A névnek legalább 2 karakterből kell állnia"
                      :examples="['Kiss Béla', 'Nagy Erzsébet']"
                      :validation-rules="[
                        { text: 'Minimum 2 karakter', icon: 'bi bi-check-circle' },
                        { text: 'Csak betűk, szóköz és kötőjel megengedett', icon: 'bi bi-check-circle' }
                      ]"
                      :interactive-demo="true"
                      :demo-validator="validateNameDemo"
                      demo-label="Név formátum tesztelése"
                      demo-placeholder="Írja be a nevet..."
                    />
                  </div>
                  
                  <div class="mb-3">
                    <BaseInput
                      v-model="formData.email"
                      label="Email cím"
                      type="email"
                      placeholder="pelda@email.hu"
                      :error="getFieldError('email')"
                      @blur="validateField('email', formData.email)"
                    />
                    <FieldHint
                      text="Érvényes email cím megadása szükséges"
                      :examples="['diak@iskola.hu', 'szulo@gmail.com']"
                      :validation-rules="[
                        { text: 'Formátum: név@domain.hu', icon: 'bi bi-check-circle' },
                        { text: 'Nem lehet üres', icon: 'bi bi-exclamation-triangle' }
                      ]"
                      :interactive-demo="true"
                      :demo-validator="validateEmailDemo"
                      demo-label="Email formátum tesztelése"
                      demo-placeholder="Írja be az email címet..."
                    />
                  </div>
                  
                  <div class="mb-3">
                    <BaseInput
                      v-model="formData.telefonszam"
                      label="Telefonszám"
                      type="tel"
                      placeholder="+36 20 123 4567"
                      :error="getFieldError('telefonszam')"
                      @blur="validateField('telefonszam', formData.telefonszam)"
                    />
                    <FieldHint
                      text="Magyar telefonszám formátum"
                      :examples="['+36 20 123 4567', '06201234567', '06 30 987 6543']"
                      :validation-rules="[
                        { text: 'Kezdődhet +36 vagy 06-tal', icon: 'bi bi-check-circle' },
                        { text: '9-11 számjegy szükséges', icon: 'bi bi-check-circle' },
                        { text: 'Szóközök megengedettek', icon: 'bi bi-check-circle' }
                      ]"
                      :interactive-demo="true"
                      :demo-validator="validatePhoneDemo"
                      demo-label="Telefonszám formátum tesztelése"
                      demo-placeholder="Írja be a telefonszámot..."
                    />
                  </div>
                  
                  <div class="mb-3">
                    <BaseInput
                      v-model="formData.szuletesi_datum"
                      label="Születési dátum"
                      type="date"
                      :error="getFieldError('szuletesi_datum')"
                      @blur="validateField('szuletesi_datum', formData.szuletesi_datum)"
                    />
                    <FieldHint
                      text="A személynek legalább 15 évesnek kell lennie"
                      :validation-rules="[
                        { text: 'Nem lehet a jövőben', icon: 'bi bi-exclamation-triangle' },
                        { text: 'Minimum életkor: 15 év', icon: 'bi bi-exclamation-triangle' },
                        { text: 'Maximum életkor: 120 év', icon: 'bi bi-check-circle' }
                      ]"
                    />
                  </div>
                  
                  <div class="mb-3">
                    <BaseSelect
                      v-model="formData.nem"
                      label="Nem"
                      :options="nemOptions"
                      placeholder="Válassz nemet"
                      :error="getFieldError('nem')"
                      @change="validateField('nem', formData.nem)"
                    />
                    <FieldHint
                      text="Válassza ki a személy nemét"
                      :examples="['férfi', 'nő']"
                    />
                  </div>
                </div>
                
                <!-- Identification Information -->
                <div class="col-md-6">
                  <h6 class="mb-3 text-primary">
                    <i class="bi bi-card-text me-2"></i>Azonosító adatok
                  </h6>
                  
                  <div class="mb-3">
                    <BaseInput
                      v-model="formData.szemelyi_igazolvany_szam"
                      label="Személyi igazolvány szám"
                      placeholder="123456AA"
                      :error="getFieldError('szemelyi_igazolvany_szam')"
                      @blur="validateField('szemelyi_igazolvany_szam', formData.szemelyi_igazolvany_szam)"
                    />
                    <FieldHint
                      text="6 számjegy + 2 nagybetű formátum"
                      :examples="['123456AA', '987654BB', '000000CC']"
                      :validation-rules="[
                        { text: 'Pontosan 6 számjegy', icon: 'bi bi-check-circle' },
                        { text: 'Pontosan 2 nagybetű', icon: 'bi bi-check-circle' },
                        { text: 'Nagybetűk az utolsó 2 karakter', icon: 'bi bi-check-circle' }
                      ]"
                      :interactive-demo="true"
                      :demo-validator="validateIdCardDemo"
                      demo-label="Személyi igazolvány formátum tesztelése"
                      demo-placeholder="Írja be a személyi számot..."
                    />
                  </div>
                  
                  <div class="mb-3">
                    <BaseInput
                      v-model="formData.taj_szam"
                      label="TAJ szám"
                      placeholder="123 456 789"
                      :error="getFieldError('taj_szam')"
                      @blur="validateField('taj_szam', formData.taj_szam)"
                    />
                    <FieldHint
                      text="9 számjegyű TAJ szám (ellenőrző számjeggyel)"
                      :examples="['123456789', '987654321', '111222333']"
                      :validation-rules="[
                        { text: 'Pontosan 9 számjegy', icon: 'bi bi-check-circle' },
                        { text: 'Utolsó számjegy ellenőrző', icon: 'bi bi-check-circle' },
                        { text: 'Formátum: 123456789', icon: 'bi bi-check-circle' }
                      ]"
                      :interactive-demo="true"
                      :demo-validator="validateTajDemo"
                      demo-label="TAJ szám formátum tesztelése"
                      demo-placeholder="Írja be a TAJ számot..."
                    />
                  </div>
                  
                  <div class="mb-3">
                    <BaseInput
                      v-model="formData.diakigazolvany_szam"
                      label="Diákigazolvány szám"
                      placeholder="12345678"
                      :error="getFieldError('diakigazolvany_szam')"
                      @blur="validateField('diakigazolvany_szam', formData.diakigazolvany_szam)"
                    />
                    <FieldHint
                      text="8 számjegyű diákigazolvány szám"
                      :examples="['12345678', '87654321', '11223344']"
                      :validation-rules="[
                        { text: 'Pontosan 8 számjegy', icon: 'bi bi-check-circle' },
                        { text: 'Csak számjegyek megengedettek', icon: 'bi bi-check-circle' }
                      ]"
                      :interactive-demo="true"
                      :demo-validator="validateStudentIdDemo"
                      demo-label="Diákigazolvány formátum tesztelése"
                      demo-placeholder="Írja be a diákigazolvány számot..."
                    />
                  </div>
                  
                  <div class="mb-3">
                    <BaseSelect
                      v-model="formData.kapcsolat_tipusa"
                      label="Kapcsolat típusa"
                      :options="kapcsolatOptions"
                      placeholder="Válassz kapcsolat típust"
                      :error="getFieldError('kapcsolat_tipusa')"
                      @change="validateField('kapcsolat_tipusa', formData.kapcsolat_tipusa)"
                    />
                    <FieldHint
                      text="A szülő vagy gondviselő kapcsolat típusa a diákkal"
                      :examples="['anya', 'apa', 'gondviselo']"
                    />
                  </div>
                  
                  <div class="mb-3">
                    <div class="form-check">
                      <input
                        class="form-check-input"
                        type="checkbox"
                        id="aktivCheck"
                        v-model="formData.aktiv"
                      >
                      <label class="form-check-label" for="aktivCheck">
                        Aktív státusz
                      </label>
                    </div>
                    <FieldHint
                      text="A diák aktív státusza hatással van a szobába költöztethetőségre"
                      variant="info"
                    />
                  </div>
                </div>
              </div>
            </EnhancedForm>
          </div>
        </div>

        <!-- Original Form Demo -->
        <div v-else-if="activeTab === 'original'" class="card shadow-sm">
          <div class="card-header">
            <h6 class="mb-0">Eredeti űrlap (Alap validáció)</h6>
          </div>
          <div class="card-body">
            <form @submit.prevent="handleOriginalSubmit">
              <div class="row">
                <div class="col-md-6">
                  <h6 class="mb-3 text-primary">
                    <i class="bi bi-person me-2"></i>Személyes adatok
                  </h6>
                  
                  <div class="mb-3">
                    <BaseInput
                      v-model="formData.nev"
                      label="Teljes név"
                      placeholder="Add meg a teljes nevet"
                      :error="getFieldError('nev')"
                    />
                  </div>
                  
                  <div class="mb-3">
                    <BaseInput
                      v-model="formData.email"
                      label="Email cím"
                      type="email"
                      placeholder="pelda@email.hu"
                      :error="getFieldError('email')"
                    />
                  </div>
                  
                  <div class="mb-3">
                    <BaseInput
                      v-model="formData.telefonszam"
                      label="Telefonszám"
                      type="tel"
                      placeholder="+36 20 123 4567"
                      :error="getFieldError('telefonszam')"
                    />
                  </div>
                  
                  <div class="mb-3">
                    <BaseInput
                      v-model="formData.szuletesi_datum"
                      label="Születési dátum"
                      type="date"
                      :error="getFieldError('szuletesi_datum')"
                    />
                  </div>
                  
                  <div class="mb-3">
                    <BaseSelect
                      v-model="formData.nem"
                      label="Nem"
                      :options="nemOptions"
                      placeholder="Válassz nemet"
                      :error="getFieldError('nem')"
                    />
                  </div>
                </div>
                
                <div class="col-md-6">
                  <h6 class="mb-3 text-primary">
                    <i class="bi bi-card-text me-2"></i>Azonosító adatok
                  </h6>
                  
                  <div class="mb-3">
                    <BaseInput
                      v-model="formData.szemelyi_igazolvany_szam"
                      label="Személyi igazolvány szám"
                      placeholder="123456AA"
                      :error="getFieldError('szemelyi_igazolvany_szam')"
                    />
                  </div>
                  
                  <div class="mb-3">
                    <BaseInput
                      v-model="formData.taj_szam"
                      label="TAJ szám"
                      placeholder="123 456 789"
                      :error="getFieldError('taj_szam')"
                    />
                  </div>
                  
                  <div class="mb-3">
                    <BaseInput
                      v-model="formData.diakigazolvany_szam"
                      label="Diákigazolvány szám"
                      placeholder="12345678"
                      :error="getFieldError('diakigazolvany_szam')"
                    />
                  </div>
                  
                  <div class="mb-3">
                    <BaseSelect
                      v-model="formData.kapcsolat_tipusa"
                      label="Kapcsolat típusa"
                      :options="kapcsolatOptions"
                      placeholder="Válassz kapcsolat típust"
                      :error="getFieldError('kapcsolat_tipusa')"
                    />
                  </div>
                  
                  <div class="mb-3">
                    <div class="form-check">
                      <input
                        class="form-check-input"
                        type="checkbox"
                        id="originalAktivCheck"
                        v-model="formData.aktiv"
                      >
                      <label class="form-check-label" for="originalAktivCheck">
                        Aktív státusz
                      </label>
                    </div>
                  </div>
                </div>
              </div>
              
              <div class="row mt-4">
                <div class="col-md-6">
                  <div class="d-flex gap-2">
                    <button type="submit" class="btn btn-primary">
                      <i class="bi bi-save me-2"></i>Mentés
                    </button>
                    <button type="button" class="btn btn-outline-secondary" @click="resetForm">
                      <i class="bi bi-arrow-clockwise me-2"></i>Alaphelyzet
                    </button>
                  </div>
                </div>
                <div class="col-md-6 text-md-end">
                  <small style="color: var(--text-muted)">
                    <span class="badge bg-light text-dark me-2">Alap űrlap</span>
                    <span class="badge bg-warning-subtle text-warning">Nincs auto-mentés</span>
                    <span class="badge bg-warning-subtle text-warning">Nincs mező súgó</span>
                  </small>
                </div>
              </div>
            </form>
          </div>
        </div>

        <!-- Comparison View -->
        <div v-else-if="activeTab === 'comparison'" class="row">
          <div class="col-md-6">
            <div class="card shadow-sm h-100">
              <div class="card-header bg-primary text-white">
                <h6 class="mb-0">
                  <i class="bi bi-stars me-2"></i>Enhanced űrlap
                </h6>
              </div>
              <div class="card-body">
                <div class="mb-3">
                  <span class="badge bg-success me-2">✅</span>
                  <strong>Auto-mentés:</strong> 2 másodperces késleltetéssel
                </div>
                <div class="mb-3">
                  <span class="badge bg-success me-2">✅</span>
                  <strong>Mező súgók:</strong> Formátum példák és validációs szabályok
                </div>
                <div class="mb-3">
                  <span class="badge bg-success me-2">✅</span>
                  <strong>Inline validáció:</strong> Azonnali visszajelzés a mezőkön
                </div>
                <div class="mb-3">
                  <span class="badge bg-success me-2">✅</span>
                  <strong>Validációs összegzés:</strong> Hibák áttekintése
                </div>
                <div class="mb-3">
                  <span class="badge bg-success me-2">✅</span>
                  <strong>Offline támogatás:</strong> LocalStorage mentés
                </div>
                <div class="mb-3">
                  <span class="badge bg-success me-2">✅</span>
                  <strong>Proaktív mentés:</strong> Oldal elhagyásakor figyelmeztetés
                </div>
              </div>
            </div>
          </div>
          <div class="col-md-6">
            <div class="card shadow-sm h-100">
              <div class="card-header bg-secondary text-white">
                <h6 class="mb-0">
                  <i class="bi bi-file-earmark-text me-2"></i>Eredeti űrlap
                </h6>
              </div>
              <div class="card-body">
                <div class="mb-3">
                  <span class="badge bg-danger me-2">❌</span>
                  <strong>Auto-mentés:</strong> Nincs, csak submit gomb
                </div>
                <div class="mb-3">
                  <span class="badge bg-danger me-2">❌</span>
                  <strong>Mező súgók:</strong> Nincs, csak placeholder szöveg
                </div>
                <div class="mb-3">
                  <span class="badge bg-danger me-2">❌</span>
                  <strong>Inline validáció:</strong> Csak submit után
                </div>
                <div class="mb-3">
                  <span class="badge bg-danger me-2">❌</span>
                  <strong>Validációs összegzés:</strong> Nincs, csak mezőn belüli hiba
                </div>
                <div class="mb-3">
                  <span class="badge bg-danger me-2">❌</span>
                  <strong>Offline támogatás:</strong> Nincs, adatok elveszhetnek
                </div>
                <div class="mb-3">
                  <span class="badge bg-danger me-2">❌</span>
                  <strong>Proaktív mentés:</strong> Nincs figyelmeztetés
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Form State Info -->
        <div class="card mt-4">
          <div class="card-header">
            <h6 class="mb-0">Űrlap állapot információk</h6>
          </div>
          <div class="card-body">
            <div class="row">
              <div class="col-md-3">
                <div class="info-card">
                  <i class="bi bi-check-circle text-success me-2"></i>
                  <strong>Validáció:</strong> {{ isValid ? 'Érvényes' : 'Hibás' }}
                </div>
              </div>
              <div class="col-md-3">
                <div class="info-card">
                  <i class="bi bi-save text-primary me-2"></i>
                  <strong>Auto-mentés:</strong> {{ autoSaveState?.saveStatus || 'Nincs' }}
                </div>
              </div>
              <div class="col-md-3">
                <div class="info-card">
                  <i class="bi bi-clock text-warning me-2"></i>
                  <strong>Utolsó mentés:</strong> {{ lastSaveTime }}
                </div>
              </div>
              <div class="col-md-3">
                <div class="info-card">
                  <i class="bi bi-file-text text-info me-2"></i>
                  <strong>Hibák száma:</strong> {{ errorCount }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { toast } from 'vue3-toastify'
import EnhancedForm from '../components/EnhancedForm.vue'
import BaseInput from '../components/forms/BaseInput.vue'
import BaseSelect from '../components/forms/BaseSelect.vue'
import FieldHint from '../components/FieldHint.vue'
import { useInlineValidation } from '../composables/useInlineValidation'
import { useAutoSave } from '../composables/useAutoSave'
import { VALIDATION_RULES } from '../composables/useInlineValidation'

// State
const activeTab = ref('enhanced')
const formData = ref({
  nev: '',
  email: '',
  telefonszam: '',
  szuletesi_datum: '',
  nem: '',
  szemelyi_igazolvany_szam: '',
  taj_szam: '',
  diakigazolvany_szam: '',
  kapcsolat_tipusa: '',
  aktiv: true
})

const errors = ref({})

// Options
const nemOptions = [
  { value: 'férfi', label: 'Férfi' },
  { value: 'nő', label: 'Nő' }
]

const kapcsolatOptions = [
  { value: 'anya', label: 'Anya' },
  { value: 'apa', label: 'Apa' },
  { value: 'gondviselo', label: 'Gondviselő' }
]

// Validation setup
const validationRules = {
  nev: VALIDATION_RULES.name,
  email: VALIDATION_RULES.email,
  telefonszam: VALIDATION_RULES.phone,
  szuletesi_datum: VALIDATION_RULES.date,
  nem: VALIDATION_RULES.gender,
  szemelyi_igazolvany_szam: VALIDATION_RULES.idCard,
  taj_szam: VALIDATION_RULES.taj,
  diakigazolvany_szam: VALIDATION_RULES.studentId,
  kapcsolat_tipusa: VALIDATION_RULES.required
}

const validationConfig = {
  debounceTime: 300,
  enableRealTime: true,
  enableToast: false,
  enableSummary: true,
  showSuccess: true,
  maxErrors: 10
}

const validationState = useInlineValidation(validationRules, validationConfig)

// Auto-save setup
const autoSaveConfig = {
  debounceTime: 2000,
  enableLocalStorage: true,
  enableNotifications: true,
  localStorageKey: 'demo-form-data',
  maxRetries: 3,
  retryDelay: 1000,
  saveFunction: async () => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500))
    if (Math.random() < 0.1) { // 10% chance of failure
      throw new Error('Szimulált hálózati hiba')
    }
    console.log('Form data auto-saved:', formData.value)
  }
}

const autoSaveState = useAutoSave(formData.value, autoSaveConfig.saveFunction, autoSaveConfig)

// Computed properties
const isValid = computed(() => {
  return validationState.isValid.value
})

const errorCount = computed(() => {
  return validationState.errorCount.value
})

const lastSaveTime = computed(() => {
  if (!autoSaveState.lastSaved.value) return 'Nincs mentve'
  return new Date(autoSaveState.lastSaved.value).toLocaleTimeString('hu-HU')
})

// Methods
const getFieldError = (field) => {
  return validationState.errors.value[field] || ''
}

const validateField = async (field, value) => {
  await validationState.validateField(field, value, { immediate: true })
}

const handleEnhancedSubmit = async (event) => {
  console.log('Enhanced form submitted:', event)
  toast.success('Enhanced űrlap sikeresen elküldve!', {
    autoClose: 3000,
    position: toast.POSITION.BOTTOM_RIGHT
  })
}

const handleOriginalSubmit = async () => {
  // Manual validation for original form
  let hasErrors = false
  for (const [field, rule] of Object.entries(validationRules)) {
    const error = await rule(formData.value[field])
    if (error) {
      errors.value[field] = error
      hasErrors = true
    } else {
      errors.value[field] = ''
    }
  }
  
  if (!hasErrors) {
    console.log('Original form submitted:', formData.value)
    toast.success('Eredeti űrlap sikeresen elküldve!', {
      autoClose: 3000,
      position: toast.POSITION.BOTTOM_RIGHT
    })
  } else {
    toast.error('Kérjük, javítsa a hibákat az űrlapon!', {
      autoClose: 3000,
      position: toast.POSITION.BOTTOM_RIGHT
    })
  }
}

const handleCancel = () => {
  console.log('Form cancelled')
  toast.info('Űrlap kitöltése megszakítva', {
    autoClose: 2000,
    position: toast.POSITION.BOTTOM_RIGHT
  })
}

const resetForm = () => {
  formData.value = {
    nev: '',
    email: '',
    telefonszam: '',
    szuletesi_datum: '',
    nem: '',
    szemelyi_igazolvany_szam: '',
    taj_szam: '',
    diakigazolvany_szam: '',
    kapcsolat_tipusa: '',
    aktiv: true
  }
  errors.value = {}
  validationState.clearAll()
  autoSaveState.clearState()
  
  toast.info('Űrlap alaphelyzetbe állítva', {
    autoClose: 2000,
    position: toast.POSITION.BOTTOM_RIGHT
  })
}

const fillWithValidData = () => {
  formData.value = {
    nev: 'Kiss Béla',
    email: 'kiss.bela@iskola.hu',
    telefonszam: '+36 20 123 4567',
    szuletesi_datum: '1995-05-15',
    nem: 'férfi',
    szemelyi_igazolvany_szam: '123456AA',
    taj_szam: '123456789',
    diakigazolvany_szam: '12345678',
    kapcsolat_tipusa: 'apa',
    aktiv: true
  }
  
  // Trigger validation
  Object.keys(validationRules).forEach(field => {
    validateField(field, formData.value[field])
  })
  
  toast.success('Érvényes adatokkal kitöltve', {
    autoClose: 2000,
    position: toast.POSITION.BOTTOM_RIGHT
  })
}

const fillWithInvalidData = () => {
  formData.value = {
    nev: 'A', // Too short
    email: 'invalid-email', // Invalid format
    telefonszam: '123', // Invalid format
    szuletesi_datum: '2025-01-01', // Future date
    nem: '', // Empty
    szemelyi_igazolvany_szam: '12345', // Too short
    taj_szam: '12345678', // Too short
    diakigazolvany_szam: '1234567', // Too short
    kapcsolat_tipusa: '', // Empty
    aktiv: true
  }
  
  // Trigger validation
  Object.keys(validationRules).forEach(field => {
    validateField(field, formData.value[field])
  })
  
  toast.error('Hibás adatokkal kitöltve', {
    autoClose: 2000,
    position: toast.POSITION.BOTTOM_RIGHT
  })
}

// Demo validators for interactive hints
const validateNameDemo = (value) => {
  if (!value || value.trim().length < 2) {
    return { isValid: false, message: 'Túl rövid név' }
  }
  if (!/^[\p{L}\s\-'.]+$/u.test(value.trim())) {
    return { isValid: false, message: 'Érvénytelen karakterek' }
  }
  return { isValid: true, message: 'Érvényes név formátum' }
}

const validateEmailDemo = (value) => {
  if (!value) {
    return { isValid: false, message: 'Kötelező mező' }
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(value)) {
    return { isValid: false, message: 'Érvénytelen email formátum' }
  }
  return { isValid: true, message: 'Érvényes email formátum' }
}

const validatePhoneDemo = (value) => {
  if (!value) {
    return { isValid: false, message: 'Kötelező mező' }
  }
  const normalized = value.replace(/\s/g, '')
  const phoneRegex = /^(\+36|06)[1-9][0-9]{7,8}$/
  if (!phoneRegex.test(normalized)) {
    return { isValid: false, message: 'Érvénytelen telefonszám formátum' }
  }
  return { isValid: true, message: 'Érvényes telefonszám formátum' }
}

const validateIdCardDemo = (value) => {
  if (!value) {
    return { isValid: false, message: 'Kötelező mező' }
  }
  const normalized = value.trim().toUpperCase()
  const idRegex = /^[0-9]{6}[A-Z]{2}$/
  if (!idRegex.test(normalized)) {
    return { isValid: false, message: 'Érvénytelen formátum (6 számjegy + 2 nagybetű)' }
  }
  return { isValid: true, message: 'Érvényes személyi igazolvány formátum' }
}

const validateTajDemo = (value) => {
  if (!value) {
    return { isValid: false, message: 'Kötelező mező' }
  }
  const normalized = value.replace(/\s/g, '')
  const tajRegex = /^[0-9]{9}$/
  if (!tajRegex.test(normalized)) {
    return { isValid: false, message: 'Pontosan 9 számjegy szükséges' }
  }
  
  // TAJ checksum validation
  const digits = normalized.split('').map(Number)
  const weights = [3, 7, 3, 7, 3, 7, 3, 7]
  let sum = 0
  for (let i = 0; i < 8; i++) {
    sum += digits[i] * weights[i]
  }
  const checksum = sum % 10
  if (checksum !== digits[8]) {
    return { isValid: false, message: 'Hibás ellenőrző számjegy' }
  }
  return { isValid: true, message: 'Érvényes TAJ szám' }
}

const validateStudentIdDemo = (value) => {
  if (!value) {
    return { isValid: false, message: 'Kötelező mező' }
  }
  const normalized = value.replace(/\s/g, '')
  const studentIdRegex = /^[0-9]{8}$/
  if (!studentIdRegex.test(normalized)) {
    return { isValid: false, message: 'Pontosan 8 számjegy szükséges' }
  }
  return { isValid: true, message: 'Érvényes diákigazolvány szám' }
}

// Watch for form changes and trigger validation
onMounted(() => {
  // Initial validation setup
  Object.keys(validationRules).forEach(field => {
    validateField(field, formData.value[field])
  })
})
</script>

<style scoped>
.info-card {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background-color: var(--bg-card);
  border: 1px solid var(--border-light);
  border-radius: var(--border-radius-sm);
  font-size: 0.9rem;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .info-card {
    margin-bottom: 8px;
  }
  
  .card-body .row > div {
    margin-bottom: 16px;
  }
}

/* Dark theme support */
[data-theme="dark"] .info-card {
  background-color: var(--bg-card);
  border-color: var(--border-dark);
  color: var(--text-primary);
}

/* High contrast theme support */
[data-theme="high-contrast"] .info-card {
  border: 2px solid var(--border-primary);
  background-color: var(--bg-page);
  color: var(--text-primary);
}
</style>