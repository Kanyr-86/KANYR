<template>
  <div class="container-fluid">
    <div class="row">
      <div class="col-12">
        <div class="d-flex justify-content-between align-items-center mb-3">
          <h2>Diákok kezelése</h2>
          <button class="btn btn-primary" @click="openEnrollModal">
            Diák felvétele
          </button>
        </div>
        
        <div class="card">
          <div class="card-body">
            <div class="row mb-3 g-2">
              <div class="col-12 col-md-6">
                <input 
                  type="text" 
                  class="form-control" 
                  placeholder="Keresés név, email vagy szoba alapján..."
                  v-model="searchQuery"
                >
              </div>
              <div class="col-12 col-sm-6 col-md-4">
                <select class="form-select" v-model="selectedStatus">
                  <option value="">Összes státusz</option>
                  <option value="true">Aktív</option>
                  <option value="false">Inaktív</option>
                </select>
              </div>
              <div class="col-12 col-sm-6 col-md-2">
                <button class="btn btn-outline-secondary w-100" @click="clearFilters">
                  Szűrők törlése
                </button>
              </div>
            </div>
            
            <div class="table-responsive">
              <table class="table table-striped">
                <thead>
                  <tr>
                    <th>Név</th>
                    <th class="d-none d-md-table-cell">Email</th>
                    <th class="d-none d-lg-table-cell">Telefonszám</th>
                    <th>Szoba</th>
                    <th>Státusz</th>
                    <th>Műveletek</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="student in filteredStudents" :key="student.diak_id">
                    <td>{{ student.nev }}</td>
                    <td class="d-none d-md-table-cell">{{ student.email }}</td>
                    <td class="d-none d-lg-table-cell">{{ student.telefonszam }}</td>
                    <td>{{ student.szoba ? student.szoba.szoba_szama : 'Nincs' }}</td>
                    <td>
                      <span class="badge" :class="student.aktiv ? 'bg-success' : 'bg-danger'">
                        {{ student.aktiv ? 'Aktív' : 'Inaktív' }}
                      </span>
                    </td>
                    <td>
                      <div class="btn-group" role="group">
                        <button 
                          class="btn btn-sm btn-outline-primary" 
                          @click="viewStudent(student)"
                          title="Megtekintés"
                        >
                          <span class="d-none d-xl-inline">Megtekintés</span>
                          <span class="d-xl-none">👁</span>
                        </button>
                        <button 
                          class="btn btn-sm btn-outline-warning" 
                          @click="editStudent(student)"
                          title="Szerkesztés"
                        >
                          <span class="d-none d-xl-inline">Szerkesztés</span>
                          <span class="d-xl-none">✏</span>
                        </button>
                        <button 
                          class="btn btn-sm btn-outline-info" 
                          @click="transferStudent(student)"
                          title="Áthelyezés"
                        >
                          <span class="d-none d-xl-inline">Áthelyezés</span>
                          <span class="d-xl-none">↻</span>
                        </button>
                        <button 
                          class="btn btn-sm btn-outline-danger" 
                          @click="deleteStudent(student)"
                          title="Törlés"
                        >
                          <span class="d-none d-xl-inline">Törlés</span>
                          <span class="d-xl-none">🗑</span>
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
    
    <!-- Diák felvétel modal -->
    <div class="modal fade" tabindex="-1" ref="enrollModalRef">
      <div class="modal-dialog modal-lg">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Diák felvétele</h5>
            <button type="button" class="btn-close" @click="closeEnrollModal"></button>
          </div>
          <div class="modal-body">
            <form @submit.prevent="enrollStudent">
              <div class="row">
                <div class="col-md-6">
                  <h6>Diák adatai</h6>
                  <div class="mb-3">
                    <label class="form-label">Név</label>
                    <input type="text" class="form-control" v-model="enrollData.diakData.nev" required>
                  </div>
                  <div class="mb-3">
                    <label class="form-label">Email</label>
                    <input type="email" class="form-control" v-model="enrollData.diakData.email" required>
                  </div>
                  <div class="mb-3">
                    <label class="form-label">Telefonszám</label>
                    <input type="tel" class="form-control" v-model="enrollData.diakData.telefonszam" required>
                  </div>
                  <div class="mb-3">
                    <label class="form-label">Születési dátum</label>
                    <input type="date" class="form-control" v-model="enrollData.diakData.szuletesi_datum" required>
                  </div>
                  <div class="mb-3">
                    <label class="form-label">Személyi igazolvány szám</label>
                    <input type="text" class="form-control" v-model="enrollData.diakData.szemelyi_igazolvany_szam" required>
                  </div>
                  <div class="mb-3">
                    <label class="form-label">TAJ szám</label>
                    <input type="text" class="form-control" v-model="enrollData.diakData.taj_szam" required>
                  </div>
                  <div class="mb-3">
                    <label class="form-label">Diákigazolvány szám</label>
                    <input type="text" class="form-control" v-model="enrollData.diakData.diakigazolvany_szam" required>
                  </div>
                  <div class="mb-3">
                    <label class="form-label">Kapcsolat típusa</label>
                    <select class="form-select" v-model="enrollData.diakData.kapcsolat_tipusa" required>
                      <option value="anya">Anya</option>
                      <option value="apa">Apa</option>
                      <option value="gondviselo">Gondviselő</option>
                    </select>
                  </div>
                </div>
                <div class="col-md-6">
                  <h6>Szülő adatai</h6>
                  
                  <!-- Szülő mód választó -->
                  <div class="mb-3">
                    <label class="form-label">Szülő kiválasztása</label>
                    <select class="form-select" v-model="parentSelectionMode">
                      <option value="new">Új szülő felvétele</option>
                      <option value="existing">Meglévő szülő kiválasztása</option>
                    </select>
                  </div>
                  
                  <!-- Meglévő szülő kiválasztása -->
                  <div v-if="parentSelectionMode === 'existing'" class="mb-3">
                    <label class="form-label">Szülő</label>
                    <select class="form-select" v-model="selectedParentId" @change="onParentSelected" required>
                      <option value="">Válasszon szülőt</option>
                      <option v-for="parent in parents" :key="parent.szulo_id" :value="parent.szulo_id">
                        {{ parent.nev }} ({{ parent.email }})
                      </option>
                    </select>
                  </div>
                  
                  <!-- Új szülő adatai - csak new módban látható -->
                  <div v-if="parentSelectionMode === 'new'">
                    <div class="mb-3">
                      <label class="form-label">Név</label>
                      <input type="text" class="form-control" v-model="enrollData.szuloData.nev" required>
                    </div>
                    <div class="mb-3">
                      <label class="form-label">Email</label>
                      <input type="email" class="form-control" v-model="enrollData.szuloData.email" required>
                    </div>
                    <div class="mb-3">
                      <label class="form-label">Telefonszám</label>
                      <input type="tel" class="form-control" v-model="enrollData.szuloData.telefonszam" required>
                    </div>
                    <div class="mb-3">
                      <label class="form-label">Személyi igazolvány szám</label>
                      <input type="text" class="form-control" v-model="enrollData.szuloData.szemelyi_igazolvany_szam" required>
                    </div>
                  </div>
                  
                  <h6>Lakcím adatai</h6>
                  
                  <!-- Lakcím mód választó -->
                  <div class="mb-3">
                    <label class="form-label">Lakcím kiválasztása</label>
                    <select class="form-select" v-model="addressSelectionMode">
                      <option value="new">Új lakcím felvétele</option>
                      <option value="existing">Meglévő lakcím kiválasztása</option>
                    </select>
                  </div>
                  
                  <!-- Meglévő lakcím kiválasztása -->
                  <div v-if="addressSelectionMode === 'existing'" class="mb-3">
                    <label class="form-label">Lakcím</label>
                    <select class="form-select" v-model="selectedAddressId" @change="onAddressSelected" required>
                      <option value="">Válasszon lakcímet</option>
                      <option v-for="address in addresses" :key="address.lakcim_id" :value="address.lakcim_id">
                        {{ address.iranyitoszam }} {{ address.varos }}, {{ address.utca_hazszam }}
                      </option>
                    </select>
                  </div>
                  
                  <!-- Lakcím adatok - csak new módban látható -->
                  <div v-if="addressSelectionMode === 'new'">
                    <div class="mb-3">
                      <label class="form-label">Ország</label>
                      <input type="text" class="form-control" v-model="enrollData.lakcimData.orszag" required>
                    </div>
                    <div class="mb-3">
                      <label class="form-label">Irányítószám</label>
                      <input type="text" class="form-control" v-model="enrollData.lakcimData.iranyitoszam" required>
                    </div>
                    <div class="mb-3">
                      <label class="form-label">Város</label>
                      <input type="text" class="form-control" v-model="enrollData.lakcimData.varos" required>
                    </div>
                    <div class="mb-3">
                      <label class="form-label">Utca, házszám</label>
                      <input type="text" class="form-control" v-model="enrollData.lakcimData.utca_hazszam" required>
                    </div>
                  </div>
                  
                  <div class="mb-3">
                    <label class="form-label">Szoba</label>
                    <select class="form-select" v-model="enrollData.szoba_id" required>
                      <option value="">Válasszon szobát</option>
                      <option v-for="room in rooms" :key="room.szoba_id" :value="room.szoba_id">
                        {{ room.szoba_szama }} ({{ room.osszes_hely }} fő)
                      </option>
                    </select>
                  </div>
                </div>
              </div>
              
              <div class="modal-footer">
                <button type="button" class="btn btn-secondary" @click="closeEnrollModal">Mégse</button>
                <button type="submit" class="btn btn-primary" :disabled="enrollLoading">
                  {{ enrollLoading ? 'Mentés...' : 'Mentés' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Diák szerkesztés modal -->
    <div class="modal fade show" tabindex="-1" v-if="showEditModal" style="display: block;">
      <div class="modal-dialog modal-lg">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Diák szerkesztése</h5>
            <button type="button" class="btn-close" @click="showEditModal = false"></button>
          </div>
          <div class="modal-body">
            <form @submit.prevent="updateStudent">
              <div class="row">
                <div class="col-md-6">
                  <h6>Diák adatai</h6>
                  <div class="mb-3">
                    <label class="form-label">Név</label>
                    <input type="text" class="form-control" v-model="editStudentData.nev" required>
                  </div>
                  <div class="mb-3">
                    <label class="form-label">Email</label>
                    <input type="email" class="form-control" v-model="editStudentData.email" required>
                  </div>
                  <div class="mb-3">
                    <label class="form-label">Telefonszám</label>
                    <input type="tel" class="form-control" v-model="editStudentData.telefonszam" required>
                  </div>
                  <div class="mb-3">
                    <label class="form-label">Születési dátum</label>
                    <input type="date" class="form-control" v-model="editStudentData.szuletesi_datum" required>
                  </div>
                  <div class="mb-3">
                    <label class="form-label">Személyi igazolvány szám</label>
                    <input type="text" class="form-control" v-model="editStudentData.szemelyi_igazolvany_szam" required>
                  </div>
                  <div class="mb-3">
                    <label class="form-label">TAJ szám</label>
                    <input type="text" class="form-control" v-model="editStudentData.taj_szam" required>
                  </div>
                  <div class="mb-3">
                    <label class="form-label">Diákigazolvány szám</label>
                    <input type="text" class="form-control" v-model="editStudentData.diakigazolvany_szam" required>
                  </div>
                  <div class="mb-3">
                    <label class="form-label">Kapcsolat típusa</label>
                    <select class="form-select" v-model="editStudentData.kapcsolat_tipusa" required>
                      <option value="anya">Anya</option>
                      <option value="apa">Apa</option>
                      <option value="gondviselo">Gondviselő</option>
                    </select>
                  </div>
                </div>
                <div class="col-md-6">
                  <h6>Szülő adatai</h6>
                  
                  <!-- Szülő mód választó -->
                  <div class="mb-3">
                    <label class="form-label">Szülő kiválasztása</label>
                    <select class="form-select" v-model="editParentSelectionMode">
                      <option value="existing">Meglévő szülő kiválasztása</option>
                      <option value="new">Új szülő felvétele</option>
                    </select>
                  </div>
                  
                  <!-- Meglévő szülő kiválasztása -->
                  <div v-if="editParentSelectionMode === 'existing'" class="mb-3">
                    <label class="form-label">Szülő</label>
                    <select class="form-select" v-model="selectedEditParentId" @change="onEditParentSelected" required>
                      <option value="">Válasszon szülőt</option>
                      <option v-for="parent in parents" :key="parent.szulo_id" :value="parent.szulo_id">
                        {{ parent.nev }} ({{ parent.email }})
                      </option>
                    </select>
                  </div>
                  
                  <!-- Szülő adatok szerkesztése - csak new módban látható -->
                  <div v-if="editParentSelectionMode === 'new'">
                    <div class="mb-3">
                      <label class="form-label">Név</label>
                      <input type="text" class="form-control" v-model="editStudentData.szuloData.nev" required>
                    </div>
                    <div class="mb-3">
                      <label class="form-label">Email</label>
                      <input type="email" class="form-control" v-model="editStudentData.szuloData.email" required>
                    </div>
                    <div class="mb-3">
                      <label class="form-label">Telefonszám</label>
                      <input type="tel" class="form-control" v-model="editStudentData.szuloData.telefonszam" required>
                    </div>
                    <div class="mb-3">
                      <label class="form-label">Személyi igazolvány szám</label>
                      <input type="text" class="form-control" v-model="editStudentData.szuloData.szemelyi_igazolvany_szam" required>
                    </div>
                  </div>
                  
                  <h6>Lakcím adatai</h6>
                  
                  <!-- Lakcím mód választó -->
                  <div class="mb-3">
                    <label class="form-label">Lakcím kiválasztása</label>
                    <select class="form-select" v-model="editAddressSelectionMode">
                      <option value="existing">Meglévő lakcím kiválasztása</option>
                      <option value="new">Új lakcím felvétele</option>
                    </select>
                  </div>
                  
                  <!-- Meglévő lakcím kiválasztása -->
                  <div v-if="editAddressSelectionMode === 'existing'" class="mb-3">
                    <label class="form-label">Lakcím</label>
                    <select class="form-select" v-model="selectedEditAddressId" @change="onEditAddressSelected" required>
                      <option value="">Válasszon lakcímet</option>
                      <option v-for="address in addresses" :key="address.lakcim_id" :value="address.lakcim_id">
                        {{ address.iranyitoszam }} {{ address.varos }}, {{ address.utca_hazszam }}
                      </option>
                    </select>
                  </div>
                  
                  <!-- Lakcím adatok szerkesztése - csak new módban látható -->
                  <div v-if="editAddressSelectionMode === 'new'">
                    <div class="mb-3">
                      <label class="form-label">Ország</label>
                      <input type="text" class="form-control" v-model="editStudentData.lakcimData.orszag" required>
                    </div>
                    <div class="mb-3">
                      <label class="form-label">Irányítószám</label>
                      <input type="text" class="form-control" v-model="editStudentData.lakcimData.iranyitoszam" required>
                    </div>
                    <div class="mb-3">
                      <label class="form-label">Város</label>
                      <input type="text" class="form-control" v-model="editStudentData.lakcimData.varos" required>
                    </div>
                    <div class="mb-3">
                      <label class="form-label">Utca, házszám</label>
                      <input type="text" class="form-control" v-model="editStudentData.lakcimData.utca_hazszam" required>
                    </div>
                  </div>
                  
                  <div class="mb-3">
                    <label class="form-label">Szoba</label>
                    <select class="form-select" v-model="editStudentData.szoba_id">
                      <option value="">Nincs szoba</option>
                      <option v-for="room in rooms" :key="room.szoba_id" :value="room.szoba_id">
                        {{ room.szoba_szama }} ({{ room.osszes_hely }} fő)
                      </option>
                    </select>
                  </div>
                </div>
              </div>
              
              <div class="modal-footer">
                <button type="button" class="btn btn-secondary" @click="showEditModal = false">Mégse</button>
                <button type="submit" class="btn btn-primary" :disabled="updateLoading">
                  {{ updateLoading ? 'Mentés...' : 'Mentés' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Diák megtekintés modal -->
    <div class="modal fade show" tabindex="-1" v-if="showViewModal" style="display: block;">
      <div class="modal-dialog modal-lg">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Diák adatai - {{ viewStudentData?.nev }}</h5>
            <button type="button" class="btn-close" @click="showViewModal = false"></button>
          </div>
          <div class="modal-body">
            <!-- Tab navigáció -->
            <ul class="nav nav-tabs mb-3">
              <li class="nav-item">
                <a class="nav-link" :class="{ active: activeViewTab === 'student' }" href="#" @click.prevent="activeViewTab = 'student'">
                  Diák adatok
                </a>
              </li>
              <li class="nav-item">
                <a class="nav-link" :class="{ active: activeViewTab === 'parent' }" href="#" @click.prevent="activeViewTab = 'parent'">
                  Szülő adatai
                </a>
              </li>
              <li class="nav-item">
                <a class="nav-link" :class="{ active: activeViewTab === 'address' }" href="#" @click.prevent="activeViewTab = 'address'">
                  Lakcím
                </a>
              </li>
            </ul>

            <!-- Diák adatok fül -->
            <div v-if="activeViewTab === 'student'">
              <div class="row">
                <div class="col-md-6">
                  <table class="table table-borderless">
                    <tbody>
                      <tr><td><strong>Név:</strong></td><td>{{ viewStudentData?.nev }}</td></tr>
                      <tr><td><strong>Email:</strong></td><td>{{ viewStudentData?.email }}</td></tr>
                      <tr><td><strong>Telefonszám:</strong></td><td>{{ viewStudentData?.telefonszam }}</td></tr>
                      <tr><td><strong>Születési dátum:</strong></td><td>{{ viewStudentData?.szuletesi_datum }}</td></tr>
                    </tbody>
                  </table>
                </div>
                <div class="col-md-6">
                  <table class="table table-borderless">
                    <tbody>
                      <tr><td><strong>Személyi igazolvány:</strong></td><td>{{ viewStudentData?.szemelyi_igazolvany_szam }}</td></tr>
                      <tr><td><strong>TAJ szám:</strong></td><td>{{ viewStudentData?.taj_szam }}</td></tr>
                      <tr><td><strong>Diákigazolvány:</strong></td><td>{{ viewStudentData?.diakigazolvany_szam }}</td></tr>
                      <tr>
                        <td><strong>Státusz:</strong></td>
                        <td>
                          <span class="badge" :class="viewStudentData?.aktiv ? 'bg-success' : 'bg-danger'">
                            {{ viewStudentData?.aktiv ? 'Aktív' : 'Inaktív' }}
                          </span>
                        </td>
                      </tr>
                      <tr><td><strong>Szoba:</strong></td><td>{{ viewStudentData?.szoba?.szoba_szama || 'Nincs szoba' }}</td></tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <!-- Szülő adatai fül -->
            <div v-if="activeViewTab === 'parent'">
              <div v-if="viewStudentData?.szulo">
                <div class="row">
                  <div class="col-md-6">
                    <table class="table table-borderless">
                      <tbody>
                        <tr><td><strong>Név:</strong></td><td>{{ viewStudentData.szulo.nev }}</td></tr>
                        <tr><td><strong>Email:</strong></td><td>{{ viewStudentData.szulo.email }}</td></tr>
                        <tr><td><strong>Telefonszám:</strong></td><td>{{ viewStudentData.szulo.telefonszam }}</td></tr>
                      </tbody>
                    </table>
                  </div>
                  <div class="col-md-6">
                    <table class="table table-borderless">
                      <tbody>
                        <tr><td><strong>Személyi igazolvány:</strong></td><td>{{ viewStudentData.szulo.szemelyi_igazolvany_szam }}</td></tr>
                        <tr><td><strong>Kapcsolat típusa:</strong></td><td>{{ viewStudentData.kapcsolat_tipusa }}</td></tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
              <div v-else class="alert alert-info">Nincs megadva szülő adat.</div>
            </div>

            <!-- Lakcím fül -->
            <div v-if="activeViewTab === 'address'">
              <div v-if="viewStudentData?.lakcim">
                <table class="table table-borderless">
                  <tbody>
                    <tr><td><strong>Ország:</strong></td><td>{{ viewStudentData.lakcim.orszag }}</td></tr>
                    <tr><td><strong>Irányítószám:</strong></td><td>{{ viewStudentData.lakcim.iranyitoszam }}</td></tr>
                    <tr><td><strong>Város:</strong></td><td>{{ viewStudentData.lakcim.varos }}</td></tr>
                    <tr><td><strong>Utca, házszám:</strong></td><td>{{ viewStudentData.lakcim.utca_hazszam }}</td></tr>
                  </tbody>
                </table>
              </div>
              <div v-else class="alert alert-info">Nincs megadva lakcím.</div>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" @click="showViewModal = false">Bezárás</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Törlés megerősítő modal -->
    <div class="modal fade show" tabindex="-1" v-if="showDeleteModal" style="display: block;">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Diák törlése</h5>
            <button type="button" class="btn-close" @click="showDeleteModal = false"></button>
          </div>
          <div class="modal-body">
            <p>Biztosan törölni szeretné a következő diákot?</p>
            <p><strong>{{ deleteStudentData?.nev }}</strong></p>
            <p class="text-warning">
              <small>
                Figyelem: A diák törlése csak akkor lehetséges, ha nincs aktív szobája.
              </small>
            </p>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" @click="showDeleteModal = false">Mégse</button>
            <button type="button" class="btn btn-danger" @click="confirmDeleteStudent" :disabled="deleteLoading">
              {{ deleteLoading ? 'Törlés...' : 'Törlés' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, computed } from 'vue'
import { useAuthStore } from '../store/auth'
import api from '../services/api'
import { toast } from 'vue3-toastify'
import { Modal } from 'bootstrap'

export default {
  name: 'StudentsView',
  setup() {
    const students = ref([])
    const rooms = ref([])
    const parents = ref([])
    const addresses = ref([])
    const loading = ref(false)
    const searchQuery = ref('')
    const selectedStatus = ref('')
    const showEnrollModal = ref(false)
    const enrollLoading = ref(false)
    
    // Parent selection for enroll
    const parentSelectionMode = ref('new')
    const selectedParentId = ref('')
    
    // Address selection for enroll
    const addressSelectionMode = ref('new')
    const selectedAddressId = ref('')
    
    // Edit parent selection
    const editParentSelectionMode = ref('existing')
    const selectedEditParentId = ref('')
    
    // Edit address selection
    const editAddressSelectionMode = ref('existing')
    const selectedEditAddressId = ref('')
    
    // Modal references
    const enrollModalRef = ref(null)
    const editModalRef = ref(null)
    const viewModalRef = ref(null)
    const deleteModalRef = ref(null)
    
    let enrollModal = null
    let editModal = null
    let viewModal = null
    let deleteModal = null
    
    const enrollData = ref({
      diakData: {
        nev: '',
        email: '',
        telefonszam: '',
        szuletesi_datum: '',
        szemelyi_igazolvany_szam: '',
        taj_szam: '',
        diakigazolvany_szam: '',
        kapcsolat_tipusa: 'anya'
      },
      szuloData: {
        nev: '',
        email: '',
        telefonszam: '',
        szemelyi_igazolvany_szam: ''
      },
      lakcimData: {
        orszag: '',
        iranyitoszam: '',
        varos: '',
        utca_hazszam: ''
      },
      szoba_id: ''
    })
    
    const showEditModal = ref(false)
    const showDeleteModal = ref(false)
    const updateLoading = ref(false)
    const deleteLoading = ref(false)
    
    const editStudentData = ref({
      nev: '',
      email: '',
      telefonszam: '',
      szuletesi_datum: '',
      szemelyi_igazolvany_szam: '',
      taj_szam: '',
      diakigazolvany_szam: '',
      kapcsolat_tipusa: 'anya',
      szuloData: {
        nev: '',
        email: '',
        telefonszam: '',
        szemelyi_igazolvany_szam: ''
      },
      lakcimData: {
        orszag: '',
        iranyitoszam: '',
        varos: '',
        utca_hazszam: ''
      },
      szoba_id: ''
    })
    
    const deleteStudentData = ref(null)
    const currentEditStudentId = ref(null)
    
    // View modal state
    const showViewModal = ref(false)
    const viewStudentData = ref(null)
    const activeViewTab = ref('student')

    const authStore = useAuthStore()

    const fetchStudents = async () => {
      loading.value = true
      try {
        const response = await api.get('/diaks')
        if (response.data.success) {
          students.value = response.data.data
        }
      } catch (error) {
        console.error('Hiba a diákok lekérése közben:', error)
      } finally {
        loading.value = false
      }
    }

    const fetchRooms = async () => {
      try {
        const response = await api.get('/szobas')
        if (response.data.success) {
          rooms.value = response.data.data
        }
      } catch (error) {
        console.error('Hiba a szobák lekérése közben:', error)
      }
    }

    const fetchParents = async () => {
      try {
        const response = await api.get('/szulos')
        if (response.data.success) {
          parents.value = response.data.data
        }
      } catch (error) {
        console.error('Hiba a szülők lekérése közben:', error)
      }
    }

    const fetchAddresses = async () => {
      try {
        const response = await api.get('/lakcims')
        if (response.data.success) {
          addresses.value = response.data.data
        }
      } catch (error) {
        console.error('Hiba a lakcímek lekérése közben:', error)
      }
    }

    const onParentSelected = () => {
      if (selectedParentId.value) {
        const parent = parents.value.find(p => p.szulo_id === parseInt(selectedParentId.value))
        if (parent) {
          enrollData.value.szuloData = {
            nev: parent.nev,
            email: parent.email,
            telefonszam: parent.telefonszam,
            szemelyi_igazolvany_szam: parent.szemelyi_igazolvany_szam
          }
          // If parent has address, fill it in
          if (parent.lakcim) {
            enrollData.value.lakcimData = {
              orszag: parent.lakcim.orszag,
              iranyitoszam: parent.lakcim.iranyitoszam,
              varos: parent.lakcim.varos,
              utca_hazszam: parent.lakcim.utca_hazszam
            }
          }
        }
      }
    }

    const onAddressSelected = () => {
      if (selectedAddressId.value) {
        const address = addresses.value.find(a => a.lakcim_id === parseInt(selectedAddressId.value))
        if (address) {
          enrollData.value.lakcimData = {
            orszag: address.orszag,
            iranyitoszam: address.iranyitoszam,
            varos: address.varos,
            utca_hazszam: address.utca_hazszam
          }
        }
      }
    }

    const onEditParentSelected = () => {
      if (selectedEditParentId.value) {
        const parent = parents.value.find(p => p.szulo_id === parseInt(selectedEditParentId.value))
        if (parent) {
          editStudentData.value.szuloData = {
            nev: parent.nev,
            email: parent.email,
            telefonszam: parent.telefonszam,
            szemelyi_igazolvany_szam: parent.szemelyi_igazolvany_szam
          }
          // If parent has address, fill it in
          if (parent.lakcim) {
            editStudentData.value.lakcimData = {
              orszag: parent.lakcim.orszag,
              iranyitoszam: parent.lakcim.iranyitoszam,
              varos: parent.lakcim.varos,
              utca_hazszam: parent.lakcim.utca_hazszam
            }
          }
        }
      }
    }

    const onEditAddressSelected = () => {
      if (selectedEditAddressId.value) {
        const address = addresses.value.find(a => a.lakcim_id === parseInt(selectedEditAddressId.value))
        if (address) {
          editStudentData.value.lakcimData = {
            orszag: address.orszag,
            iranyitoszam: address.iranyitoszam,
            varos: address.varos,
            utca_hazszam: address.utca_hazszam
          }
        }
      }
    }

    const filteredStudents = computed(() => {
      let result = students.value
      
      // Filter by search query (name, email, or room number)
      if (searchQuery.value) {
        const query = searchQuery.value.toLowerCase()
        result = result.filter(student => {
          const matchesName = student.nev.toLowerCase().includes(query)
          const matchesEmail = student.email.toLowerCase().includes(query)
          const matchesRoomNumber = student.szoba?.szoba_szama?.toString().includes(query)
          const matchesNoRoom = !student.szoba && (query.includes('nincs') || query.includes('nincs szoba'))
          return matchesName || matchesEmail || matchesRoomNumber || matchesNoRoom
        })
      }
      
      // Filter by status
      if (selectedStatus.value !== '') {
        const statusBool = selectedStatus.value === 'true'
        result = result.filter(student => Boolean(student.aktiv) === statusBool)
      }
      
      return result
    })

    const openEnrollModal = () => {
      fetchParents() // Load parents when opening modal
      fetchAddresses() // Load addresses when opening modal
      if (enrollModal) {
        enrollModal.show()
      }
    }

    const closeEnrollModal = () => {
      if (enrollModal) {
        enrollModal.hide()
      }
    }

    const enrollStudent = async () => {
      enrollLoading.value = true
      try {
        const response = await api.post('/diaks/enroll', enrollData.value)
        if (response.data.success) {
          closeEnrollModal()
          resetEnrollForm()
          fetchStudents()
          toast.success('Diák sikeresen felvéve!')
        }
      } catch (error) {
        console.error('Hiba a diák felvétele közben:', error)
        toast.error('Hiba történt a diák felvétele közben')
      } finally {
        enrollLoading.value = false
      }
    }

    const resetEnrollForm = () => {
      enrollData.value = {
        diakData: {
          nev: '',
          email: '',
          telefonszam: '',
          szuletesi_datum: '',
          szemelyi_igazolvany_szam: '',
          taj_szam: '',
          diakigazolvany_szam: '',
          kapcsolat_tipusa: 'anya'
        },
        szuloData: {
          nev: '',
          email: '',
          telefonszam: '',
          szemelyi_igazolvany_szam: ''
        },
        lakcimData: {
          orszag: '',
          iranyitoszam: '',
          varos: '',
          utca_hazszam: ''
        },
        szoba_id: ''
      }
      parentSelectionMode.value = 'new'
      selectedParentId.value = ''
      addressSelectionMode.value = 'new'
      selectedAddressId.value = ''
    }

    // Clear all filters
    const clearFilters = () => {
      searchQuery.value = ''
      selectedStatus.value = ''
    }

    // Check if room has capacity for transfer
    const canTransferToRoom = (student, targetRoom) => {
      const targetRoomData = rooms.value.find(r => r.szoba_szama === targetRoom)
      
      if (!targetRoomData) return false
      
      // Check if target room has capacity
      const currentOccupancy = students.value.filter(s => s.szoba?.szoba_szama === targetRoom).length
      return currentOccupancy < targetRoomData.osszes_hely
    }

    const viewStudent = (student) => {
      viewStudentData.value = student
      activeViewTab.value = 'student'
      showViewModal.value = true
    }

    const transferStudent = async (student) => {
      // Diák áthelyezése
      try {
        // Check room capacity before transfer
        const availableRooms = rooms.value.filter(room => 
          room.szoba_szama !== student.szoba?.szoba_szama &&
          canTransferToRoom(student, room.szoba_szama)
        )
        
        if (availableRooms.length === 0) {
          toast.error('Nincs elérhető szabad szoba a diák áthelyezéséhez!')
          return
        }
        
        // For now, just show a success message
        // In a real implementation, this would open a modal to select the target room
        toast.success(`Diák áthelyezése: ${student.nev}`)
        console.log('Diák áthelyezése:', student)
        
      } catch (error) {
        console.error('Hiba a diák áthelyezése közben:', error)
        toast.error('Hiba történt a diák áthelyezése közben')
      }
    }

    const moveOutStudent = (student) => {
      // Diák kiköltöztetése
      console.log('Diák kiköltöztetése:', student)
    }

    const editStudent = (student) => {
      currentEditStudentId.value = student.diak_id
      
      // Set parent selection mode based on whether student has a parent
      editParentSelectionMode.value = student.szulo ? 'existing' : 'new'
      selectedEditParentId.value = student.szulo?.szulo_id || ''
      
      // Set address selection mode based on whether student has an address
      editAddressSelectionMode.value = student.lakcim ? 'existing' : 'new'
      selectedEditAddressId.value = student.lakcim?.lakcim_id || ''
      
      editStudentData.value = {
        nev: student.nev,
        email: student.email,
        telefonszam: student.telefonszam,
        szuletesi_datum: student.szuletesi_datum,
        szemelyi_igazolvany_szam: student.szemelyi_igazolvany_szam,
        taj_szam: student.taj_szam,
        diakigazolvany_szam: student.diakigazolvany_szam,
        kapcsolat_tipusa: student.kapcsolat_tipusa,
        szuloData: {
          nev: student.szulo?.nev || '',
          email: student.szulo?.email || '',
          telefonszam: student.szulo?.telefonszam || '',
          szemelyi_igazolvany_szam: student.szulo?.szemelyi_igazolvany_szam || ''
        },
        lakcimData: {
          orszag: student.lakcim?.orszag || '',
          iranyitoszam: student.lakcim?.iranyitoszam || '',
          varos: student.lakcim?.varos || '',
          utca_hazszam: student.lakcim?.utca_hazszam || ''
        },
        szoba_id: student.szoba?.szoba_id || ''
      }
      
      // Fetch parents and addresses for the dropdowns
      fetchParents()
      fetchAddresses()
      showEditModal.value = true
    }

    const updateStudent = async () => {
      updateLoading.value = true
      try {
        const response = await api.put(`/diaks/${currentEditStudentId.value}`, editStudentData.value)
        if (response.data.success) {
          showEditModal.value = false
          fetchStudents()
          toast.success('Diák adatai sikeresen módosítva')
        }
      } catch (error) {
        console.error('Hiba a diák módosítása közben:', error)
        toast.error('Hiba történt a diák módosítása közben')
      } finally {
        updateLoading.value = false
      }
    }

    const deleteStudent = (student) => {
      deleteStudentData.value = student
      showDeleteModal.value = true
    }

    const confirmDeleteStudent = async () => {
      deleteLoading.value = true
      try {
        const response = await api.delete(`/diaks/${deleteStudentData.value.diak_id}`)
        if (response.data.success) {
          showDeleteModal.value = false
          fetchStudents()
          toast.success('Diák sikeresen törölve')
        }
      } catch (error) {
        console.error('Hiba a diák törlése közben:', error)
        toast.error('Hiba történt a diák törlése közben')
      } finally {
        deleteLoading.value = false
      }
    }

    onMounted(() => {
      fetchStudents()
      fetchRooms()
      
      // Initialize Bootstrap modals
      if (enrollModalRef.value) {
        enrollModal = new Modal(enrollModalRef.value)
      }
    })

    return {
      students,
      rooms,
      parents,
      addresses,
      loading,
      searchQuery,
      selectedStatus,
      showEnrollModal,
      enrollLoading,
      enrollData,
      filteredStudents,
      fetchStudents,
      enrollStudent,
      viewStudent,
      transferStudent,
      moveOutStudent,
      editStudent,
      updateStudent,
      deleteStudent,
      confirmDeleteStudent,
      clearFilters,
      canTransferToRoom,
      showViewModal,
      viewStudentData,
      activeViewTab,
      showEditModal,
      showDeleteModal,
      updateLoading,
      deleteLoading,
      editStudentData,
      deleteStudentData,
      openEnrollModal,
      closeEnrollModal,
      enrollModalRef,
      parentSelectionMode,
      selectedParentId,
      onParentSelected,
      addressSelectionMode,
      selectedAddressId,
      onAddressSelected,
      editParentSelectionMode,
      selectedEditParentId,
      onEditParentSelected,
      editAddressSelectionMode,
      selectedEditAddressId,
      onEditAddressSelected
    }
  }
}
</script>
