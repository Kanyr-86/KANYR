<template>
  <div class="container-fluid">
    <!-- Loading Overlay -->
    <LoadingOverlay :show="loading" message="Diákok betöltése..." />
    
    <div class="row">
      <div class="col-12">
        <div class="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h2 class="mb-1">Diákok kezelése</h2>
            <p class="text-muted mb-0">Diák adatok kezelése és szobába költöztetés</p>
          </div>
          <div class="d-flex gap-2">
            <button 
              class="btn btn-primary btn-lg" 
              @click="openEnrollModal"
              :disabled="loading"
            >
              <i class="bi bi-plus-circle me-2"></i>Diák felvétele
            </button>
          </div>
        </div>
        
        <!-- Szűrők és statisztikák -->
        <div class="row mb-4">
          <div class="col-md-8">
            <div class="card">
              <div class="card-body">
                <div class="row g-3">
                  <div class="col-12 col-md-6">
                    <BaseInput
                      v-model="searchQuery"
                      label="Keresés"
                      placeholder="Név, email vagy szoba alapján..."
                      type="text"
                      :disabled="loading"
                    />
                  </div>
                  <div class="col-12 col-md-4">
                    <label class="form-label fw-semibold">Státusz</label>
                    <select class="form-select" v-model="selectedStatus" :disabled="loading">
                      <option value="">Összes státusz</option>
                      <option value="true">Aktív</option>
                      <option value="false">Inaktív</option>
                    </select>
                  </div>
                  <div class="col-12 col-md-2 d-flex align-items-end">
                    <button 
                      class="btn btn-outline-secondary w-100" 
                      @click="clearFilters"
                      :disabled="loading"
                    >
                      <i class="bi bi-x-circle me-2"></i>Szűrők törlése
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div class="col-md-4">
            <div class="row">
                  <div class="col-6">
                <div class="card">
                  <div class="card-body text-center">
                    <h6 class="card-title mb-1">Összes diák</h6>
                    <h3 class="mb-0">
                      <template v-if="loading">
                        <span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                      </template>
                      <template v-else>{{ studentsCount }}</template>
                    </h3>
                  </div>
                </div>
              </div>
              <div class="col-6">
                <div class="card">
                  <div class="card-body text-center">
                    <h6 class="card-title mb-1">Aktív diákok</h6>
                    <h3 class="mb-0">
                      <template v-if="loading">
                        <span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                      </template>
                      <template v-else>{{ activeStudentsCount }}</template>
                    </h3>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Diákok táblázat -->
        <div class="card shadow-sm">
          <div class="card-header border-0">
            <div class="d-flex justify-content-between align-items-center">
              <h6 class="mb-0">Diák lista</h6>
              <span class="badge bg-light text-dark">
                <template v-if="loading">
                  <span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                </template>
                <template v-else>{{ filteredStudentsCount }} diák</template>
              </span>
            </div>
          </div>
          <div class="card-body p-0">
            <div class="table-responsive">
              <!-- Loading skeleton for table -->
              <div v-if="loading" class="p-4">
                <div class="d-flex justify-content-center py-5">
                  <div class="text-center">
                    <div class="spinner-border text-primary" role="status" style="width: 3rem; height: 3rem;">
                      <span class="visually-hidden">Betöltés...</span>
                    </div>
                    <p class="mt-3 text-muted">Diákok betöltése...</p>
                  </div>
                </div>
              </div>
              
              <table v-else class="table table-hover mb-0">
                <thead class="table-light">
                  <tr>
                    <th>Név</th>
                    <th class="d-none d-md-table-cell">Email</th>
                    <th class="d-none d-lg-table-cell">Telefonszám</th>
                    <th>Szoba</th>
                    <th>Státusz</th>
                    <th class="text-center">Műveletek</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="student in safeFilteredStudents" :key="student.diak_id" class="align-middle">
                    <td>
                      <div class="d-flex align-items-center">
                        <div class="avatar rounded-circle d-flex align-items-center justify-content-center me-3" style="width: 40px; height: 40px;"
                             v-text="getInitial(student.nev)">
                        </div>
                        <div>
                          <div class="fw-semibold" v-text="student.nev"></div>
                          <small class="text-muted">{{ student.nem === 'férfi' ? 'Férfi' : 'Nő' }}</small>
                        </div>
                      </div>
                    </td>
                    <td class="d-none d-md-table-cell">
                      <span class="badge" v-text="student.email"></span>
                    </td>
                    <td class="d-none d-lg-table-cell">{{ student.telefonszam || '-' }}</td>
                    <td>
                      <span v-if="student.szoba" class="badge">
                        <i class="bi bi-door-closed me-1"></i>{{ student.szoba.szoba_szama }}
                      </span>
                      <span v-else class="text-muted">Nincs szoba</span>
                    </td>
                    <td>
                      <span class="badge">
                        <i class="bi" :class="student.aktiv ? 'bi-check-circle' : 'bi-x-circle'"></i>
                        {{ student.aktiv ? 'Aktív' : 'Inaktív' }}
                      </span>
                    </td>
                    <td class="text-center">
                      <div class="btn-group" role="group">
                        <button 
                          class="btn btn-outline-primary btn-sm" 
                          @click="viewStudent(student)"
                          title="Diák megtekintése"
                          :disabled="loading"
                        >
                          <i class="bi bi-eye me-1"></i>Megtekintés
                        </button>
                        <button 
                          class="btn btn-outline-warning btn-sm" 
                          @click="editStudent(student)"
                          title="Diák szerkesztése"
                          :disabled="loading"
                        >
                          <i class="bi bi-pencil me-1"></i>Szerkesztés
                        </button>
                        <button 
                          class="btn btn-outline-info btn-sm" 
                          @click="transferStudent(student)"
                          title="Diák költöztetése"
                          :disabled="loading"
                        >
                          <i class="bi bi-arrow-right me-1"></i>Áthelyezés
                        </button>
                        <button 
                          class="btn btn-outline-danger btn-sm" 
                          @click="deleteStudent(student)"
                          title="Diák törlése"
                          :disabled="loading"
                        >
                          <i class="bi bi-trash me-1"></i>Törlés
                        </button>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Diák felvétel modal with comprehensive validation -->
    <BaseModal
      v-model:show="showEnrollModal"
      title="Diák felvétele"
      size="lg"
      @close="closeEnrollModal"
    >
      <form @submit.prevent="submitEnrollment" id="enrollForm">
        <div class="row">
          <!-- Személyes adatok -->
          <div class="col-md-6">
            <h6 class="mb-3 text-primary">
              <i class="bi bi-person me-2"></i>Személyes adatok
            </h6>
            
            <BaseInput
              v-model="enrollForm.nev"
              label="Teljes név"
              placeholder="Add meg a diák teljes nevét"
              :error="errors.nev"
              required
              @blur="validateFieldImmediate('nev', enrollForm.nev)"
            />
            
            <BaseInput
              v-model="enrollForm.email"
              label="Email cím"
              type="email"
              placeholder="pelda@email.hu"
              :error="errors.email"
              required
              @blur="validateFieldImmediate('email', enrollForm.email)"
            />
            
            <BaseInput
              v-model="enrollForm.telefonszam"
              label="Telefonszám"
              type="tel"
              placeholder="+36 20 123 4567 vagy 06201234567"
              :error="errors.telefonszam"
              required
              @blur="validateFieldImmediate('telefonszam', enrollForm.telefonszam)"
            />
            <small class="text-muted d-block mb-2">
              Formátum: +36 20 123 4567, 06 20 123 4567, vagy 06201234567
            </small>
            
            <BaseInput
              v-model="enrollForm.szuletesi_datum"
              label="Születési dátum"
              type="date"
              :error="errors.szuletesi_datum"
              required
              @blur="validateFieldImmediate('szuletesi_datum', enrollForm.szuletesi_datum)"
            />
            
            <BaseSelect
              v-model="enrollForm.nem"
              label="Nem"
              :options="nemOptions"
              placeholder="Válassz nemet"
              :error="errors.nem"
              required
              @change="validateFieldImmediate('nem', enrollForm.nem)"
            />
          </div>
          
          <!-- Azonosító adatok -->
          <div class="col-md-6">
            <h6 class="mb-3 text-primary">
              <i class="bi bi-card-text me-2"></i>Azonosító adatok
            </h6>
            
            <BaseInput
              v-model="enrollForm.szemelyi_igazolvany_szam"
              label="Személyi igazolvány szám"
              placeholder="123456AA"
              :error="errors.szemelyi_igazolvany_szam"
              required
              @blur="validateFieldImmediate('szemelyi_igazolvany_szam', enrollForm.szemelyi_igazolvany_szam)"
            />
            <small class="text-muted d-block mb-2">
              Formátum: 6 számjegy + 2 betű (pl: 123456AA)
            </small>
            
            <BaseInput
              v-model="enrollForm.taj_szam"
              label="TAJ szám"
              placeholder="123 456 789"
              :error="errors.taj_szam"
              required
              @blur="validateFieldImmediate('taj_szam', enrollForm.taj_szam)"
            />
            <small class="text-muted d-block mb-2">
              Formátum: 9 számjegy (pl: 123456789)
            </small>
            
            <BaseInput
              v-model="enrollForm.diakigazolvany_szam"
              label="Diákigazolvány szám"
              placeholder="12345678"
              :error="errors.diakigazolvany_szam"
              required
              @blur="validateFieldImmediate('diakigazolvany_szam', enrollForm.diakigazolvany_szam)"
            />
            
            <BaseSelect
              v-model="enrollForm.kapcsolat_tipusa"
              label="Kapcsolat típusa"
              :options="kapcsolatOptions"
              placeholder="Válassz kapcsolat típust"
              :error="errors.kapcsolat_tipusa"
              required
              @change="validateFieldImmediate('kapcsolat_tipusa', enrollForm.kapcsolat_tipusa)"
            />
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
          @click="closeEnrollModal"
          :disabled="enrollLoading"
        >
          Mégse
        </button>
        <button 
          type="submit" 
          class="btn btn-primary" 
          form="enrollForm"
          :disabled="enrollLoading"
        >
          <span v-if="enrollLoading" class="spinner-border spinner-border-sm me-2" role="status"></span>
          {{ enrollLoading ? 'Mentés...' : 'Diák felvétele' }}
        </button>
      </template>
    </BaseModal>

    <!-- Szerkesztés modal with comprehensive validation -->
    <BaseModal
      v-model:show="showEditModal"
      title="Diák szerkesztése"
      size="lg"
      @close="closeEditModal"
    >
      <form @submit.prevent="submitEdit" id="editForm">
        <div class="row">
          <!-- Személyes adatok -->
          <div class="col-md-6">
            <h6 class="mb-3 text-primary">
              <i class="bi bi-person me-2"></i>Személyes adatok
            </h6>
            
            <BaseInput
              v-model="editForm.nev"
              label="Teljes név"
              placeholder="Add meg a diák teljes nevét"
              :error="editErrors.nev"
              required
              @blur="validateEditFieldImmediate('nev', editForm.nev)"
            />
            
            <BaseInput
              v-model="editForm.email"
              label="Email cím"
              type="email"
              placeholder="pelda@email.hu"
              :error="editErrors.email"
              required
              @blur="validateEditFieldImmediate('email', editForm.email)"
            />
            
            <BaseInput
              v-model="editForm.telefonszam"
              label="Telefonszám"
              type="tel"
              placeholder="+36 20 123 4567 vagy 06201234567"
              :error="editErrors.telefonszam"
              required
              @blur="validateEditFieldImmediate('telefonszam', editForm.telefonszam)"
            />
            <small class="text-muted d-block mb-2">
              Formátum: +36 20 123 4567, 06 20 123 4567, vagy 06201234567
            </small>
            
            <BaseInput
              v-model="editForm.szuletesi_datum"
              label="Születési dátum"
              type="date"
              :error="editErrors.szuletesi_datum"
              required
              @blur="validateEditFieldImmediate('szuletesi_datum', editForm.szuletesi_datum)"
            />
            
            <BaseSelect
              v-model="editForm.nem"
              label="Nem"
              :options="nemOptions"
              placeholder="Válassz nemet"
              :error="editErrors.nem"
              required
              @change="validateEditFieldImmediate('nem', editForm.nem)"
            />
          </div>
          
          <!-- Azonosító adatok -->
          <div class="col-md-6">
            <h6 class="mb-3 text-primary">
              <i class="bi bi-card-text me-2"></i>Azonosító adatok
            </h6>
            
            <BaseInput
              v-model="editForm.szemelyi_igazolvany_szam"
              label="Személyi igazolvány szám"
              placeholder="123456AA"
              :error="editErrors.szemelyi_igazolvany_szam"
              required
              @blur="validateEditFieldImmediate('szemelyi_igazolvany_szam', editForm.szemelyi_igazolvany_szam)"
            />
            <small class="text-muted d-block mb-2">
              Formátum: 6 számjegy + 2 betű (pl: 123456AA)
            </small>
            
            <BaseInput
              v-model="editForm.taj_szam"
              label="TAJ szám"
              placeholder="123 456 789"
              :error="editErrors.taj_szam"
              required
              @blur="validateEditFieldImmediate('taj_szam', editForm.taj_szam)"
            />
            <small class="text-muted d-block mb-2">
              Formátum: 9 számjegy (pl: 123456789)
            </small>
            
            <BaseInput
              v-model="editForm.diakigazolvany_szam"
              label="Diákigazolvány szám"
              placeholder="12345678"
              :error="editErrors.diakigazolvany_szam"
              required
              @blur="validateEditFieldImmediate('diakigazolvany_szam', editForm.diakigazolvany_szam)"
            />
            
            <BaseSelect
              v-model="editForm.kapcsolat_tipusa"
              label="Kapcsolat típusa"
              :options="kapcsolatOptions"
              placeholder="Válassz kapcsolat típust"
              :error="editErrors.kapcsolat_tipusa"
              required
              @change="validateEditFieldImmediate('kapcsolat_tipusa', editForm.kapcsolat_tipusa)"
            />
            
            <div class="form-check mt-3">
              <input
                class="form-check-input"
                type="checkbox"
                id="aktivCheck"
                v-model="editForm.aktiv"
              >
              <label class="form-check-label" for="aktivCheck">
                Aktív státusz
              </label>
            </div>
          </div>
        </div>

        <!-- Validation Summary -->
        <div v-if="showEditValidationSummary && !isEditValid" class="alert alert-danger mt-3">
          <h6 class="alert-heading">
            <i class="bi bi-exclamation-triangle me-2"></i>Kérjük, javítsa a következő hibákat:
          </h6>
          <ul class="mb-0 mt-2">
            <li v-for="(error, field) in editErrors" :key="field" v-if="error">
              <strong>{{ getFieldLabel(field) }}:</strong> {{ error }}
            </li>
          </ul>
        </div>
      </form>

      <template #footer>
        <button 
          type="button" 
          class="btn btn-secondary" 
          @click="closeEditModal"
          :disabled="editLoading"
        >
          Mégse
        </button>
        <button 
          type="submit" 
          class="btn btn-primary" 
          form="editForm"
          :disabled="editLoading"
        >
          <span v-if="editLoading" class="spinner-border spinner-border-sm me-2" role="status"></span>
          {{ editLoading ? 'Mentés...' : 'Módosítások mentése' }}
        </button>
      </template>
    </BaseModal>

    <!-- Megtekintés modal -->
    <BaseModal
      v-model:show="showViewModal"
      :title="viewStudentData ? `Diák adatai - ${viewStudentData.nev}` : 'Diák adatai'"
      size="lg"
      @close="closeViewModal"
    >
      <div v-if="viewStudentData">
        <ul class="nav nav-tabs mb-3">
          <li class="nav-item">
            <button 
              class="nav-link" 
              :class="{ active: activeViewTab === 'adatok' }"
              @click="activeViewTab = 'adatok'"
            >
              Adatok
            </button>
          </li>
          <li class="nav-item">
            <button 
              class="nav-link" 
              :class="{ active: activeViewTab === 'szoba' }"
              @click="activeViewTab = 'szoba'"
            >
              Szoba
            </button>
          </li>
        </ul>

        <!-- Adatok tab -->
        <div v-if="activeViewTab === 'adatok'">
          <div class="row">
            <div class="col-md-6">
              <h6 class="mb-3">Személyes adatok</h6>
              <div class="card mb-3">
                <div class="card-body">
                  <div class="mb-2">
                    <strong>Név:</strong>
                    <span class="ms-2" v-text="viewStudentData.nev"></span>
                  </div>
                    <strong>Email:</strong>
                        <div>
                    <span class="ms-2" v-text="viewStudentData.email"></span>
                  </div>
                  <div class="mb-2">
                    <strong>Telefonszám:</strong>
                    <span class="ms-2">{{ viewStudentData.telefonszam }}</span>
                  </div>
                  <div class="mb-2">
                    <strong>Születési dátum:</strong>
                    <span class="ms-2">{{ formatDate(viewStudentData.szuletesi_datum) }}</span>
                  </div>
                  <div class="mb-2">
                    <strong>Nem:</strong>
                    <span class="ms-2">{{ viewStudentData.nem === 'férfi' ? 'Férfi' : 'Nő' }}</span>
                  </div>
                </div>
              </div>
            </div>
            <div class="col-md-6">
              <h6 class="mb-3">Azonosító adatok</h6>
              <div class="card">
                <div class="card-body">
                  <div class="mb-2">
                    <strong>Személyi igazolvány:</strong>
                    <span class="ms-2">{{ viewStudentData.szemelyi_igazolvany_szam }}</span>
                  </div>
                  <div class="mb-2">
                    <strong>TAJ szám:</strong>
                    <span class="ms-2">{{ viewStudentData.taj_szam }}</span>
                  </div>
                  <div class="mb-2">
                    <strong>Diákigazolvány:</strong>
                    <span class="ms-2">{{ viewStudentData.diakigazolvany_szam }}</span>
                  </div>
                  <div class="mb-2">
                    <strong>Kapcsolat típusa:</strong>
                    <span class="ms-2">{{ getKapcsolatLabel(viewStudentData.kapcsolat_tipusa) }}</span>
                  </div>
                  <div class="mb-2">
                    <strong>Státusz:</strong>
                    <span class="ms-2">
                      <span class="badge" :class="viewStudentData.aktiv ? 'bg-success' : 'bg-secondary'">
                        {{ viewStudentData.aktiv ? 'Aktív' : 'Inaktív' }}
                      </span>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Szoba tab -->
        <div v-if="activeViewTab === 'szoba'">
          <div v-if="viewStudentData.szoba" class="card">
            <div class="card-body">
              <div class="mb-2">
                <strong>Szoba száma:</strong>
                <span class="ms-2">{{ viewStudentData.szoba.szoba_szama }}</span>
              </div>
              <div class="mb-2">
                <strong>Beköltözés dátuma:</strong>
                <span class="ms-2">{{ formatDate(viewStudentData.szoba.bekoltozes_datuma) }}</span>
              </div>
            </div>
          </div>
          <div v-else class="text-center py-4">
            <div class="text-muted">
              <i class="bi bi-door-closed fs-1"></i>
              <p class="mt-2">Ehhez a diákhoz még nincs szoba hozzárendelve.</p>
            </div>
          </div>
        </div>
      </div>

      <template #footer>
        <button type="button" class="btn btn-secondary" @click="closeViewModal">Bezárás</button>
      </template>
    </BaseModal>

    <!-- Törlés megerősítő modal -->
    <BaseModal
      v-model:show="showDeleteModal"
      title="Diák törlése"
      size="md"
      @close="closeDeleteModal"
    >
      <div v-if="deleteStudentData">
        <p>Biztosan törölni szeretné a következő diákot?</p>
            <p><strong v-text="deleteStudentData?.nev || 'N/A'"></strong></p>
        <p>
          <small class="text-muted">
            Figyelem: A diák törlése csak akkor lehetséges, ha nincs hozzárendelve aktív szoba.
          </small>
        </p>
      </div>

      <template #footer>
        <button 
          type="button" 
          class="btn btn-secondary" 
          @click="closeDeleteModal"
          :disabled="deleteLoading"
        >
          Mégse
        </button>
        <button 
          type="button" 
          class="btn btn-danger" 
          @click="confirmDelete"
          :disabled="deleteLoading"
        >
          <span v-if="deleteLoading" class="spinner-border spinner-border-sm me-2" role="status"></span>
          {{ deleteLoading ? 'Törlés...' : 'Törlés' }}
        </button>
      </template>
    </BaseModal>
  </div>
