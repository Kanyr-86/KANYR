<template>
  <div class="container-fluid">
    <div class="row">
      <div class="col-12">
        <div class="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h2 class="mb-1">Diákok kezelése</h2>
            <p class="text-muted mb-0">Diák adatok kezelése és szobába költöztetés</p>
          </div>
          <div class="d-flex gap-2">
            <button class="btn btn-primary btn-lg" @click="openEnrollModal">
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
                    <label class="form-label fw-semibold">Keresés</label>
                    <div class="input-group">
                      <span class="input-group-text">
                        <i class="bi bi-search"></i>
                      </span>
                      <input 
                        type="text" 
                        class="form-control" 
                        placeholder="Név, email vagy szoba alapján..."
                        v-model="searchQuery"
                      >
                    </div>
                  </div>
                  <div class="col-12 col-md-4">
                    <label class="form-label fw-semibold">Státusz</label>
                    <select class="form-select" v-model="selectedStatus">
                      <option value="">Összes státusz</option>
                      <option value="true">Aktív</option>
                      <option value="false">Inaktív</option>
                    </select>
                  </div>
                  <div class="col-12 col-md-2 d-flex align-items-end">
                    <button class="btn btn-outline-secondary w-100" @click="clearFilters">
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
                <div class="card bg-primary text-white">
                  <div class="card-body text-center">
                    <h6 class="card-title mb-1">Összes diák</h6>
                    <h3 class="mb-0">{{ students.length }}</h3>
                  </div>
                </div>
              </div>
              <div class="col-6">
                <div class="card bg-success text-white">
                  <div class="card-body text-center">
                    <h6 class="card-title mb-1">Aktív diákok</h6>
                    <h3 class="mb-0">{{ activeStudentsCount }}</h3>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Diákok táblázat -->
        <div class="card shadow-sm">
          <div class="card-header bg-white border-0">
            <div class="d-flex justify-content-between align-items-center">
              <h6 class="mb-0">Diák lista</h6>
              <span class="badge bg-light text-dark">{{ filteredStudents.length }} diák</span>
            </div>
          </div>
          <div class="card-body p-0">
            <div class="table-responsive">
              <table class="table table-hover mb-0">
                <thead class="table-light">
                  <tr>
                    <th class="text-primary">Név</th>
                    <th class="d-none d-md-table-cell">Email</th>
                    <th class="d-none d-lg-table-cell">Telefonszám</th>
                    <th>Szoba</th>
                    <th>Státusz</th>
                    <th class="text-center">Műveletek</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="student in filteredStudents" :key="student.diak_id" class="align-middle">
                    <td>
                      <div class="d-flex align-items-center">
                        <div class="avatar bg-primary text-white rounded-circle d-flex align-items-center justify-content-center me-3" style="width: 40px; height: 40px;">
                          {{ student.nev.charAt(0).toUpperCase() }}
                        </div>
                        <div>
                          <div class="fw-semibold">{{ student.nev }}</div>
                          <small class="text-muted">{{ student.nem === 'férfi' ? 'Férfi' : 'Nő' }}</small>
                        </div>
                      </div>
                    </td>
                    <td class="d-none d-md-table-cell">
                      <span class="badge bg-light text-dark">{{ student.email }}</span>
                    </td>
                    <td class="d-none d-lg-table-cell">{{ student.telefonszam || '-' }}</td>
                    <td>
                      <span v-if="student.szoba" class="badge bg-info">
                        <i class="bi bi-door-closed me-1"></i>{{ student.szoba.szoba_szama }}
                      </span>
                      <span v-else class="text-muted">Nincs szoba</span>
                    </td>
                    <td>
                      <span class="badge" :class="student.aktiv ? 'bg-primary' : 'bg-danger'">
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
                        >
                          <i class="bi bi-eye me-1"></i>Megtekintés
                        </button>
                        <button 
                          class="btn btn-outline-warning btn-sm" 
                          @click="editStudent(student)"
                          title="Diák szerkesztése"
                        >
                          <i class="bi bi-pencil me-1"></i>Szerkesztés
                        </button>
                        <button 
                          class="btn btn-outline-info btn-sm" 
                          @click="transferStudent(student)"
                          title="Diák költöztetése"
                        >
                          <i class="bi bi-arrow-right me-1"></i>Áthelyezés
                        </button>
                        <button 
                          class="btn btn-outline-danger btn-sm" 
                          @click="deleteStudent(student)"
                          title="Diák törlése"
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
                  <div class="mb-3">
                    <label class="form-label">Nem</label>
                    <select class="form-select" v-model="enrollData.diakData.nem" required>
                      <option value="">Válasszon nemet</option>
                      <option value="férfi">Férfi</option>
                      <option value="nő">Nő</option>
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
                  <div class="mb-3">
                    <label class="form-label">Nem</label>
                    <select class="form-select" v-model="editStudentData.nem" required>
                      <option value="">Válasszon nemet</option>
                      <option value="férfi">Férfi</option>
                      <option value="nő">Nő</option>
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
                      <tr><td><strong>Nem:</strong></td><td>{{ viewStudentData?.nem === 'férfi' ? 'Férfi' : 'Nő' }}</td></tr>
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

    <!-- Áthelyezés szoba választó modal -->
    <div class="modal fade show" tabindex="-1" v-if="showTransferModal" style="display: block;">
      <div class="modal-dialog modal-lg">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Diák költöztetése - {{ transferStudentData?.nev }}</h5>
            <button type="button" class="btn-close" @click="closeTransferModal"></button>
          </div>
          <div class="modal-body">
            <!-- Jelenlegi szoba info -->
            <div class="alert alert-info mb-3">
              <strong>Jelenlegi szoba:</strong> {{ transferStudentData?.szoba?.szoba_szama || 'Nincs szoba' }}
            </div>

            <!-- Szobák listája -->
            <h6 class="mb-3">Válasszon cél szobát:</h6>
            <div class="alert alert-info mb-3" v-if="transferStudentData?.nem">
              <small>
                <strong>Diák neme:</strong> {{ transferStudentData.nem === 'férfi' ? 'Férfi' : 'Nő' }} |
                <span class="text-muted">A másik nem szobái homályosak és nem választhatók.</span>
              </small>
            </div>
            <div v-if="availableRoomsForTransfer.length === 0" class="alert alert-warning">
              <strong>Nincs elérhető szoba a költöztetéshez.</strong><br>
              <small>Csak a kiköltözés lehetséges.</small>
            </div>
            <div class="row" v-else>
              <div class="col-md-6 col-lg-4" v-for="room in availableRoomsForTransfer" :key="room.szoba_id">
                <div 
                  class="card mb-3 room-card" 
                  :class="{ 
                    'border-primary': selectedTransferRoomId === room.szoba_id,
                    'room-incompatible': !isRoomGenderCompatible(room, transferStudentData?.nem)
                  }"
                >
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
                      <small>
                        <strong>{{ getRoomGenderText(room) }}</strong>
                      </small>
                    </p>
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
                      v-if="isRoomGenderCompatible(room, transferStudentData?.nem)"
                      class="btn btn-sm w-100" 
                      :class="selectedTransferRoomId === room.szoba_id ? 'btn-primary' : 'btn-outline-primary'"
                      @click="selectTransferRoom(room.szoba_id)"
                      :disabled="transferLoading">
                      {{ selectedTransferRoomId === room.szoba_id ? 'Kiválasztva' : 'Kiválaszt' }}
                    </button>
                    <button 
                      v-else
                      class="btn btn-sm w-100 btn-outline-secondary" 
                      disabled>
                      Nem kompatibilis
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" @click="closeTransferModal">Mégse</button>
            <button 
              type="button" 
              class="btn btn-danger" 
              @click="confirmMoveOut"
              :disabled="transferLoading">
              {{ transferLoading ? 'Kiköltözés...' : 'Kiköltözés' }}
            </button>
            <button 
              type="button" 
              class="btn btn-success" 
              @click="confirmTransfer"
              :disabled="!selectedTransferRoomId || transferLoading">
              {{ transferLoading ? 'Költöztetés...' : 'Költöztetés' }}
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
import { useApiStore } from '../store/api'
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
    
    const apiStore = useApiStore()
    
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

    // Transfer modal state
    const showTransferModal = ref(false)
    const transferStudentData = ref(null)
    const selectedTransferRoomId = ref(null)
    const transferLoading = ref(false)
    const availableRoomsForTransfer = ref([])
    const roomGenders = ref({}) // Szobák nemeinek tárolása: { szoba_id: 'férfi' | 'nő' | null }

    const authStore = useAuthStore()

    const fetchStudents = async () => {
      loading.value = true
      try {
        const response = await api.get('/diaks?includeRelations=true')
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
          editStudentData.value.szulo_id = parseInt(selectedEditParentId.value)
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
          editStudentData.value.cim_id = parseInt(selectedEditAddressId.value)
          editStudentData.value.lakcimData = {
            orszag: address.orszag,
            iranyitoszam: address.iranyitoszam,
            varos: address.varos,
            utca_hazszam: address.utca_hazszam
          }
        }
      }
    }

    const activeStudentsCount = computed(() => {
      return students.value.filter(student => student.aktiv).length
    })

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
          // Törlöm a cache-t a diákok listája frissítéséhez
          apiStore.clearCache('diaks')
          await fetchStudents()
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
      // Diák áthelyezése - szoba választó megnyitása
      transferStudentData.value = student
      selectedTransferRoomId.value = null
      transferLoading.value = false
      
      // Szobák betöltése lakószámmal és nemi információval
      await fetchRoomsWithOccupancy()
      
      // Elérhető szobák szűrése (kivéve a jelenlegi szobát, és csak amelyekbe fér még diák)
      const currentRoomId = student.szoba?.szoba_id
      const studentGender = student.nem
      
      availableRoomsForTransfer.value = rooms.value.filter(room => {
        if (room.szoba_id === currentRoomId) return false
        const occupancy = room.currentOccupancy || 0
        // Csak akkor elérhető, ha van szabad hely ÉS kompatibilis a nemek
        return occupancy < room.osszes_hely
      })
      
      // Ellenőrizzük, hogy van-e jelenlegi szoba (kiköltözés lehetősége)
      const hasCurrentRoom = student.szoba?.szoba_id != null
      
      // Ha nincs elérhető szoba ÉS nincs jelenlegi szoba (tehát nincs mit csinálni)
      if (availableRoomsForTransfer.value.length === 0 && !hasCurrentRoom) {
        toast.error('Nincs elérhető szoba a költöztetéshez, és a diáknak nincs jelenlegi szobája!')
        return
      }
      
      // Minden más esetben megnyitjuk a modalt (kiköltözés vagy költöztetés lehetséges)
      showTransferModal.value = true
    }

    const fetchRoomsWithOccupancy = async () => {
      try {
        // Szobák lekérdezése
        const response = await api.get('/szobas')
        if (response.data.success) {
          const roomsData = response.data.data
          
          // Párhuzamos elfoglaltság és lakók lekérdezése
          const roomDetailPromises = roomsData.map(room =>
            Promise.allSettled([
              // Elfoglaltság lekérdezése
              api.get(`/szobas/${room.szoba_id}/occupancy`)
                .then(occupancyResponse => {
                  if (occupancyResponse.data.success) {
                    room.currentOccupancy = occupancyResponse.data.data.currentOccupancy
                  }
                })
                .catch(error => {
                  console.error(`Hiba a szoba ${room.szoba_id} elfoglaltságának lekérése közben:`, error)
                  room.currentOccupancy = 0
                }),
              // Lakók lekérdezése a szoba neme miatt
              api.get(`/szobas/${room.szoba_id}/occupants`)
                .then(studentsResponse => {
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
                })
                .catch(error => {
                  console.error(`Hiba a szoba ${room.szoba_id} lakóinak lekérése közben:`, error)
                  roomGenders.value[room.szoba_id] = null
                })
            ])
          )
          
          // Minden hívás párhuzamosan
          await Promise.allSettled(roomDetailPromises)
          
          rooms.value = roomsData
        }
      } catch (error) {
        console.error('Hiba a szobák lekérése közben:', error)
        toast.error('Hiba történt a szobák betöltése közben')
      }
    }

    // Segédfüggvény: Ellenőrzi, hogy egy szoba kompatibilis-e a diák nemével
    const isRoomGenderCompatible = (room, studentGender) => {
      const roomGender = roomGenders.value[room.szoba_id]
      // Ha a szoba üres (nincs neme) vagy azonos nemű, akkor kompatibilis
      return !roomGender || roomGender === studentGender
    }

    // Segédfüggvény: Visszaadja egy szoba nemének szöveges leírását
    const getRoomGenderText = (room) => {
      const gender = roomGenders.value[room.szoba_id]
      if (!gender) return 'Üres szoba'
      return gender === 'férfi' ? 'Fiú szoba' : 'Lány szoba'
    }

    const closeTransferModal = () => {
      showTransferModal.value = false
      transferStudentData.value = null
      selectedTransferRoomId.value = null
    }

    const selectTransferRoom = (roomId) => {
      selectedTransferRoomId.value = roomId
    }

    const confirmTransfer = async () => {
      if (!selectedTransferRoomId.value || !transferStudentData.value) return
      
      transferLoading.value = true
      try {
        const response = await api.post(`/diaks/${transferStudentData.value.diak_id}/transfer`, {
          uj_szoba_id: selectedTransferRoomId.value,
          atcsatolas_datum: new Date().toISOString().split('T')[0]
        })
        
        if (response.data.success) {
          toast.success(`${transferStudentData.value.nev} sikeresen áthelyezve!`)
          closeTransferModal()
          // Törlöm a cache-t a diákok listája frissítéséhez
          apiStore.clearCache('diaks')
          await fetchStudents() // Diákok listájának frissítése
        }
      } catch (error) {
        console.error('Hiba az áthelyezés közben:', error)
        toast.error(error.response?.data?.error || 'Hiba történt az áthelyezés közben')
      } finally {
        transferLoading.value = false
      }
    }

    const confirmMoveOut = async () => {
      if (!transferStudentData.value) return
      
      // Megerősítés kérése
      if (!confirm(`Biztosan ki szeretné költöztetni ${transferStudentData.value.nev} diákot?`)) {
        return
      }
      
      transferLoading.value = true
      try {
        const response = await api.post(`/diaks/${transferStudentData.value.diak_id}/move-out`, {
          kikoltozes_datum: new Date().toISOString().split('T')[0]
        })
        
        if (response.data.success) {
          toast.success(`${transferStudentData.value.nev} sikeresen kiköltöztetve!`)
          closeTransferModal()
          // Törlöm a cache-t a diákok listája frissítéséhez
          apiStore.clearCache('diaks')
          await fetchStudents() // Diákok listájának frissítése
        }
      } catch (error) {
        console.error('Hiba a kiköltözés közben:', error)
        toast.error(error.response?.data?.error || 'Hiba történt a kiköltözés közben')
      } finally {
        transferLoading.value = false
      }
    }

    // Szoba kártya segédfüggvények
    const getTransferRoomOccupancyPercentage = (room) => {
      if (!room.osszes_hely) return 0
      const current = room.currentOccupancy || 0
      return Math.round((current / room.osszes_hely) * 100)
    }

    const getTransferRoomBadgeClass = (room) => {
      const occupancy = room.currentOccupancy || 0
      const capacity = room.osszes_hely
      
      if (occupancy === 0) return 'bg-secondary'
      if (occupancy === capacity) return 'bg-danger'
      if (occupancy >= capacity * 0.8) return 'bg-warning'
      return 'bg-success'
    }

    const getTransferRoomBadgeText = (room) => {
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
        nem: student.nem,
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
        // Készítsen egy másolatot az editStudentData-nak, hogy ne módosítsa az original-t
        const dataToSend = { ...editStudentData.value }

        // Ha existing módban van a szülő, ne küldj szuloData-t
        if (editParentSelectionMode.value === 'existing') {
          delete dataToSend.szuloData
        }

        // Ha existing módban van a lakcím, ne küldj lakcimData-t
        if (editAddressSelectionMode.value === 'existing') {
          delete dataToSend.lakcimData
        }

        const response = await api.put(`/diaks/${currentEditStudentId.value}`, dataToSend)
        if (response.data.success) {
          showEditModal.value = false
          // Törlöm a cache-t a diákok listája frissítéséhez
          apiStore.clearCache('diaks')
          await fetchStudents()
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
          // Törlöm a cache-t a diákok listája frissítéséhez
          apiStore.clearCache('diaks')
          await fetchStudents()
          toast.success('Diák sikeresen törölve')
        } else {
          // Hiba a válaszban
          const errorMsg = response.data.error || response.data.message || 'Ismeretlen hiba történt'
          toast.error(errorMsg)
        }
      } catch (error) {
        console.error('Hiba a diák törlése közben:', error)
        const errorMsg = error.response?.data?.error || error.response?.data?.message || 'Hiba történt a diák törlése közben'
        toast.error(errorMsg)
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
      onEditAddressSelected,
      // Transfer modal
      showTransferModal,
      transferStudentData,
      selectedTransferRoomId,
      transferLoading,
      availableRoomsForTransfer,
      roomGenders,
      closeTransferModal,
      selectTransferRoom,
      confirmTransfer,
      confirmMoveOut,
      getTransferRoomOccupancyPercentage,
      getTransferRoomBadgeClass,
      getTransferRoomBadgeText,
      getTransferRoomProgressClass,
      isRoomGenderCompatible,
      getRoomGenderText
    }
  }
}
</script>

<style scoped>
/* Címek színe - KANYR téma */
h2 {
  color: #ffffff;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.3);
}

.text-muted {
  color: var(--powder-blue, #a7cced) !important;
}

/* Szoba kártya stílusok - nem kompatibilis szobák homályosítása */
.room-card {
  transition: all 0.3s ease;
}

.room-card.room-incompatible {
  opacity: 0.5;
  filter: blur(1px) grayscale(0.5);
  pointer-events: none;
  background-color: #f8f9fa;
}

.room-card.room-incompatible .card-header {
  background-color: #e9ecef;
}

.room-card.room-incompatible .card-body {
  color: #6c757d;
}

/* Biztosítjuk, hogy a "Nem kompatibilis" gomb látható legyen */
.room-card.room-incompatible button {
  pointer-events: auto;
  opacity: 1;
  filter: none;
}
</style>
