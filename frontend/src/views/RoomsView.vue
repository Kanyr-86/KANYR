<template>
  <div class="container-fluid">
    <!-- Loading Overlay -->
    <LoadingOverlay :show="loading" message="Szobák betöltése..." />
    
    <div class="row">
      <div class="col-12">
        <div class="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h2 class="mb-1">Szobák kezelése</h2>
            <p style="color: var(--text-muted)" class="mb-0">Szobák kezelése és tömeges beköltöztetés</p>
          </div>
          <div class="d-flex gap-2">
            <button 
              class="btn btn-primary btn-lg" 
              @click="showCreateModal = true"
              :disabled="loading"
            >
              <i class="bi bi-plus-circle me-2"></i>Szoba felvétele
            </button>
            <button 
              class="btn btn-info btn-lg" 
              @click="openBulkTransferModal"
              :disabled="loading"
            >
              <i class="bi bi-people me-2"></i>Tömeges beköltöztetés
            </button>
          </div>
        </div>
        
        <!-- Szűrők és statisztikák -->
        <div class="row mb-4">
          <div class="col-md-8">
            <div class="card">
              <div class="card-body">
                <div class="row g-3">
                  <div class="col-12 col-md-4">
                    <BaseInput
                      v-model="searchQuery"
                      label="Keresés"
                      placeholder="Szobaszám alapján..."
                      type="text"
                      @input="debouncedSearch"
                      :disabled="loading"
                    />
                  </div>
                  <div class="col-12 col-md-3">
                    <label class="form-label fw-semibold">Férőhely</label>
                    <select class="form-select" v-model="selectedCapacity" :disabled="loading">
                      <option value="">Összes férőhely</option>
                      <option value="1">1 fő</option>
                      <option value="2">2 fő</option>
                      <option value="3">3 fő</option>
                      <option value="4">4 fő</option>
                    </select>
                  </div>
                  <div class="col-12 col-md-3">
                    <label class="form-label fw-semibold">Státusz</label>
                    <select class="form-select" v-model="selectedStatus" :disabled="loading">
                      <option value="">Összes státusz</option>
                      <option value="empty">Üres</option>
                      <option value="available">Van szabad hely</option>
                      <option value="full">Tele</option>
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
                    <h6 class="card-title mb-1">Összes szoba</h6>
                    <h3 class="mb-0">
                      <template v-if="loading">
                        <span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                      </template>
                      <template v-else>{{ rooms.length }}</template>
                    </h3>
                  </div>
                </div>
              </div>
              <div class="col-6">
                <div class="card">
                  <div class="card-body text-center">
                    <h6 class="card-title mb-1">Elérhető szobák</h6>
                    <h3 class="mb-0">
                      <template v-if="loading">
                        <span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                      </template>
                      <template v-else>{{ availableRoomsCount }}</template>
                    </h3>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Enhanced loading state -->
        <div v-if="loading" class="row">
          <div class="col-12">
            <div class="d-flex justify-content-center py-5">
              <div class="text-center">
                <div class="spinner-border text-primary" role="status" style="width: 3rem; height: 3rem;">
                  <span class="visually-hidden">Szobák betöltése folyamatban</span>
                </div>
                <h5 class="mt-3 text-primary fw-semibold">Szobák betöltése...</h5>
