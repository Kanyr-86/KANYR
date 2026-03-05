<template>
  <div class="container-fluid">
    <!-- Loading Overlay -->
    <LoadingOverlay :show="loading" message="Dashboard betöltése..." />
    
    <div class="row">
      <div class="col-12">
        <h2 class="dashboard-title">KANYR Dashboard</h2>
        
        <!-- Admin (titkár) nézet - statisztikákkal -->
        <div v-if="isAdmin" class="row g-4 mb-4">
          <div class="col-12 col-sm-6 col-lg-3">
            <div class="card h-100 shadow-sm border-0 hover-card">
              <div class="card-body d-flex flex-column justify-content-center align-items-center text-center py-4">
                <i class="bi bi-people-fill mb-3" style="font-size: 2.5rem;"></i>
                <h5 class="card-title mb-3">Diákok</h5>
                <p class="card-text display-6 fw-bold mb-3">
                  <template v-if="loading">
                    <span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                  </template>
                  <template v-else>{{ statistics.totalStudents || 0 }}</template>
                </p>
                <span class="badge bg-primary px-3 py-2">Összes</span>
              </div>
            </div>
          </div>
          <div class="col-12 col-sm-6 col-lg-3">
            <div class="card h-100 shadow-sm border-0 hover-card">
              <div class="card-body d-flex flex-column justify-content-center align-items-center text-center py-4">
                <i class="bi bi-person-check-fill mb-3" style="font-size: 2.5rem;"></i>
                <h5 class="card-title mb-3">Aktív diákok</h5>
                <p class="card-text display-6 fw-bold mb-3">
                  <template v-if="loading">
                    <span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                  </template>
                  <template v-else>{{ statistics.activeStudents || 0 }}</template>
                </p>
                <span class="badge bg-success px-3 py-2">Lakók</span>
              </div>
            </div>
          </div>
          <div class="col-12 col-sm-6 col-lg-3">
            <div class="card h-100 shadow-sm border-0 hover-card">
              <div class="card-body d-flex flex-column justify-content-center align-items-center text-center py-4">
                <i class="bi bi-door-closed-fill mb-3" style="font-size: 2.5rem;"></i>
                <h5 class="card-title mb-3">Szobák</h5>
                <p class="card-text display-6 fw-bold mb-3">
                  <template v-if="loading">
                    <span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                  </template>
                  <template v-else>{{ statistics.totalRooms || 0 }}</template>
                </p>
                <span class="badge bg-info px-3 py-2">Összes</span>
              </div>
            </div>
          </div>
          <div class="col-12 col-sm-6 col-lg-3">
            <div class="card h-100 shadow-sm border-0 hover-card">
              <div class="card-body d-flex flex-column justify-content-center align-items-center text-center py-4">
                <i class="bi bi-bar-chart-fill mb-3" style="font-size: 2.5rem;"></i>
                <h5 class="card-title mb-3">Foglaltság</h5>
                <p class="card-text display-6 fw-bold mb-3">
                  <template v-if="loading">
                    <span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                  </template>
                  <template v-else>{{ statistics.averageOccupancy || 0 }}%</template>
                </p>
                <span class="badge bg-warning text-dark px-3 py-2">Átlag</span>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Admin Main Content -->
        <div v-if="isAdmin" class="row">
          <!-- Left Column - Quick Actions -->
          <div class="col-md-8">
            <div class="card mb-4">
              <div class="card-header">
                <h5><i class="bi bi-lightning-fill me-2"></i>Gyors műveletek</h5>
              </div>
              <div class="card-body">
                <div class="row">
                  <div class="col-md-6 mb-3">
                    <router-link to="/students" class="btn-action btn-action-primary w-100">
                      <i class="bi bi-people me-2"></i>Diákok kezelése
                    </router-link>
                  </div>
                  <div class="col-md-6 mb-3">
                    <router-link to="/rooms" class="btn-action btn-action-secondary w-100">
                      <i class="bi bi-door-closed me-2"></i>Szobák kezelése
                    </router-link>
                  </div>
                  <div class="col-md-6 mb-3">
                    <router-link to="/reports" class="btn-action btn-action-primary w-100 text-white">
                      <i class="bi bi-file-earmark-text me-2"></i>Riportok
                    </router-link>
                  </div>
                  <div class="col-md-6 mb-3">
                    <button class="btn-action btn-action-outline w-100" @click="refreshStatistics">
                      <i class="bi bi-arrow-clockwise me-2"></i>Frissítés
                    </button>
                  </div>
                </div>
              </div>
            </div>
            
            <!-- System Status -->
            <div class="card">
              <div class="card-header">
                <h6><i class="bi bi-heart-pulse me-2"></i>Rendszer állapota</h6>
              </div>
              <div class="card-body">
                <div class="row text-center">
                  <div class="col-md-4">
                    <div class="d-flex align-items-center justify-content-center">
                      <i class="bi bi-circle-fill me-2"></i>
                      <span>Adatbázis</span>
                    </div>
                  </div>
                  <div class="col-md-4">
                    <div class="d-flex align-items-center justify-content-center">
                      <i class="bi bi-circle-fill me-2"></i>
                      <span>Szerver</span>
                    </div>
                  </div>
                  <div class="col-md-4">
                    <div class="d-flex align-items-center justify-content-center">
                      <i class="bi bi-circle-fill me-2"></i>
                      <span>API</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Right Column - Notifications -->
          <div class="col-md-4">
            <NotificationInbox />
          </div>
        </div>
        
        <!-- Titkár nézet - üdvözlés és gyors gombok -->
        <div v-else>
          <div class="row">
            <div class="col-12">
              <div class="alert alert-info">
                <h4>Üdvözöljük, {{ authStore.user?.username }}!</h4>
                <p>Ön titkár jogosultsággal rendelkezik. Az alábbi műveleteket végezheti:</p>
              </div>
            </div>
          </div>
          
          <div class="row mt-4">
            <div class="col-md-6">
              <div class="card">
                <div class="card-header">
                  <h5>Gyors hivatkozások</h5>
                </div>
                <div class="card-body">
                  <router-link to="/students" class="btn btn-primary me-2 mb-2">Diákok kezelése</router-link>
                  <router-link to="/rooms" class="btn btn-secondary me-2 mb-2">Szobák kezelése</router-link>
                  <router-link v-if="isAdmin" to="/reports" class="btn btn-primary mb-2">Riportok</router-link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Typography Hierarchy - Dashboard Title */
