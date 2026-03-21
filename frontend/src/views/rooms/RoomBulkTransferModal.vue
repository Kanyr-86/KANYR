<template>
  <BaseModal
    :show="show"
    :title="modalTitle"
    :size="modalSize"
    @close="$emit('close')"
  >
    <!-- Step 1: Room Selection -->
    <div v-if="step === 1">
      <div class="alert alert-info mb-3">
        <i class="bi bi-info-circle"></i>
        Válassza ki a szobát, ahová a diákokat költöztetni szeretné. 
        Csak a szabad hellyel rendelkező szobák jelennek meg.
      </div>
      
      <div v-if="availableRooms.length === 0" class="alert alert-warning">
        <strong>Nincs elérhető szoba!</strong><br>
        Minden szoba tele van, vagy nincs elegendő szabad hely.
      </div>
      
      <div class="row" v-else>
        <div class="col-md-6 col-lg-4" v-for="room in availableRooms" :key="room.szoba_id">
          <div class="card mb-3 room-card">
            <div class="card-header d-flex justify-content-between align-items-center">
              <h6 class="mb-0">{{ room.szoba_szama }}</h6>
              <div class="d-flex gap-1">
                <span class="badge" :class="getRoomBadgeClass(room)">
                  {{ getRoomBadgeText(room) }}
                </span>
              </div>
            </div>
            <div class="card-body">
              <p class="card-text mb-1">
                <small><strong>Férőhely:</strong> {{ room.osszes_hely }} fő</small>
              </p>
              <p class="card-text mb-1">
                <small><strong>Jelenlegi lakók:</strong> {{ room.currentOccupancy || 0 }}</small>
              </p>
              <p class="card-text mb-2">
                <small><strong>Szabad helyek:</strong> {{ room.osszes_hely - (room.currentOccupancy || 0) }}</small>
              </p>
              <div class="progress mb-3" style="height: 8px;">
                <div class="progress-bar" 
                     :class="getProgressClass(room)"
                     :style="{ width: getOccupancyPercentage(room) + '%' }"
                     :aria-valuenow="getOccupancyPercentage(room)" 
                     aria-valuemin="0" 
                     aria-valuemax="100">
                </div>
              </div>
              <button 
                class="btn btn-sm w-100 btn-outline-primary" 
                @click="$emit('select-room', room)">
                Kiválaszt
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Step 2: Room Confirmation -->
    <div v-if="step === 2">
      <div class="alert alert-info mb-3">
        Kérjük, erősítse meg a kiválasztott szobát:
      </div>
      
      <div class="card border-primary">
        <div class="card-header bg-primary text-white">
          <h5 class="mb-0">{{ selectedRoom?.szoba_szama }}</h5>
        </div>
        <div class="card-body">
          <table class="table table-borderless table-sm">
            <tbody>
              <tr>
                <td><strong>Státusz:</strong></td>
                <td>
                  <span class="badge" :class="getRoomBadgeClass(selectedRoom)">
                    {{ getRoomBadgeText(selectedRoom) }}
                  </span>
                </td>
              </tr>
              <tr>
                <td><strong>Férőhely:</strong></td>
                <td>{{ selectedRoom?.osszes_hely }} fő</td>
              </tr>
              <tr>
                <td><strong>Jelenlegi lakók:</strong></td>
                <td>{{ selectedRoom?.currentOccupancy || 0 }} fő</td>
              </tr>
              <tr>
                <td><strong>Szabad helyek:</strong></td>
                <td class="text-success">
                  <strong>{{ (selectedRoom?.osszes_hely || 0) - (selectedRoom?.currentOccupancy || 0) }} fő</strong>
                </td>
              </tr>
            </tbody>
          </table>
          <div class="progress" style="height: 10px;">
            <div class="progress-bar" 
                 :class="getProgressClass(selectedRoom)"
                 :style="{ width: getOccupancyPercentage(selectedRoom) + '%' }">
            </div>
          </div>
        </div>
      </div>
      
      <div class="alert alert-warning mt-3">
        <small>
          <i class="bi bi-exclamation-triangle"></i>
          Ezután kiválaszthatja a diákokat, akiket ebbe a szobába szeretne költöztetni.
        </small>
      </div>
    </div>

    <!-- Step 3: Student Selection -->
    <div v-if="step === 3">
      <!-- Beköltözés dátuma -->
      <div class="mb-3">
        <BaseInput
          v-model="formData.bekoltozes_datum"
          label="Beköltözés / átköltöztetés dátuma"
          type="date"
          required
        />
      </div>

      <!-- Summary -->
      <div v-if="formData.diak_ids.length > 0" class="alert alert-info mb-3">
        <div class="d-flex justify-content-between align-items-center">
          <div>
            <strong>Kiválasztott diákok:</strong> {{ formData.diak_ids.length }} fő
            <br>
            <small>
              <span class="text-success">Új beköltöztetés: {{ newMoveInsCount }} fő</span> |
              <span class="text-warning">Átköltöztetés: {{ transfersCount }} fő</span>
            </small>
          </div>
          <div v-if="transfersCount > 0">