<p style="color: var(--text-muted)" class="mb-0">Kérjük, várjon amíg betöltjük a szobák adatait</p>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Szobák kártyák -->
        <div v-else class="row g-4">
          <div 
            v-for="room in filteredRooms" 
            :key="room.szoba_id" 
            class="col-12 col-md-6 col-lg-4"
          >
            <div class="card shadow-sm h-100">
              <div class="card-header border-0">
                <div class="d-flex justify-content-between align-items-center">
                  <div>
                    <h5 class="mb-0">{{ room.szoba_szama }}</h5>
                  </div>
                  <div>
                    <span class="badge" :class="getRoomStatusClass(room)">
                      {{ getRoomStatusText(room) }}
                    </span>
                  </div>
                </div>
              </div>
              <div class="card-body">
                <div class="row mb-3">
                  <div class="col-6">
                    <div class="d-flex align-items-center">
                      <i class="bi bi-people-fill text-primary me-2"></i>
                      <div>
                        <div class="fw-semibold">{{ room.osszes_hely }} fő</div>
                        <small style="color: var(--text-muted)">Férőhely</small>
                      </div>
                    </div>
                  </div>
                  <div class="col-6">
                    <div class="d-flex align-items-center">
                      <i class="bi bi-person-fill text-success me-2"></i>
                      <div>
                        <div class="fw-semibold">{{ room.currentOccupancy || 0 }} fő</div>
                        <small style="color: var(--text-muted)">Jelenlegi lakók</small>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div class="progress mb-3" style="height: 8px;">
                  <div class="progress-bar" 
                       :class="getTransferRoomProgressClass(room)"
                       :style="{ width: getOccupancyPercentage(room) + '%' }">
                  </div>
                </div>
                
                <div class="mb-3">
                  <div class="d-flex justify-content-between">
                    <small style="color: var(--text-muted)">Foglaltság: {{ getOccupancyPercentage(room) }}%</small>
                    <small style="color: var(--text-muted)">Szabad helyek: {{ room.osszes_hely - (room.currentOccupancy || 0) }}</small>
                  </div>
                </div>
                
                <div v-if="room.diakok && room.diakok.length > 0">
                  <h6 class="mb-2">Lakók:</h6>
                  <div class="list-group list-group-flush">
                    <div class="list-group-item d-flex justify-content-between align-items-center" 
                         v-for="student in room.diakok.slice(0, 3)" :key="student.diak_id">
                      <div class="d-flex align-items-center">
                        <div class="avatar rounded-circle d-flex align-items-center justify-content-center me-2" style="width: 24px; height: 24px;"
                             v-text="student.nev ? student.nev.charAt(0).toUpperCase() : ''">
                        </div>
                        <div>
                          <div class="fw-semibold" v-text="student.nev"></div>
                        </div>
                      </div>
                      <span class="badge" :class="student.aktiv ? 'status-active' : 'status-inactive'">
                        {{ student.aktiv ? 'Aktív' : 'Inaktív' }}
                      </span>
                    </div>
                    <div v-if="room.diakok.length > 3" class="list-group-item text-center" style="color: var(--text-muted)">
                      <small>+{{ room.diakok.length - 3 }} további lakó</small>
                    </div>
                  </div>
                </div>
                <div v-else>
                  <div class="alert alert-light border text-center mb-0">
                    <i class="bi bi-emoji-smile me-2" style="color: var(--text-muted)"></i>
                    <span style="color: var(--text-muted)">Nincs bent lakó</span>
                  </div>
                </div>
              </div>
              <div class="card-footer border-0">
                <div class="d-flex justify-content-between">
                  <button 
                    class="btn btn-outline-primary btn-sm" 
                    @click="viewRoomDetails(room)"
                    :disabled="loading"
                  >
                    <i class="bi bi-eye me-1"></i>Részletek
                  </button>
                  <div class="btn-group" role="group">
                    <button 
                      class="btn btn-outline-warning btn-sm" 
                      @click="editRoom(room)"
                      :disabled="loading"
                    >
                      <i class="bi bi-pencil me-1"></i>Szerkesztés
                    </button>
                    <button 
                      class="btn btn-outline-danger btn-sm" 
                      @click="deleteRoom(room)"
                      :disabled="loading"
                    >
                      <i class="bi bi-trash me-1"></i>Törlés
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Szoba felvétel modal -->
    <BaseModal
      v-model:show="showCreateModal"
      :title="'Szoba felvétele' + (isCreateFormDirty ? ' *' : '')"
      size="lg"
      @close="closeCreateModal"
    >
      <form @submit.prevent="createRoom" id="createRoomForm">
        <div class="mb-3">
          <BaseInput
            v-model="roomData.szoba_szama"
            label="Szobaszám"
            required
          />
        </div>
        <div class="mb-3">
          <BaseInput
            v-model="roomData.osszes_hely"
            label="Férőhely"
            type="number"
            min="1"
            max="10"
            required
          />
        </div>
      </form>
      
      <template #footer>
        <button type="button" class="btn btn-secondary" @click="showCreateModal = false">Mégse</button>
        <button type="submit" form="createRoomForm" class="btn btn-primary" :disabled="createLoading">
          {{ createLoading ? 'Mentés...' : 'Mentés' }}
        </button>
      </template>
    </BaseModal>
    
    <!-- Szoba szerkesztés modal -->
    <BaseModal
      v-model:show="showEditModal"
      :title="'Szoba szerkesztése' + (isEditFormDirty ? ' *' : '')"
      size="lg"
      @close="closeEditModal"
    >
      <form @submit.prevent="updateRoom" id="editRoomForm">
        <div class="mb-3">
          <BaseInput
            v-model="editRoomData.szoba_szama"
            label="Szobaszám"
            required
          />
        </div>
        <div class="mb-3">
          <BaseInput
            v-model="editRoomData.osszes_hely"
            label="Férőhely"
            type="number"
            min="1"
            max="10"
            required
          />
        </div>
      </form>
      
      <template #footer>
        <button type="button" class="btn btn-secondary" @click="showEditModal = false">Mégse</button>
        <button type="submit" form="editRoomForm" class="btn btn-primary" :disabled="updateLoading">
          {{ updateLoading ? 'Mentés...' : 'Mentés' }}
        </button>
      </template>
    </BaseModal>
    
    <!-- TÖMEGES BEKÖLTÖZTETÉS - 1. LÉPÉS: Szoba kiválasztása -->
    <BaseModal
      v-model:show="showBulkTransferModalStep1"
      title="Tömeges beköltöztetés - 1. lépés: Szoba kiválasztása"
      size="xl"
      @close="closeBulkTransferModal"
    >
      <div class="alert alert-info mb-3">
        <i class="bi bi-info-circle"></i>
        Válassza ki a szobát, ahová a diákokat költöztetni szeretné. 
        Csak a szabad hellyel rendelkező szobák jelennek meg.
      </div>
      
      <div v-if="availableRoomsForBulkTransfer.length === 0" class="alert alert-warning">
        <strong>Nincs elérhető szoba!</strong><br>
        Minden szoba tele van, vagy nincs elegendő szabad hely.
      </div>
      
      <div class="row" v-else>
        <div class="col-md-6 col-lg-4" v-for="room in availableRoomsForBulkTransfer" :key="room.szoba_id">
          <div class="card mb-3 room-card">
            <div class="card-header d-flex justify-content-between align-items-center">
              <h6 class="mb-0">{{ room.szoba_szama }}</h6>
              <div class="d-flex gap-1">
                <span class="badge" :class="getTransferRoomBadgeClass(room)">
                  {{ getTransferRoomBadgeText(room) }}
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
                     :class="getTransferRoomProgressClass(room)"
                     :style="{ width: getTransferRoomOccupancyPercentage(room) + '%' }"
                     :aria-valuenow="getTransferRoomOccupancyPercentage(room)" 
                     aria-valuemin="0" 
                     aria-valuemax="100">
                </div>
              </div>
              <button 
                class="btn btn-sm w-100 btn-outline-primary" 
                @click="selectRoomForBulkTransfer(room)">
                Kiválaszt
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <template #footer>
        <button type="button" class="btn btn-secondary" @click="closeBulkTransferModal">Mégse</button>
      </template>
    </BaseModal>

    <!-- TÖMEGES BEKÖLTÖZTETÉS - 2. LÉPÉS: Szoba megerősítése -->
    <BaseModal
      v-model:show="showBulkTransferModalStep2"
      title="Tömeges beköltöztetés - 2. lépés: Szoba megerősítése"
      size="md"
      @close="closeBulkTransferModal"
    >
      <div class="alert alert-info mb-3">
        Kérjük, erősítse meg a kiválasztott szobát:
      </div>
      
      <div class="card border-primary">
        <div class="card-header bg-primary text-white">
          <h5 class="mb-0">{{ selectedRoomForTransfer?.szoba_szama }}</h5>
        </div>
        <div class="card-body">
          <table class="table table-borderless table-sm">
            <tbody>
              <tr>
                <td><strong>Státusz:</strong></td>
                <td>
                  <span class="badge" :class="getTransferRoomBadgeClass(selectedRoomForTransfer)">
                    {{ getTransferRoomBadgeText(selectedRoomForTransfer) }}
                  </span>
                </td>
              </tr>
              <tr>
                <td><strong>Férőhely:</strong></td>
                <td>{{ selectedRoomForTransfer?.osszes_hely }} fő</td>
              </tr>
              <tr>
                <td><strong>Jelenlegi lakók:</strong></td>
                <td>{{ selectedRoomForTransfer?.currentOccupancy || 0 }} fő</td>
              </tr>
              <tr>
                <td><strong>Szabad helyek:</strong></td>
                <td class="text-success">
                  <strong>{{ (selectedRoomForTransfer?.osszes_hely || 0) - (selectedRoomForTransfer?.currentOccupancy || 0) }} fő</strong>
                </td>
              </tr>
            </tbody>
          </table>
          <div class="progress" style="height: 10px;">
            <div class="progress-bar" 
                 :class="getTransferRoomProgressClass(selectedRoomForTransfer)"
                 :style="{ width: getTransferRoomOccupancyPercentage(selectedRoomForTransfer) + '%' }">
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
      
      <template #footer>
        <button type="button" class="btn btn-secondary" @click="goBackToStep1">
          <i class="bi bi-arrow-left"></i> Vissza
        </button>
        <button type="button" class="btn btn-primary" @click="confirmRoomAndProceed">
          Tovább a diákok kiválasztásához
          <i class="bi bi-arrow-right"></i>
        </button>
      </template>
    </BaseModal>

    <!-- TÖMEGES BEKÖLTÖZTETÉS - 3. LÉPÉS: Diákok kiválasztása -->
    <BaseModal
      v-model:show="showBulkTransferModalStep3"
      title="Tömeges beköltöztetés - 3. lépés: Diákok kiválasztása"
      size="xl"
      @close="closeBulkTransferModal"
    >
      <!-- Beköltözés dátuma -->
      <div class="mb-3">
        <BaseInput
          v-model="bulkTransferData.bekoltozes_datum"
          label="Beköltözés / átköltöztetés dátuma"
          type="date"
          required
        />
      </div>

      <!-- Összesítő -->
      <div v-if="bulkTransferData.diak_ids.length > 0" class="alert alert-info mb-3">
        <div class="d-flex justify-content-between align-items-center">
          <div>
            <strong>Kiválasztott diákok:</strong> {{ bulkTransferData.diak_ids.length }} fő
            <br>
            <small>
              <span class="text-success">Új beköltöztetés: {{ selectedNewMoveIns.length }} fő</span> |
              <span class="text-warning">Átköltöztetés: {{ selectedTransfers.length }} fő</span>
            </small>
          </div>
          <div v-if="selectedTransfers.length > 0">
            <small style="color: var(--text-muted)">
              Az átköltöztetett diákok régi szobája automatikusan felszabadul.
            </small>
          </div>
        </div>
      </div>
      
      <div class="mb-3">
        <label class="form-label">Diákok kiválasztása</label>
        <div class="alert alert-light border mb-2">
          <small style="color: var(--text-muted)">
            <i class="bi bi-info-circle"></i>
            <strong>Útmutató:</strong>
            <span class="badge bg-success ms-1">Inaktív</span> = új beköltöztetés,
            <span class="badge bg-warning text-dark ms-1">Aktív</span> = átköltöztetés másik szobából
          </small>
        </div>
        <div v-if="selectedBulkGender" class="alert alert-info mb-2">
          <small>
            <strong>Kiválasztott nem:</strong> {{ selectedBulkGender === 'férfi' ? 'Férfi' : 'Nő' }} |
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
                    'table-secondary': !isStudentSelectable(student) && !bulkTransferData.diak_ids.includes(student.diak_id),
                    'table-success': bulkTransferData.diak_ids.includes(student.diak_id) && !student.aktiv,
                    'table-warning': bulkTransferData.diak_ids.includes(student.diak_id) && student.aktiv
                  }">
                <td class="text-center">
                  <input type="checkbox" 
                         class="form-check-input"
                         :value="student.diak_id" 
                         v-model="bulkTransferData.diak_ids"
                         :disabled="!isStudentSelectable(student) && !bulkTransferData.diak_ids.includes(student.diak_id)">
                </td>
                <td>
                  <strong v-text="student.nev"></strong>
                  <span v-if="bulkTransferData.diak_ids.includes(student.diak_id)" class="ms-2">
                    <span v-if="!student.aktiv" class="badge bg-success">Új beköltöztetés</span>
                    <span v-else class="badge bg-warning text-dark">Átköltöztetés</span>
                  </span>
                </td>
                <td>{{ student.email }}</td>
                <td>{{ student.nem === 'férfi' ? 'Férfi' : 'Nő' }}</td>
                <td>
                    <span class="badge" :class="student.aktiv ? 'bg-warning-subtle text-warning' : 'bg-success-subtle text-success'">
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
      
      <template #footer>
        <button type="button" class="btn btn-secondary" @click="goBackToStep2">
          <i class="bi bi-arrow-left"></i> Vissza
        </button>
        <button type="button" class="btn btn-primary" 
                :disabled="bulkTransferLoading || bulkTransferData.diak_ids.length === 0"
                @click="bulkTransfer">
          <span v-if="bulkTransferLoading">Feldolgozás...</span>
          <span v-else>
            {{ getTransferButtonText() }}
          </span>
        </button>
      </template>
    </BaseModal>
    
    <!-- Törlés megerősítő modal -->
    <BaseModal
      v-model:show="showDeleteModal"
      title="Szoba törlése"
      size="md"
      @close="showDeleteModal = false"
    >
      <p>Biztosan törölni szeretné a következő szobát?</p>
      <p><strong>{{ deleteRoomData?.szoba_szama }}</strong></p>
      <p class="text-warning">
        <small>
          Figyelem: A szoba törlése csak akkor lehetséges, ha nincs benne aktív diák.
        </small>
      </p>
      
      <template #footer>
        <button type="button" class="btn btn-secondary" @click="showDeleteModal = false">Mégse</button>
        <button type="button" class="btn btn-danger" @click="confirmDeleteRoom" :disabled="deleteLoading">
          {{ deleteLoading ? 'Törlés...' : 'Törlés' }}
        </button>
      </template>
    </BaseModal>
    
    <!-- Szoba részletek modal -->
    <BaseModal
      v-model:show="showDetailsModal"
      title="Szoba részletei"
      size="lg"
      @close="showDetailsModal = false"
    >
      <div v-if="detailsLoading" class="text-center">
        <div class="spinner-border" role="status">
          <span class="visually-hidden">Betöltés...</span>
        </div>
      </div>
      <div v-else>
        <div class="row mb-3">
          <div class="col-md-6">
            <p><strong>Szoba száma:</strong> {{ selectedRoomDetails?.szoba_szama }}</p>
          </div>
          <div class="col-md-6">
            <p><strong>Férőhely:</strong> {{ selectedRoomDetails?.osszes_hely }} fő</p>
          </div>
        </div>
        <div class="row mb-3">
          <div class="col-md-6">
            <p><strong>Jelenlegi lakók:</strong> {{ selectedRoomDetails?.currentOccupancy || 0 }} fő</p>
          </div>
          <div class="col-md-6">
            <p><strong>Szabad helyek:</strong> {{ (selectedRoomDetails?.osszes_hely || 0) - (selectedRoomDetails?.currentOccupancy || 0) }} fő</p>
          </div>
        </div>
        
        <h6 class="mb-3">Bent lakó diákok:</h6>
        <div v-if="selectedRoomDetails?.diakok && selectedRoomDetails.diakok.length > 0">
          <div class="table-responsive">
            <table class="table table-striped">
              <thead>
                <tr>
                  <th>Név</th>
                  <th>Email</th>
                  <th>Telefon</th>
                  <th>Beköltözés dátuma</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="student in selectedRoomDetails.diakok" :key="student.diak_id">
                  <td v-text="student.nev"></td>
                  <td v-text="student.email || '-'"></td>
                  <td v-text="student.telefon || '-'"></td>
                  <td>{{ formatDate(student.bekoltozes_datum) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        <div v-else class="alert alert-info">
          Nincs bent lakó ebben a szobában.
        </div>
      </div>
      
      <template #footer>
        <button type="button" class="btn btn-secondary" @click="showDetailsModal = false">Bezárás</button>
      </template>
    </BaseModal>
  </div>
</template>

<script>
import { ref, onMounted, computed, defineAsyncComponent } from 'vue'
import { useAuthStore } from '../store/auth'
import { useToastStore } from '../store/toast'
import api from '../services/api'
import { debounce } from 'lodash-es'
import { getSuccessMessage, getErrorMessage, ROOM_MESSAGES, DIRTY_FORM_MESSAGES } from '@/i18n'
import { handleError, handleSuccess } from '@/services/errorHandler'
import { useApiCancel } from '../composables/useApiCancel'
import { useDirtyForm } from '../composables/useDirtyForm'
import { toast } from 'vue3-toastify'

// Lazy load heavy components
const BaseInput = defineAsyncComponent(() => import('../components/forms/BaseInput.vue'))
const BaseModal = defineAsyncComponent(() => import('../components/BaseModal.vue'))
const LoadingOverlay = defineAsyncComponent(() => import('../components/LoadingOverlay.vue'))

export default {
  name: 'RoomsView',
  components: {
    LoadingOverlay,
    BaseInput,
    BaseModal
  },
  setup() {
    const { createAbortController, isAbortError } = useApiCancel()
    const rooms = ref([])
    const loading = ref(false)
    const searchQuery = ref('')
    const selectedCapacity = ref('')
    const selectedStatus = ref('')
    const showCreateModal = ref(false)
    const showEditModal = ref(false)
    const showDeleteModal = ref(false)
    const showBulkTransferModal = ref(false)
    const showDetailsModal = ref(false)
    const createLoading = ref(false)
    const updateLoading = ref(false)
    const deleteLoading = ref(false)
    const bulkTransferLoading = ref(false)
    const detailsLoading = ref(false)
    
    const selectedRoomDetails = ref(null)
    
    const roomData = ref({
      szoba_szama: '',
      osszes_hely: 2
    })
    
    const editRoomData = ref({
      szoba_szama: '',
      osszes_hely: 2
    })
    
    const deleteRoomData = ref(null)
    const currentEditRoomId = ref(null)
    
    // Tömeges beköltöztetés állapotok
    const bulkTransferStep = ref(1) // 1: szoba választás, 2: megerősítés, 3: diákok választása
    const selectedRoomForTransfer = ref(null)
    const availableRoomsForBulkTransfer = ref([])
    const roomGenders = ref({}) // Szobák nemeinek tárolása
    
    const bulkTransferData = ref({
      szoba_id: '',
      bekoltozes_datum: new Date().toISOString().split('T')[0],
      diak_ids: []
    })
    
    const availableRooms = ref([])
    const availableStudents = ref([])
    
    // Tömeges beköltöztetéshez - kiválasztott diákok neme
    const selectedBulkGender = computed(() => {
      if (bulkTransferData.value.diak_ids.length === 0) return null
      const firstSelectedId = bulkTransferData.value.diak_ids[0]
      const firstSelected = availableStudents.value.find(s => s.diak_id === firstSelectedId)
      return firstSelected?.nem || null
    })

    // Kiválasztott új beköltöztetések (inaktív diákok)
    const selectedNewMoveIns = computed(() => {
      return availableStudents.value.filter(s => 
        bulkTransferData.value.diak_ids.includes(s.diak_id) && !s.aktiv
      )
    })

    // Kiválasztott átköltöztetések (aktív diákok)
    const selectedTransfers = computed(() => {
      return availableStudents.value.filter(s => 
        bulkTransferData.value.diak_ids.includes(s.diak_id) && s.aktiv
      )
    })
    
    // Segédfüggvény: Ellenőrzi, hogy egy diák kiválasztható-e
    const isStudentSelectable = (student) => {
      const selectedGender = selectedBulkGender.value
      if (!selectedGender) return true // Ha nincs kiválasztva senki, mindenki választható
      return student.nem === selectedGender
    }

    // Gomb szövegének meghatározása
    const getTransferButtonText = () => {
      const newCount = selectedNewMoveIns.value.length
      const transferCount = selectedTransfers.value.length
      
      if (newCount > 0 && transferCount > 0) {
        return `${newCount} beköltöztetés + ${transferCount} átköltöztetés`
      } else if (transferCount > 0) {
        return `${transferCount} diák átköltöztetése`
      } else {
        return `${newCount} diák beköltöztetése`
      }
    }

    // Refs for bulk transfer modals
    const showBulkTransferModalStep1 = ref(false)
    const showBulkTransferModalStep2 = ref(false)
    const showBulkTransferModalStep3 = ref(false)
    
    const authStore = useAuthStore()

    // Dirty form tracking for create form
    const {
      isDirty: isCreateFormDirty,
      resetForm: resetCreateFormToInitial,
      markAsClean: markCreateFormAsClean
    } = useDirtyForm(roomData, {
      enableNavigationGuard: false,
      confirmMessage: DIRTY_FORM_MESSAGES.CONFIRM_DISCARD
    })

    // Dirty form tracking for edit form
    const {
      isDirty: isEditFormDirty,
      resetForm: resetEditFormToInitial,
      markAsClean: markEditFormAsClean
    } = useDirtyForm(editRoomData, {
      enableNavigationGuard: false,
      confirmMessage: DIRTY_FORM_MESSAGES.CONFIRM_DISCARD
    })

    // Modal close handlers with dirty check
    const closeCreateModal = () => {
      if (isCreateFormDirty.value) {
        const shouldClose = window.confirm(DIRTY_FORM_MESSAGES.CONFIRM_DISCARD)
        if (!shouldClose) return
      }
      showCreateModal.value = false
      resetCreateForm()
    }

    const closeEditModal = () => {
      if (isEditFormDirty.value) {
        const shouldClose = window.confirm(DIRTY_FORM_MESSAGES.CONFIRM_DISCARD)
        if (!shouldClose) return
      }
      showEditModal.value = false
      currentEditRoomId.value = null
    }

    const fetchRooms = async () => {
      loading.value = true
      const { signal } = createAbortController()
      try {
        const response = await api.get('/rooms', { signal })
        if (response.data.success) {
          rooms.value = response.data.data
          // Fetch occupancy for each room
          await Promise.all(rooms.value.map(room => fetchRoomOccupancy(room.szoba_id)))
        }
      } catch (error) {
        if (isAbortError(error)) return
        handleError(error, { context: 'RoomsView/fetchRooms' })
      } finally {
        loading.value = false
      }
    }

    const fetchRoomOccupancy = async (roomId) => {
      const { signal } = createAbortController()
      try {
        const response = await api.get(`/rooms/${roomId}/occupancy`, { signal })
        if (response.data.success) {
          const room = rooms.value.find(r => r.szoba_id === roomId)
          if (room) {
            room.currentOccupancy = response.data.data.currentOccupancy
            room.diakok = response.data.data.students || []
          }
        }
      } catch (error) {
        if (isAbortError(error)) return
        console.error('Hiba a szoba elfoglaltságának lekérése közben:', error)
      }
    }

    const fetchAvailableRooms = async () => {
      const { signal } = createAbortController()
      try {
        const response = await api.get('/rooms/available', { signal })
        if (response.data.success) {
          availableRooms.value = response.data.data
        }
      } catch (error) {
        if (isAbortError(error)) return
        console.error('Hiba az elérhető szobák lekérése közben:', error)
      }
    }

    const fetchAvailableStudents = async () => {
      const { signal } = createAbortController()
      try {
        const response = await api.get('/students', { signal })
        if (response.data.success) {
          // Minden diák megjelenítése (aktív és inaktív is)
          availableStudents.value = response.data.data
        }
      } catch (error) {
        if (isAbortError(error)) return
        console.error('Hiba a diákok lekérése közben:', error)
      }
    }

    // Tömeges beköltöztetés megnyitása - szobák betöltése
    const openBulkTransferModal = async () => {
      showBulkTransferModal.value = true
      showBulkTransferModalStep1.value = true
      showBulkTransferModalStep2.value = false
      showBulkTransferModalStep3.value = false
      bulkTransferStep.value = 1
      selectedRoomForTransfer.value = null
      bulkTransferData.value = {
        szoba_id: '',
        bekoltozes_datum: new Date().toISOString().split('T')[0],
        diak_ids: []
      }
      
      await fetchRoomsWithDetailsForTransfer()
    }

    // Szobák betöltése részletes információkkal
    const fetchRoomsWithDetailsForTransfer = async () => {
      const { signal: mainSignal } = createAbortController()
      try {
        // Szobák lekérdezése
        const response = await api.get('/rooms', { signal: mainSignal })
        if (response.data.success) {
          const roomsData = response.data.data
          
          // Párhuzamos elfoglaltság és lakók lekérdezése
          const roomDetailPromises = roomsData.map(async (room) => {
            await Promise.allSettled([
              // Elfoglaltság lekérdezése
              (async () => {
                const { signal } = createAbortController()
                try {
                  const occupancyResponse = await api.get(`/rooms/${room.szoba_id}/occupancy`, { signal })
                  if (occupancyResponse.data.success) {
                    room.currentOccupancy = occupancyResponse.data.data.currentOccupancy
                  }
                } catch (error) {
                  if (isAbortError(error)) return
                  console.error(`Hiba a szoba ${room.szoba_id} elfoglaltságának lekérése közben:`, error)
                  room.currentOccupancy = 0
                }
              })(),
              // Lakók lekérdezése a szoba neme miatt
              (async () => {
                const { signal } = createAbortController()
                try {
                  const studentsResponse = await api.get(`/rooms/${room.szoba_id}/occupants`, { signal })
                  if (studentsResponse.data.success && studentsResponse.data.data.length > 0) {
                    // Az első lakó neme határozza meg a szoba nemét
                    const firstResident = studentsResponse.data.data[0]
                    const gender = firstResident.diak?.nem || firstResident.nem
                    if (gender) {
                      roomGenders.value[room.szoba_id] = gender
                    }
                  } else {
                    roomGenders.value[room.szoba_id] = null // Üres szoba, nincs neme
                  }
                } catch (error) {
                  if (isAbortError(error)) return
                  console.error(`Hiba a szoba ${room.szoba_id} lakóinak lekérése közben:`, error)
                  roomGenders.value[room.szoba_id] = null
                }
              })()
            ])
          })
          
          // Minden hívás párhuzamosan
          await Promise.allSettled(roomDetailPromises)
          
          // Csak a szabad hellyel rendelkező szobák megjelenítése
          availableRoomsForBulkTransfer.value = roomsData.filter(room => {
            const occupancy = room.currentOccupancy || 0
            return occupancy < room.osszes_hely
          })
        }
      } catch (error) {
        if (isAbortError(error)) return
        console.error('Hiba a szobák lekérése közben:', error)
        toast.error('Hiba történt a szobák betöltése közben')
      }
    }

    // Szoba kiválasztása tömeges beköltöztetéshez
    const selectRoomForBulkTransfer = (room) => {
      selectedRoomForTransfer.value = room
      bulkTransferData.value.szoba_id = room.szoba_id
      bulkTransferStep.value = 2
      showBulkTransferModalStep1.value = false
      showBulkTransferModalStep2.value = true
      showBulkTransferModalStep3.value = false
    }

    // Szoba megerősítése és továbblépés
    const confirmRoomAndProceed = () => {
      bulkTransferStep.value = 3
      showBulkTransferModalStep1.value = false
      showBulkTransferModalStep2.value = false
      showBulkTransferModalStep3.value = true
    }

    // Visszalépés az 1. lépéshez
    const goBackToStep1 = () => {
      bulkTransferStep.value = 1
      showBulkTransferModalStep1.value = true
      showBulkTransferModalStep2.value = false
      showBulkTransferModalStep3.value = false
    }

    // Visszalépés a 2. lépéshez
    const goBackToStep2 = () => {
      bulkTransferStep.value = 2
      showBulkTransferModalStep1.value = false
      showBulkTransferModalStep2.value = true
      showBulkTransferModalStep3.value = false
    }

    // Tömeges beköltöztetés modal bezárása
    const closeBulkTransferModal = () => {
      showBulkTransferModal.value = false
      showBulkTransferModalStep1.value = false
      showBulkTransferModalStep2.value = false
      showBulkTransferModalStep3.value = false
      bulkTransferStep.value = 1
      selectedRoomForTransfer.value = null
      bulkTransferData.value = {
        szoba_id: '',
        bekoltozes_datum: new Date().toISOString().split('T')[0],
        diak_ids: []
      }
    }

    const availableRoomsCount = computed(() => {
      return rooms.value.filter(room => {
        const occupancy = room.currentOccupancy || 0
        const capacity = room.osszes_hely
        return occupancy < capacity
      }).length
    })

    const filteredRooms = computed(() => {
      let result = rooms.value
      
      // Filter by search query (room number)
      if (searchQuery.value) {
        const query = searchQuery.value.toLowerCase()
        result = result.filter(room => 
          room.szoba_szama.toLowerCase().includes(query)
        )
      }
      
      // Filter by capacity
      if (selectedCapacity.value) {
        result = result.filter(room => room.osszes_hely.toString() === selectedCapacity.value)
      }
      
      // Filter by status
      if (selectedStatus.value) {
        result = result.filter(room => {
          const occupancy = room.currentOccupancy || 0
          const capacity = room.osszes_hely
          
          if (selectedStatus.value === 'empty') {
            return occupancy === 0
          } else if (selectedStatus.value === 'available') {
            return occupancy > 0 && occupancy < capacity
          } else if (selectedStatus.value === 'full') {
            return occupancy === capacity
          }
          return true
        })
      }
      
      return result
    })

    const getOccupancyPercentage = (room) => {
      if (!room.osszes_hely) return 0
      const current = room.currentOccupancy || 0
      return Math.round((current / room.osszes_hely) * 100)
    }

    const getRoomStatusClass = (room) => {
      const occupancy = room.currentOccupancy || 0
      const capacity = room.osszes_hely
      
      if (occupancy === 0) return 'bg-info'
      if (occupancy === capacity) return 'bg-danger'
      if (occupancy >= capacity * 0.8) return 'bg-warning'
      return 'bg-primary'
    }

    const getRoomStatusText = (room) => {
      const occupancy = room.currentOccupancy || 0
      const capacity = room.osszes_hely
      
      if (occupancy === 0) return 'Üres'
      if (occupancy === capacity) return 'Tele'
      if (occupancy >= capacity * 0.8) return 'Majdnem tele'
      return 'Elérhető'
    }

    // Szoba kártya segédfüggvények
    const getTransferRoomOccupancyPercentage = (room) => {
      if (!room?.osszes_hely) return 0
      const current = room.currentOccupancy || 0
      return Math.round((current / room.osszes_hely) * 100)
    }

    const getTransferRoomBadgeClass = (room) => {
      if (!room) return 'bg-secondary'
      const occupancy = room.currentOccupancy || 0
      const capacity = room.osszes_hely
      
      if (occupancy === 0) return 'bg-secondary'
      if (occupancy === capacity) return 'bg-danger'
      if (occupancy >= capacity * 0.8) return 'bg-warning'
      return 'bg-success'
    }

    const getTransferRoomBadgeText = (room) => {
      if (!room) return '-'
      const occupancy = room.currentOccupancy || 0
      const capacity = room.osszes_hely
      
      if (occupancy === 0) return 'Üres'
      if (occupancy === capacity) return 'Tele'
      if (occupancy >= capacity * 0.8) return 'Majdnem tele'
      return 'Elérhető'
    }

    const getTransferRoomProgressClass = (room) => {
      const percentage = getTransferRoomOccupancyPercentage(room)
      
      if (percentage < 50) return 'bg-success'
      if (percentage < 80) return 'bg-info'
      if (percentage < 100) return 'bg-warning'
      return 'bg-danger'
    }

    const getRoomGenderText = (room) => {
      if (!room) return '-'
      const gender = roomGenders.value[room.szoba_id]
      if (!gender) return 'Üres szoba'
      return gender === 'férfi' ? 'Fiú szoba' : 'Lány szoba'
    }

    const createRoom = async () => {
      createLoading.value = true
      try {
        const response = await api.post('/rooms', roomData.value)
        if (response.data.success) {
          showCreateModal.value = false
          resetCreateForm()
          markCreateFormAsClean()
          fetchRooms()
          handleSuccess('Szoba sikeresen felvéve')
        }
      } catch (error) {
        handleError(error, { context: 'RoomsView/createRoom' })
      } finally {
        createLoading.value = false
      }
    }

    const editRoom = (room) => {
      currentEditRoomId.value = room.szoba_id
      editRoomData.value = {
        szoba_szama: room.szoba_szama,
        osszes_hely: room.osszes_hely
      }
      showEditModal.value = true
    }

    const updateRoom = async () => {
      updateLoading.value = true
      try {
        const response = await api.put(`/rooms/${currentEditRoomId.value}`, editRoomData.value)
        if (response.data.success) {
          showEditModal.value = false
          markEditFormAsClean()
          fetchRooms()
          handleSuccess('Szoba adatai sikeresen módosítva')
        }
      } catch (error) {
        handleError(error, { context: 'RoomsView/updateRoom' })
      } finally {
        updateLoading.value = false
      }
    }

    const deleteRoom = (room) => {
      deleteRoomData.value = room
      showDeleteModal.value = true
    }

    const confirmDeleteRoom = async () => {
      deleteLoading.value = true
      try {
        const response = await api.delete(`/rooms/${deleteRoomData.value.szoba_id}`)
        if (response.data.success) {
          showDeleteModal.value = false
          fetchRooms()
          toast.success('Szoba sikeresen törölve')
        } else {
          // Hiba a válaszban
          const errorMsg = response.data.error || response.data.message || 'Ismeretlen hiba történt'
          toast.error(errorMsg)
        }
      } catch (error) {
        console.error('Hiba a szoba törlése közben:', error)
        const errorMsg = error.response?.data?.error || error.response?.data?.message || 'Hiba történt a szoba törlése közben'
        toast.error(errorMsg)
      } finally {
        deleteLoading.value = false
      }
    }

    const viewRoomDetails = async (room) => {
      detailsLoading.value = true
      showDetailsModal.value = true
      
      // Reaktív objektum létrehozása
      selectedRoomDetails.value = {
        szoba_szama: room.szoba_szama,
        osszes_hely: room.osszes_hely,
        currentOccupancy: room.currentOccupancy || 0,
        diakok: []
      }
      
      try {
        const response = await api.get(`/rooms/${room.szoba_id}/occupancy`)
        console.log('API válasz:', response.data)
        if (response.data.success) {
          const data = response.data.data
          console.log('Students adatok:', data.students)
          // Objektum tulajdonságainak közvetlen módosítása a reaktivitás megőrzéséhez
          selectedRoomDetails.value.currentOccupancy = data.currentOccupancy
          selectedRoomDetails.value.diakok = data.students || []
        }
      } catch (error) {
        console.error('Hiba a szoba részleteinek lekérése közben:', error)
        toast.error('Hiba történt a szoba részleteinek betöltése közben')
      } finally {
        detailsLoading.value = false
      }
    }

    const formatDate = (dateString) => {
      if (!dateString) return '-'
      const date = new Date(dateString)
      return date.toLocaleDateString('hu-HU', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    }

    const viewStudent = (student) => {
      console.log('Diák megtekintése:', student)
      toast.info(`Diák megtekintése: ${student.nev}`)
    }

    const transferStudent = async (student) => {
      try {
        // Get available rooms for transfer
        const response = await api.get('/rooms/available')
        if (response.data.success) {
          const availableRooms = response.data.data
          const currentRoom = rooms.value.find(r => r.szoba_id === student.szoba?.szoba_id)
          
          // Filter out current room and check capacity
          const transferableRooms = availableRooms.filter(room => 
            room.szoba_id !== currentRoom?.szoba_id
          )
          
          if (transferableRooms.length === 0) {
            toast.error(ROOM_MESSAGES.NO_AVAILABLE_ROOMS_FOR_TRANSFER)
            return
          }
          
          // For now, just show a success message
          toast.success(`Diák áthelyezése: ${student.nev}`)
          console.log('Diák áthelyezése:', student)
        }
      } catch (error) {
        console.error('Hiba a diák áthelyezése közben:', error)
        toast.error('Hiba történt a diák áthelyezése közben')
      }
    }

    const moveOutStudent = (student) => {
      console.log('Diák kiköltöztetése:', student)
      toast.info(`Diák kiköltöztetése: ${student.nev}`)
    }

    const bulkTransfer = async () => {
      bulkTransferLoading.value = true
      try {
        const response = await api.post('/rooms/bulk-bekoltozes', bulkTransferData.value)
        if (response.data.success) {
          const data = response.data.data
          closeBulkTransferModal()
          fetchRooms()
          
          // Részletes visszajelzés
          const newCount = data.new_move_ins || 0
          const transferCount = data.transfer_count || 0
          
          if (newCount > 0 && transferCount > 0) {
            toast.success(`${newCount} új beköltöztetés és ${transferCount} átköltöztetés sikeres!`)
          } else if (transferCount > 0) {
            toast.success(`${transferCount} diák sikeresen átköltöztetve!`)
          } else {
            toast.success(`${newCount} diák sikeresen beköltöztetve!`)
          }
        }
      } catch (error) {
        console.error('Hiba a tömeges beköltöztetés közben:', error)
        const errorMsg = error.response?.data?.error || 'Hiba történt a tömeges beköltöztetés közben'
        toast.error(errorMsg)
      } finally {
        bulkTransferLoading.value = false
      }
    }

    const resetCreateForm = () => {
      roomData.value = {
        szoba_szama: '',
        osszes_hely: 2
      }
    }

    // Debounced search function
    const debouncedSearch = debounce(async () => {
      if (searchQuery.value.trim()) {
        try {
        const response = await api.get('/rooms', {
            params: {
              prefix: searchQuery.value
            }
          })
          if (response.data.success) {
            rooms.value = response.data.data
            // Fetch occupancy for each room
            await Promise.all(rooms.value.map(room => fetchRoomOccupancy(room.szoba_id)))
          }
        } catch (error) {
          console.error('Hiba a szoba keresése közben:', error)
        }
      } else {
        // If search is empty, fetch all rooms
        fetchRooms()
      }
    }, 300)

    // Clear all filters
    const clearFilters = () => {
      searchQuery.value = ''
      selectedCapacity.value = ''
      selectedStatus.value = ''
    }

    onMounted(() => {
      fetchRooms()
      fetchAvailableRooms()
      fetchAvailableStudents()
    })

    return {
      rooms,
      loading,
      searchQuery,
      selectedCapacity,
      selectedStatus,
      showCreateModal,
      showEditModal,
      showDeleteModal,
      showBulkTransferModal,
      showDetailsModal,
      createLoading,
      updateLoading,
      deleteLoading,
      bulkTransferLoading,
      detailsLoading,
      roomData,
      editRoomData,
      deleteRoomData,
      bulkTransferData,
      selectedRoomDetails,
      availableRooms,
      availableStudents,
      filteredRooms,
      availableRoomsCount,
      selectedBulkGender,
      selectedNewMoveIns,
      selectedTransfers,
      isStudentSelectable,
      getTransferButtonText,
      // Tömeges beköltöztetés
      bulkTransferStep,
      selectedRoomForTransfer,
      availableRoomsForBulkTransfer,
      openBulkTransferModal,
      closeBulkTransferModal,
      selectRoomForBulkTransfer,
      confirmRoomAndProceed,
      // Computed properties for bulk transfer modals
      showBulkTransferModalStep1,
      showBulkTransferModalStep2,
      showBulkTransferModalStep3,
      // Dirty form tracking
      isCreateFormDirty,
      isEditFormDirty,
      closeCreateModal,
      closeEditModal,
      // Szoba kártya függvények
      getTransferRoomOccupancyPercentage,
      getTransferRoomBadgeClass,
      getTransferRoomBadgeText,
      getTransferRoomProgressClass,
      getRoomGenderText,
      fetchRooms,
      createRoom,
      editRoom,
      updateRoom,
      deleteRoom,
      confirmDeleteRoom,
      viewRoomDetails,
      viewStudent,
      transferStudent,
      moveOutStudent,
      bulkTransfer,
      resetCreateForm,
      debouncedSearch,
      getOccupancyPercentage,
      getRoomStatusClass,
      getRoomStatusText,
      clearFilters,
      formatDate
    }
  }
}
</script>

<style scoped>
/* Virtual Scroller Styles */
.rooms-container {
  height: 600px;
  overflow: hidden;
}

.scroller {
  height: 100%;
}

.room-card-wrapper {
  padding: 8px 12px;
  height: 280px;
}

.room-card-wrapper .card {
  height: 100%;
}

.room-card-wrapper .card:hover {
  transform: translateY(-2px);
}

/* Avatar styles */
.avatar {
  background: linear-gradient(135deg, var(--primary-500), var(--primary-600));
  color: white;
  font-size: 10px;
  font-weight: bold;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .rooms-container {
    height: 500px;
  }
  
  .room-card-wrapper {
    padding: 6px 8px;
    height: 260px;
  }
}

/* Dark mode support */
[data-theme="dark"] .room-card-wrapper .card {
  background: var(--bg-card, #2d3748);
  border-color: var(--border-dark, #4a5568);
}

[data-theme="dark"] .room-card-wrapper .card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}
</style>
