<template>
  <div v-if="loading" class="row">
    <div class="col-12">
      <div class="d-flex justify-content-center py-5">
        <div class="text-center">
          <div class="spinner-border text-primary" role="status" style="width: 3rem; height: 3rem;">
            <span class="visually-hidden">Betöltés...</span>
          </div>
          <p class="mt-3 text-muted">Szobák betöltése...</p>
        </div>
      </div>
    </div>
  </div>
  
  <div v-else class="rooms-container">
    <RecycleScroller
      class="scroller"
      :items="rooms"
      :item-size="280"
      key-field="szoba_id"
      v-slot="{ item: room }"
    >
      <div class="room-card-wrapper">
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
                    <small class="text-muted">Férőhely</small>
                  </div>
                </div>
              </div>
              <div class="col-6">
                <div class="d-flex align-items-center">
                  <i class="bi bi-person-fill text-success me-2"></i>
                  <div>
                    <div class="fw-semibold">{{ room.currentOccupancy || 0 }} fő</div>
                    <small class="text-muted">Jelenlegi lakók</small>
                  </div>
                </div>
              </div>
            </div>
            
            <div class="progress mb-3" style="height: 8px;">
              <div class="progress-bar" 
                   :class="getProgressClass(room)"
                   :style="{ width: getOccupancyPercentage(room) + '%' }">
              </div>
            </div>
            
            <div class="mb-3">
              <div class="d-flex justify-content-between">
                <small class="text-muted">Foglaltság: {{ getOccupancyPercentage(room) }}%</small>
                <small class="text-muted">Szabad helyek: {{ room.osszes_hely - (room.currentOccupancy || 0) }}</small>
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