</template>

<script>
import { ref, onMounted, computed, reactive } from 'vue'
import { useAuthStore } from '../store/auth'
import { useApiStore } from '../store/api'
import api from '../services/api'
import { toast } from 'vue3-toastify'
import BaseModal from '../components/BaseModal.vue'
import BaseInput from '../components/forms/BaseInput.vue'
import BaseSelect from '../components/forms/BaseSelect.vue'
import LoadingOverlay from '../components/LoadingOverlay.vue'
import { getSuccessMessage, getErrorMessage, VALIDATION_MESSAGES } from '@/i18n'
import { useApiCancel } from '../composables/useApiCancel'

/**
 * Átfogó validációs szabályok diák űrlapokhoz
 */
const VALIDATION_RULES = {
  // Email validation - standard email format
  email: (value) => {
    if (!value || value.trim() === '') return VALIDATION_MESSAGES.REQUIRED
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(value.trim())) return VALIDATION_MESSAGES.EMAIL_INVALID
    return ''
  },

  // Hungarian phone number validation
  // Accepts: +36201234567, +36 20 123 4567, 06201234567, 06 20 123 4567
  telefonszam: (value) => {
    if (!value || value.trim() === '') return VALIDATION_MESSAGES.REQUIRED
    // Normalize the phone number (remove spaces)
    const normalized = value.replace(/\s/g, '')
    // Check if it matches Hungarian phone format
    const hungarianPhoneRegex = /^(\+36|06)[1-9][0-9]{7,8}$/
    if (!hungarianPhoneRegex.test(normalized)) {
      return 'Érvénytelen telefonszám formátum (pl. +36201234567 vagy 06201234567)'
    }
    return ''
  },

  // Name validation - 2-100 characters
  nev: (value) => {
    if (!value || value.trim() === '') return VALIDATION_MESSAGES.REQUIRED
    if (value.trim().length < 2) return VALIDATION_MESSAGES.MIN_LENGTH(2)
    if (value.trim().length > 100) return VALIDATION_MESSAGES.MAX_LENGTH(100)
    // Check for valid characters (letters, spaces, hyphens)
    const nameRegex = /^[\p{L}\s\-'.]+$/u
    if (!nameRegex.test(value.trim())) {
      return 'A név csak betűket, szóközt és kötőjelet tartalmazhat'
    }
    return ''
  },

  // Birth date validation - must be in the past and reasonable age
  szuletesi_datum: (value) => {
    if (!value || value.trim() === '') return VALIDATION_MESSAGES.REQUIRED
    const date = new Date(value)
    const now = new Date()
    if (isNaN(date.getTime())) return VALIDATION_MESSAGES.DATE_INVALID
    
    // Check if date is in the future
    if (date > now) return 'A születési dátum nem lehet a jövőben'
    
    // Check for reasonable age (between 15 and 100 years old)
    const age = now.getFullYear() - date.getFullYear()
    if (age < 15) return 'A diák legalább 15 éves kell legyen'
    if (age > 100) return 'Érvénytelen születési dátum'
    
    return ''
  },

  // Gender validation
  nem: (value) => {
    if (!value || value.trim() === '') return VALIDATION_MESSAGES.REQUIRED
    if (!['férfi', 'nő'].includes(value)) return 'Érvénytelen nem érték'
    return ''
  },

  // Személyi igazolvány szám validation - 6 digits + 2 letters
  szemelyi_igazolvany_szam: (value) => {
    if (!value || value.trim() === '') return VALIDATION_MESSAGES.REQUIRED
    const normalized = value.trim().toUpperCase()
    // Format: 6 digits followed by 2 letters
    const idRegex = /^[0-9]{6}[A-Z]{2}$/
    if (!idRegex.test(normalized)) {
      return 'Érvénytelen formátum (6 számjegy + 2 nagybetű, pl: 123456AA)'
    }
    return ''
  },

  // TAJ szám validation - 9 digits
  taj_szam: (value) => {
    if (!value || value.trim() === '') return VALIDATION_MESSAGES.REQUIRED
    // Remove spaces
    const normalized = value.replace(/\s/g, '')
    // Check for exactly 9 digits
    const tajRegex = /^[0-9]{9}$/
    if (!tajRegex.test(normalized)) {
      return 'A TAJ szám pontosan 9 számjegyből áll'
    }
    // Optional: TAJ checksum validation (CDV)
    // TAJ checksum: multiply digits by 3,7,3,7,3,7,3,7 and sum, mod 10 should equal 9th digit
    const digits = normalized.split('').map(Number)
    const weights = [3, 7, 3, 7, 3, 7, 3, 7]
    let sum = 0
    for (let i = 0; i < 8; i++) {
      sum += digits[i] * weights[i]
    }
    const checksum = sum % 10
    if (checksum !== digits[8]) {
      return 'Érvénytelen TAJ szám (hibás ellenőrző számjegy)'
    }
    return ''
  },

  // Diákigazolvány szám validation - 8 digits
  diakigazolvany_szam: (value) => {
    if (!value || value.trim() === '') return VALIDATION_MESSAGES.REQUIRED
    // Remove spaces
    const normalized = value.replace(/\s/g, '')
    // Check for exactly 8 digits
    const studentIdRegex = /^[0-9]{8}$/
    if (!studentIdRegex.test(normalized)) {
      return 'A diákigazolvány szám pontosan 8 számjegyből áll'
    }
    return ''
  },

  // Kapcsolat típusa validation
  kapcsolat_tipusa: (value) => {
    if (!value || value.trim() === '') return VALIDATION_MESSAGES.REQUIRED
    if (!['anya', 'apa', 'gondviselo'].includes(value)) return 'Érvénytelen kapcsolat típus'
    return ''
  }
}