.dashboard-title {
  font-size: 1.75rem;
  font-weight: 700;
  letter-spacing: 0.5px;
  color: var(--text-primary);
  text-shadow: 0 1px 2px var(--shadow-color, rgba(0, 0, 0, 0.1));
  margin-bottom: 1.5rem;
}

/* Typography Hierarchy - Section Headers */
.card-header h5 {
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 0;
}

/* Typography Hierarchy - Card Titles */
.card-body h5 {
  font-size: 0.95rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--text-secondary);
  margin-bottom: 1rem;
}

/* Typography Hierarchy - Statistics Numbers */
.card-body .display-6,
.card-body p.card-text {
  font-size: 2rem;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 1rem;
}

/* Dark theme adjustments for typography */
[data-theme="dark"] .card-header h5 {
  color: var(--text-primary);
}

[data-theme="dark"] .card-body h5 {
  color: var(--text-secondary);
}

[data-theme="dark"] .card-body .display-6,
[data-theme="dark"] .card-body p.card-text {
  color: var(--text-primary);
}

/* High contrast theme adjustments */
[data-theme="high-contrast"] .card-header h5 {
  color: var(--text-primary);
}

[data-theme="high-contrast"] .card-body h5 {
  color: var(--text-primary);
}

[data-theme="high-contrast"] .card-body .display-6,
[data-theme="high-contrast"] .card-body p.card-text {
  color: var(--text-primary);
}

/* Dark theme override for text-shadow */
[data-theme="dark"] .dashboard-title {
  text-shadow: none;
}

/* Statistics Cards (.stat-card) - Enhanced hover effects */
.stat-card {
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  border: 1px solid var(--border-primary);
  background: var(--bg-card-gradient);
  cursor: pointer;
}

.stat-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
  border-color: var(--primary-300);
}

.stat-card .card-body {
  transition: all 0.3s ease;
}

.stat-card:hover .card-body {
  background-color: rgba(99, 102, 241, 0.05);
}

/* Fallback for existing hover-card class */
.hover-card {
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  border: 1px solid var(--border-primary);
  background: var(--bg-card-gradient);
  cursor: pointer;
}

.hover-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
  border-color: var(--primary-300);
}

.hover-card .card-body {
  transition: all 0.3s ease;
}

.hover-card:hover .card-body {
  background-color: rgba(99, 102, 241, 0.05);
}

/* Responsive adjustments for better spacing */
@media (max-width: 576px) {
  .hover-card .card-body {
    padding: 1.5rem 1rem !important;
  }
  
  .hover-card i {
    font-size: 2rem !important;
  }
  
  .hover-card .card-title {
    font-size: 1rem;
    margin-bottom: 1rem !important;
  }
  
  .hover-card .card-text {
    font-size: 1.75rem !important;
  }
}

/* Ensure consistent badge styling */
.hover-card .badge {
  font-size: 0.875rem;
  font-weight: 600;
  border-radius: 6px;
  transition: all 0.3s ease;
}

/* Improve text contrast for better readability */
.hover-card .card-title {
  color: var(--text-dark);
  font-weight: 600;
}

.hover-card .card-text {
  color: var(--text-dark);
  margin-bottom: 0 !important;
}

/* Add subtle animation on card load */
.hover-card {
  animation: fadeInUp 0.6s ease-out;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>

<script>
import { ref, onMounted, computed } from 'vue'
import { useAuthStore } from '../store/auth'
import api from '../services/api'
import { toast } from 'vue3-toastify'
import NotificationInbox from '../components/NotificationInbox.vue'
import LoadingOverlay from '../components/LoadingOverlay.vue'

export default {
  name: 'DashboardView',
  components: {
    NotificationInbox,
    LoadingOverlay
  },
  setup() {
    const statistics = ref({})
    const loading = ref(false)
    const authStore = useAuthStore()

    // Ellenőrizzük, hogy admin-e a felhasználó
    const isAdmin = computed(() => {
      return authStore.user?.admin === true
    })

    const fetchStatistics = async () => {
      // Csak adminnak töltjük be a statisztikákat
      if (!isAdmin.value) {
        return
      }
      
      loading.value = true
      try {
        const response = await api.get('/diaks/statistics')
        if (response.data.success) {
          statistics.value = response.data.data
        } else {
          toast.error(response.data.error || 'Hiba a statisztikák lekérése közben')
        }
      } catch (error) {
        console.error('Hiba a statisztikák lekérése közben:', error)
        toast.error('Nem sikerült betölteni a statisztikákat')
      } finally {
        loading.value = false
      }
    }

    onMounted(() => {
      // Initialize auth state
      authStore.initializeAuth()
      fetchStatistics()
    })

    const refreshStatistics = async () => {
      await fetchStatistics()
      toast.success('Statisztikák frissítve')
    }

    return {
      statistics,
      loading,
      authStore,
      isAdmin,
      refreshStatistics
    }
  }
}
</script>