<small style="color: var(--text-muted)">
              Az átköltöztetett diákok régi szobája automatikusan felszabadul.
            </small>
          </div>
        </div>
      </div>
      
      <div class="mb-3">
        <label class="form-label">Diákok kiválasztása</label>
        <div class="alert alert-light border mb-2">
          <small class="text-muted">
            <i class="bi bi-info-circle"></i>
            <strong>Útmutató:</strong>
            <span class="badge bg-success ms-1">Inaktív</span> = új beköltöztetés,
            <span class="badge bg-warning text-dark ms-1">Aktív</span> = átköltöztetés másik szobából
          </small>
        </div>
        <div v-if="selectedGender" class="alert alert-info mb-2">
          <small>
            <strong>Kiválasztott nem:</strong> {{ selectedGender === 'férfi' ? 'Férfi' : 'Nő' }} |
            <span class="text-muted">Csak azonos nemű diákokat választhat.</span>
          </small>
        </div>
        <div class="table-responsive" style="max-height: 400px; overflow-y: auto;">
          <table class="table table-striped table-hover">
            <thead class="table-dark sticky-top">
              <tr>
                <th style="width: 50px;">Választ</th>
                <th>Név</th>
                <th>Email</th>
                <th>Nem</th>
                <th>Státusz</th>
                <th>Jelenlegi szoba</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="student in availableStudents" :key="student.diak_id" 
                  :class="{ 
                    'table-secondary': !isSelectable(student) && !isSelected(student.diak_id),
                    'table-success': isSelected(student.diak_id) && !student.aktiv,
                    'table-warning': isSelected(student.diak_id) && student.aktiv
                  }">
                <td class="text-center">
                  <input type="checkbox" 
                         class="form-check-input"
                         :value="student.diak_id" 
                         :checked="isSelected(student.diak_id)"
                         @change="$emit('toggle-student', student.diak_id)"
                         :disabled="!isSelectable(student) && !isSelected(student.diak_id)">
                </td>
                <td>
                  <strong v-text="student.nev"></strong>
                  <span v-if="isSelected(student.diak_id)" class="ms-2">
                    <span v-if="!student.aktiv" class="badge bg-success">Új beköltöztetés</span>
                    <span v-else class="badge bg-warning text-dark">Átköltöztetés</span>
                  </span>
                </td>
                <td>{{ student.email }}</td>
                <td>{{ student.nem === 'férfi' ? 'Férfi' : 'Nő' }}</td>
                <td>
                  <span class="badge" :class="student.aktiv ? 'bg-warning text-dark' : 'bg-success'">
                    {{ student.aktiv ? 'Aktív' : 'Inaktív' }}
                  </span>
                </td>
                <td>
                  <span v-if="student.szoba" class="badge bg-info">
                    {{ student.szoba.szoba_szama }}
                  </span>
                  <span v-else class="text-muted">-</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
    
    <template #footer>
      <button type="button" class="btn btn-secondary" @click="$emit('close')">
        <span v-if="step === 1">Mégse</span>
        <span v-else><i class="bi bi-arrow-left"></i> Vissza</span>
      </button>
      <button 
        v-if="step < 3" 
        type="button" 
        class="btn btn-primary" 
        @click="$emit('next-step')"
        :disabled="step === 2 && !selectedRoom">
        Tovább <i class="bi bi-arrow-right"></i>
      </button>
      <button 
        v-else
        type="button" 
        class="btn btn-primary" 
        :disabled="loading || formData.diak_ids.length === 0"
        @click="$emit('submit')">
        <span v-if="loading">Feldolgozás...</span>
        <span v-else>{{ submitButtonText }}</span>
      </button>
    </template>
  </BaseModal>