/**
 * Teljes űrlap objektum validálása
 * @param {Object} formData - Validálandó űrlap adatok
 * @param {Object} errorsRef - Reaktív hiba objektum feltöltéshez
 * @returns {boolean} Igaz, ha az űrlap érvényes
 */
const validateForm = (formData, errorsRef) => {
  let isValid = true
  
  // Clear previous errors
  Object.keys(errorsRef).forEach(key => delete errorsRef[key])
  
  // Validate each field
  for (const [field, value] of Object.entries(formData)) {
    if (VALIDATION_RULES[field]) {
      const error = VALIDATION_RULES[field](value)
      if (error) {
        errorsRef[field] = error
        isValid = false
      }
    }
  }
  
  return isValid
}

/**
 * Egyetlen mező azonnali validálása
 * @param {string} field - Mező neve
 * @param {*} value - Mező értéke
 * @returns {string} Hibaüzenet vagy üres sztring
 */
const validateField = (field, value) => {
  if (VALIDATION_RULES[field]) {
    return VALIDATION_RULES[field](value)
  }
  return ''
}

export default {
  name: 'StudentsView',
  components: {
    BaseModal,
    BaseInput,
    BaseSelect,
    LoadingOverlay
  },
  setup() {
    // API request cancellation
    const { createAbortController, isAbortError } = useApiCancel()
    
    // Állapot
    const students = ref([])
    const rooms = ref([])
    const parents = ref([])
    const addresses = ref([])
    const loading = ref(false)
    const searchQuery = ref('')
    const selectedStatus = ref('')
    
    // Modal betöltési állapotok
    const enrollLoading = ref(false)
    const editLoading = ref(false)
    const deleteLoading = ref(false)
    
    // Modal láthatósági állapotok
    const showEnrollModal = ref(false)
    const showEditModal = ref(false)
    const showViewModal = ref(false)
    const showDeleteModal = ref(false)
    
    // Megtekintés modal adatok
    const viewStudentData = ref(null)
    const activeViewTab = ref('adatok')
    
    // Törlés modal adatok
    const deleteStudentData = ref(null)
    
    // Űrlap adatok
    const enrollForm = ref({
      nev: '',
      email: '',
      telefonszam: '',
      szuletesi_datum: '',
      nem: '',
      szemelyi_igazolvany_szam: '',
      taj_szam: '',
      diakigazolvany_szam: '',
      kapcsolat_tipusa: ''
    })
    
    const editForm = ref({
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
    
    const currentEditId = ref(null)
    
    // Űrlap hibák
    const errors = ref({})
    const editErrors = ref({})
    const showValidationSummary = ref(false)
    const showEditValidationSummary = ref(false)
    
    // Opciók kiválasztókhoz
    const nemOptions = [
      { value: 'férfi', label: 'Férfi' },
      { value: 'nő', label: 'Nő' }
    ]
    
    const kapcsolatOptions = [
      { value: 'anya', label: 'Anya' },
      { value: 'apa', label: 'Apa' },
      { value: 'gondviselo', label: 'Gondviselő' }
    ]

    // Számított tulajdonságok biztonsági ellenőrzésekkel
    const studentsCount = computed(() => {
      console.log('studentsCount computed, students.value:', students.value)
      if (!students.value || !Array.isArray(students.value)) {
        console.warn('students.value is not an array:', students.value)
        return 0
      }
      return students.value.length
    })

    const activeStudentsCount = computed(() => {
      console.log('activeStudentsCount computed, students.value:', students.value)
      if (!students.value || !Array.isArray(students.value)) {
        console.warn('students.value is not an array in activeStudentsCount:', students.value)
        return 0
      }
      return students.value.filter(student => student && student.aktiv).length
    })

    const safeFilteredStudents = computed(() => {
      console.log('safeFilteredStudents computed, students.value:', students.value)
      if (!students.value || !Array.isArray(students.value)) {
        console.warn('students.value is not an array in safeFilteredStudents:', students.value)
        return []
      }
      
      let result = [...students.value]
      
      // Filter by search query
      if (searchQuery.value) {
        const query = searchQuery.value.toLowerCase()
        result = result.filter(student => {
          if (!student) return false
          const matchesName = student.nev?.toLowerCase().includes(query) || false
          const matchesEmail = student.email?.toLowerCase().includes(query) || false
          const matchesRoomNumber = student.szoba?.szoba_szama?.toString().includes(query) || false
          const matchesNoRoom = !student.szoba && (query.includes('nincs') || query.includes('nincs szoba'))
          return matchesName || matchesEmail || matchesRoomNumber || matchesNoRoom
        })
      }
      
      // Filter by status
      if (selectedStatus.value !== '') {
        const statusBool = selectedStatus.value === 'true'
        result = result.filter(student => student && Boolean(student.aktiv) === statusBool)
      }
      
      return result
    })

    const filteredStudentsCount = computed(() => {
      return safeFilteredStudents.value.length
    })

    // Segédfüggvény a kezdőbetű lekéréséhez
    const getInitial = (name) => {
      if (!name || typeof name !== 'string') return '?'
      return name.charAt(0).toUpperCase()
    }

    // Diákok lekérdezése részletes naplózással
    const fetchStudents = async () => {
      console.log('=== fetchStudents START ===')
      loading.value = true
      const { signal } = createAbortController()
      try {
        console.log('Calling API: /students?includeRelations=true')
        const response = await api.get('/students?includeRelations=true', { signal })
        console.log('API Response:', response)
        console.log('Response data:', response.data)
        console.log('Response data type:', typeof response.data)
        
        if (response.data && response.data.success) {
          const data = response.data.data
          console.log('Data from response:', data)
          console.log('Data type:', typeof data)
          console.log('Is Array:', Array.isArray(data))
          
          if (Array.isArray(data)) {
            students.value = data
            console.log('Students loaded successfully:', students.value.length, 'items')
          } else {
            console.error('ERROR: Data is not an array! Setting empty array.')
            students.value = []
          }
        } else {
          console.error('ERROR: Response not successful:', response.data)
          students.value = []
        }
      } catch (error) {
        if (isAbortError(error)) {
          console.log('Request was aborted - component unmounted')
          return
        }
        console.error('ERROR in fetchStudents:', error)
        console.error('Error message:', error.message)
        console.error('Error response:', error.response?.data)
        students.value = []
      } finally {
        loading.value = false
        console.log('=== fetchStudents END ===')
        console.log('Final students.value:', students.value)
        console.log('Is students.value an array?', Array.isArray(students.value))
      }
    }

    // Segédfüggvény a dátum formázásához
    const formatDate = (dateString) => {
      if (!dateString) return '-'
      const date = new Date(dateString)
      return date.toLocaleDateString('hu-HU', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    }
    
    // Segédfüggvény a kapcsolat címke lekéréséhez
    const getKapcsolatLabel = (type) => {
      const labels = {
        'anya': 'Anya',
        'apa': 'Apa',
        'gondviselo': 'Gondviselő'
      }
      return labels[type] || type
    }
    
    // Segédfüggvény a mező címke lekéréséhez
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

    // Szűrő metódusok
    const clearFilters = () => {
      searchQuery.value = ''
      selectedStatus.value = ''
    }

    // Validációs metódusok - átfogó validációs szabályokkal
    const validateFieldImmediate = (field, value) => {
      const error = validateField(field, value)
      errors.value[field] = error
    }
    
    const validateEditFieldImmediate = (field, value) => {
      const error = validateField(field, value)
      editErrors.value[field] = error
    }
    
    // Számított validációs állapot
    const isValid = computed(() => {
      return Object.values(errors.value).every(error => !error)
    })
    
    const isEditValid = computed(() => {
      return Object.values(editErrors.value).every(error => !error)
    })

    // Modal metódusok - Felvétel
    const openEnrollModal = () => {
      showEnrollModal.value = true
      errors.value = {}
      showValidationSummary.value = false
    }
    
    const closeEnrollModal = () => {
      showEnrollModal.value = false
      // Reset form
      enrollForm.value = {
        nev: '',
        email: '',
        telefonszam: '',
        szuletesi_datum: '',
        nem: '',
        szemelyi_igazolvany_szam: '',
        taj_szam: '',
        diakigazolvany_szam: '',
        kapcsolat_tipusa: ''
      }
      errors.value = {}
      showValidationSummary.value = false
    }
    
    const submitEnrollment = async () => {
      // Validate all fields before submission
      const isFormValid = validateForm(enrollForm.value, errors.value)
      
      if (!isFormValid) {
        showValidationSummary.value = true
        toast.error('Kérjük, javítsa a hibákat a mentés előtt!')
        return
      }
      
      enrollLoading.value = true
      try {
        const response = await api.post('/students', enrollForm.value)
        if (response.data.success) {
          toast.success(getSuccessMessage('ENROLL_SUCCESS'))
          closeEnrollModal()
          fetchStudents()
        }
      } catch (error) {
        console.error(getErrorMessage('CREATE_ERROR'), error)
        toast.error(error.response?.data?.error || getErrorMessage('CREATE_ERROR'))
      } finally {
        enrollLoading.value = false
      }
    }

    // Modal metódusok - Megtekintés
    const viewStudent = (student) => {
      viewStudentData.value = student
      activeViewTab.value = 'adatok'
      showViewModal.value = true
    }
    
    const closeViewModal = () => {
      showViewModal.value = false
      viewStudentData.value = null
    }

    // Modal metódusok - Szerkesztés
    const editStudent = (student) => {
      currentEditId.value = student.diak_id
      editForm.value = {
        nev: student.nev || '',
        email: student.email || '',
        telefonszam: student.telefonszam || '',
        szuletesi_datum: student.szuletesi_datum || '',
        nem: student.nem || '',
        szemelyi_igazolvany_szam: student.szemelyi_igazolvany_szam || '',
        taj_szam: student.taj_szam || '',
        diakigazolvany_szam: student.diakigazolvany_szam || '',
        kapcsolat_tipusa: student.kapcsolat_tipusa || '',
        aktiv: student.aktiv || false
      }
      editErrors.value = {}
      showEditValidationSummary.value = false
      showEditModal.value = true
    }
    
    const closeEditModal = () => {
      showEditModal.value = false
      currentEditId.value = null
      editErrors.value = {}
      showEditValidationSummary.value = false
    }
    
    const submitEdit = async () => {
      // Validate all fields before submission
      const isFormValid = validateForm(editForm.value, editErrors.value)
      
      if (!isFormValid) {
        showEditValidationSummary.value = true
        toast.error('Kérjük, javítsa a hibákat a mentés előtt!')
        return
      }
      
      editLoading.value = true
      try {
        const response = await api.put(`/students/${currentEditId.value}`, editForm.value)
        if (response.data.success) {
          toast.success(getSuccessMessage('UPDATE_SUCCESS'))
          closeEditModal()
          fetchStudents()
        }
      } catch (error) {
        console.error(getErrorMessage('UPDATE_ERROR'), error)
        toast.error(error.response?.data?.error || getErrorMessage('UPDATE_ERROR'))
      } finally {
        editLoading.value = false
      }
    }

    // Modal metódusok - Áthelyezés
    const transferStudent = (student) => {
      // Placeholder for transfer functionality
      toast.info(`${student.nev} költöztetése - funkció fejlesztés alatt`)
    }

    // Modal metódusok - Törlés
    const deleteStudent = (student) => {
      deleteStudentData.value = student
      showDeleteModal.value = true
    }
    
    const closeDeleteModal = () => {
      showDeleteModal.value = false
      deleteStudentData.value = null
    }
    
    const confirmDelete = async () => {
      if (!deleteStudentData.value) return
      
      deleteLoading.value = true
      try {
        const response = await api.delete(`/students/${deleteStudentData.value.diak_id}`)
        if (response.data.success) {
          toast.success(getSuccessMessage('DELETE_SUCCESS'))
          closeDeleteModal()
          fetchStudents()
        } else {
          toast.error(response.data.error || getErrorMessage('DELETE_ERROR'))
        }
      } catch (error) {
        console.error(getErrorMessage('DELETE_ERROR'), error)
        toast.error(error.response?.data?.error || getErrorMessage('DELETE_ERROR'))
      } finally {
        deleteLoading.value = false
      }
    }

    // Életciklus
    onMounted(() => {
      console.log('=== StudentsView mounted ===')
      console.log('Initial students.value:', students.value)
      fetchStudents()
    })

    return {
      // State
      students,
      loading,
      searchQuery,
      selectedStatus,
      // Modal loading states
      enrollLoading,
      editLoading,
      deleteLoading,
      // Modal visibility states
      showEnrollModal,
      showEditModal,
      showViewModal,
      showDeleteModal,
      // Modal data
      viewStudentData,
      deleteStudentData,
      activeViewTab,
      // Forms
      enrollForm,
      editForm,
      currentEditId,
      // Form errors
      errors,
      editErrors,
      showValidationSummary,
      showEditValidationSummary,
      // Options
      nemOptions,
      kapcsolatOptions,
      // Computed
      studentsCount,
      activeStudentsCount,
      safeFilteredStudents,
      filteredStudentsCount,
      isValid,
      isEditValid,
      // Methods
      clearFilters,
      openEnrollModal,
      closeEnrollModal,
      submitEnrollment,
      viewStudent,
      closeViewModal,
      editStudent,
      closeEditModal,
      submitEdit,
      transferStudent,
      deleteStudent,
      closeDeleteModal,
      confirmDelete,
      getInitial,
      fetchStudents,
      formatDate,
      getKapcsolatLabel,
      getFieldLabel,
      validateFieldImmediate,
      validateEditFieldImmediate
    }
  }
}
</script>

<style scoped>
.avatar {
  background: linear-gradient(135deg, var(--primary-600), var(--primary-700));
  color: white;
  font-weight: bold;
}

/* High contrast avatar */
[data-theme="high-contrast"] .avatar {
  background: var(--primary-600);
  color: var(--text-inverse);
  border: 2px solid var(--border-primary);
}
</style>