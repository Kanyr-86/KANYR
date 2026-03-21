<template>
  <BaseModal
    v-model:show="show"
    :title="student ? `Diák adatai - ${student.nev}` : 'Diák adatai'"
    size="lg"
    @close="$emit('close')"
  >
    <div v-if="student">
      <ul class="nav nav-tabs mb-3">
        <li class="nav-item">
          <button 
            class="nav-link" 
            :class="{ active: activeTab === 'adatok' }"
            @click="$emit('update:activeTab', 'adatok')"
          >
            Adatok
          </button>
        </li>
        <li class="nav-item">
          <button 
            class="nav-link" 
            :class="{ active: activeTab === 'szoba' }"
            @click="$emit('update:activeTab', 'szoba')"
          >
            Szoba
          </button>
        </li>
      </ul>

      <!-- Adatok tab -->
      <div v-if="activeTab === 'adatok'">
        <div class="row">
          <div class="col-md-6">
            <h6 class="mb-3">Személyes adatok</h6>
            <div class="card mb-3">
              <div class="card-body">
                <div class="mb-2">
                  <strong>Név:</strong>
                  <span class="ms-2" v-text="student.nev"></span>
                </div>
                <div class="mb-2">
                  <strong>Email:</strong>
                  <span class="ms-2" v-text="student.email"></span>
                </div>
                <div class="mb-2">
                  <strong>Telefonszám:</strong>
                  <span class="ms-2">{{ student.telefonszam }}</span>
                </div>
                <div class="mb-2">
                  <strong>Születési dátum:</strong>
                  <span class="ms-2">{{ formatDate(student.szuletesi_datum) }}</span>
                </div>
                <div class="mb-2">
                  <strong>Nem:</strong>
                  <span class="ms-2">{{ student.nem === 'férfi' ? 'Férfi' : 'Nő' }}</span>
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
                  <span class="ms-2">{{ student.szemelyi_igazolvany_szam }}</span>
                </div>
                <div class="mb-2">
                  <strong>TAJ szám:</strong>
                  <span class="ms-2">{{ student.taj_szam }}</span>
                </div>
                <div class="mb-2">
                  <strong>Diákigazolvány:</strong>
                  <span class="ms-2">{{ student.diakigazolvany_szam }}</span>
                </div>
                <div class="mb-2">
                  <strong>Kapcsolat típusa:</strong>
                  <span class="ms-2">{{ getKapcsolatLabel(student.kapcsolat_tipusa) }}</span>
                </div>
                <div class="mb-2">
                  <strong>Státusz:</strong>
                  <span class="ms-2">
                    <span class="badge" :class="student.aktiv ? 'bg-success' : 'bg-secondary'">
                      {{ student.aktiv ? 'Aktív' : 'Inaktív' }}
                    </span>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Szoba tab -->
      <div v-if="activeTab === 'szoba'">
        <div v-if="student.szoba" class="card">
          <div class="card-body">
            <div class="mb-2">
              <strong>Szoba száma:</strong>
              <span class="ms-2">{{ student.szoba.szoba_szama }}</span>
            </div>
            <div class="mb-2">
              <strong>Beköltözés dátuma:</strong>
              <span class="ms-2">{{ formatDate(student.szoba.bekoltozes_datuma) }}</span>
            </div>
          </div>
        </div>
        <div v-else class="text-center py-4">
<div style="color: var(--text-muted)">
            <i class="bi bi-door-closed fs-1"></i>
            <p class="mt-2">Ehhez a diákhoz még nincs szoba hozzárendelve.</p>
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <button type="button" class="btn btn-secondary" @click="$emit('close')">Bezárás</button>
    </template>
  </BaseModal>
</template>

<script>
import BaseModal from '../../components/BaseModal.vue'

export default {
  name: 'StudentViewModal',
  components: { BaseModal },
  props: {
    show: { type: Boolean, default: false },
    student: { type: Object, default: null },
    activeTab: { type: String, default: 'adatok' }
  },
  emits: ['close', 'update:activeTab'],
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
    
    const getKapcsolatLabel = (type) => {
      const labels = {
        'anya': 'Anya',
        'apa': 'Apa',
        'gondviselo': 'Gondviselő'
      }
      return labels[type] || type
    }
    
    return { formatDate, getKapcsolatLabel }
  }
}
</script>
