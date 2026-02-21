<template>
  <div class="container-fluid">
    <div class="row">
      <div class="col-12">
        <h2 class="dashboard-title">
          <i class="bi bi-speedometer2 me-2"></i>KANYR Dashboard
        </h2>
        
        <!-- Admin (Főtitkár) nézet - statisztikákkal -->
        <div v-if="isAdmin" class="row mb-4 g-3">
          <div class="col-6 col-lg-3">
            <StatCard
              title="Diákok"
              :value="statistics.totalStudents || 0"
              subtitle="Összes regisztrált"
              icon="bi bi-people-fill"
              variant="primary"
              :loading="loading"
            />
          </div>
          <div class="col-6 col-lg-3">
            <StatCard
              title="Aktív diákok"
              :value="statistics.activeStudents || 0"
              subtitle="Bentlakók"
              icon="bi bi-person-check-fill"
              variant="success"
              :loading="loading"
              :showProgress="true"
              :progressValue="statistics.activeStudents || 0"
              :progressMax="statistics.totalStudents || 1"
              progressLabel="Aktivitás"
            />
          </div>
          <div class="col-6 col-lg-3">
            <StatCard
              title="Szobák"
              :value="statistics.totalRooms || 0"
              subtitle="Összes szoba"
              icon="bi bi-door-closed-fill"
              variant="info"
              :loading="loading"
            />
          </div>
          <div class="col-6 col-lg-3">
            <StatCard
              title="Foglaltság"
              :value="statistics.averageOccupancy || 0"
              suffix="%"
              subtitle="Átlagos kihasználtság"
              icon="bi bi-bar-chart-fill"
              variant="warning"
              :loading="loading"
              :showProgress="true"
              :progressValue="statistics.averageOccupancy || 0"
              progressLabel="Kihasználtság"
            />
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
                    <router-link to="/students" class="btn btn-primary btn-lg w-100">
                      <i class="bi bi-people me-2"></i>Diákok kezelése
                    </router-link>
                  </div>
                  <div class="col-md-6 mb-3">
                    <router-link to="/rooms" class="btn btn-secondary btn-lg w-100">
                      <i class="bi bi-door-closed me-2"></i>Szobák kezelése
                    </router-link>
                  </div>
                  <div class="col-md-6 mb-3">
                    <router-link to="/reports" class="btn btn-info btn-lg w-100">
                      <i class="bi bi-file-earmark-text me-2"></i>Riportok
                    </router-link>
                  </div>
                  <div class="col-md-6 mb-3">
                    <button class="btn btn-outline-primary btn-lg w-100" @click="refreshStatistics">
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
                      <i class="bi bi-circle-fill text-success me-2"></i>
                      <span>Adatbázis</span>
                    </div>
                  </div>
                  <div class="col-md-4">
                    <div class="d-flex align-items-center justify-content-center">
                      <i class="bi bi-circle-fill text-primary me-2"></i>
                      <span>Szerver</span>
                    </div>
                  </div>
                  <div class="col-md-4">
                    <div class="d-flex align-items-center justify-content-center">
                      <i class="bi bi-circle-fill text-warning me-2"></i>
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
                  <router-link v-if="isAdmin" to="/reports" class="btn btn-info mb-2">Riportok</router-link>
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
.dashboard-title {
  color: var(--text-inverse, #ffffff);
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
  margin-bottom: 1.5rem;
  font-weight: 600;
}
</style>

<script>
import { ref, onMounted, computed } from 'vue'
import { useAuthStore } from '../store/auth'
import api from '../services/api'
import { toast } from 'vue3-toastify'
import NotificationInbox from '../components/NotificationInbox.vue'
import StatCard from '../components/StatCard.vue'

export default {
  name: 'DashboardView',
  components: {
    NotificationInbox,
    StatCard
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