</template>

<script>
import { defineAsyncComponent, computed } from 'vue'

const BaseModal = defineAsyncComponent(() => import('../../components/BaseModal.vue'))
const BaseInput = defineAsyncComponent(() => import('../../components/forms/BaseInput.vue'))

export default {
  name: 'RoomBulkTransferModal',
  components: {
    BaseModal,
    BaseInput
  },
  props: {
    show: {
      type: Boolean,
      required: true
    },
    step: {
      type: Number,
      required: true
    },
    formData: {
      type: Object,
      required: true
    },
    availableRooms: {
      type: Array,
      default: () => []
    },
    availableStudents: {
      type: Array,
      default: () => []
    },
    selectedRoom: {
      type: Object,
      default: null
    },
    loading: {
      type: Boolean,
      default: false
    }
  },
  emits: ['close', 'select-room', 'next-step', 'toggle-student', 'submit'],
  setup(props) {
    const modalTitle = computed(() => {
      const titles = {
        1: 'Tömeges beköltöztetés - 1. lépés: Szoba kiválasztása',
        2: 'Tömeges beköltöztetés - 2. lépés: Szoba megerősítése',
        3: `Tömeges beköltöztetés - 3. lépés: Diákok kiválasztása${props.selectedRoom ? ` (${props.selectedRoom.szoba_szama})` : ''}`
      }
      return titles[props.step] || 'Tömeges beköltöztetés'
    })

    const modalSize = computed(() => props.step === 3 || props.step === 1 ? 'xl' : 'md')

    const selectedGender = computed(() => {
      if (props.formData.diak_ids.length === 0) return null
      const firstSelectedId = props.formData.diak_ids[0]
      const firstSelected = props.availableStudents.find(s => s.diak_id === firstSelectedId)
      return firstSelected?.nem || null
    })

    const newMoveInsCount = computed(() => {
      return props.availableStudents.filter(s => 
        props.formData.diak_ids.includes(s.diak_id) && !s.aktiv
      ).length
    })

    const transfersCount = computed(() => {
      return props.availableStudents.filter(s => 
        props.formData.diak_ids.includes(s.diak_id) && s.aktiv
      ).length
    })

    const submitButtonText = computed(() => {
      const newCount = newMoveInsCount.value
      const transferCount = transfersCount.value
      
      if (newCount > 0 && transferCount > 0) {
        return `${newCount} beköltöztetés + ${transferCount} átköltöztetés`
      } else if (transferCount > 0) {
        return `${transferCount} diák átköltöztetése`
      } else {
        return `${newCount} diák beköltöztetése`
      }
    })

    const isSelected = (studentId) => props.formData.diak_ids.includes(studentId)

    const isSelectable = (student) => {
      const gender = selectedGender.value
      if (!gender) return true
      return student.nem === gender
    }

    const getOccupancyPercentage = (room) => {
      if (!room?.osszes_hely) return 0
      const current = room.currentOccupancy || 0
      return Math.round((current / room.osszes_hely) * 100)
    }

    const getRoomBadgeClass = (room) => {
      if (!room) return 'bg-secondary'
      const occupancy = room.currentOccupancy || 0
      const capacity = room.osszes_hely
      
      if (occupancy === 0) return 'bg-secondary'
      if (occupancy === capacity) return 'bg-danger'
      if (occupancy >= capacity * 0.8) return 'bg-warning'
      return 'bg-success'
    }

    const getRoomBadgeText = (room) => {
      if (!room) return '-'
      const occupancy = room.currentOccupancy || 0
      const capacity = room.osszes_hely
      
      if (occupancy === 0) return 'Üres'
      if (occupancy === capacity) return 'Tele'
      if (occupancy >= capacity * 0.8) return 'Majdnem tele'
      return 'Elérhető'
    }

    const getProgressClass = (room) => {
      const percentage = getOccupancyPercentage(room)
      
      if (percentage < 50) return 'bg-success'
      if (percentage < 80) return 'bg-info'
      if (percentage < 100) return 'bg-warning'
      return 'bg-danger'
    }

    return {
      modalTitle,
      modalSize,
      selectedGender,
      newMoveInsCount,
      transfersCount,
      submitButtonText,
      isSelected,
      isSelectable,
      getOccupancyPercentage,
      getRoomBadgeClass,
      getRoomBadgeText,
      getProgressClass
    }
  }
}
</script>
