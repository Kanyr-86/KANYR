<template>
  <div class="container-fluid">
    <div class="row">
      <div class="col-12">
        <h2 class="dashboard-title">KANYR Dashboard</h2>
        
        <!-- Admin (Főtitkár) nézet - statisztikákkal -->
        <div v-if="isAdmin" class="row">
          <div class="col-md-3">
            <div class="card">
              <div class="card-body">
                <h5 class="card-title">Diákok</h5>
                <p class="card-text">{{ statistics.totalStudents || 0 }}</p>
              </div>
            </div>
          </div>
          <div class="col-md-3">
            <div class="card">
              <div class="card-body">
                <h5 class="card-title">Aktív diákok</h5>
                <p class="card-text">{{ statistics.activeStudents || 0 }}</p>
              </div>
            </div>
          </div>
          <div class="col-md-3">
            <div class="card">
              <div class="card-body">
                <h5 class="card-title">Szobák</h5>
                <p class="card-text">{{ statistics.totalRooms || 0 }}</p>
              </div>
            </div>
          </div>
          <div class="col-md-3">
            <div class="card">
              <div class="card-body">
                <h5 class="card-title">Foglaltság</h5>
                <p class="card-text">{{ statistics.averageOccupancy || 0 }}%</p>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Titkár nézet - üdvözlés és gyors gombok -->
        <div v-else class="row">
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
</template>

<style scoped>
.dashboard-title {
  color: #ffffff !important;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
  margin-bottom: 1.5rem;
  font-weight: 600;
}
</style>

<script>
import { ref, onMounted, computed } from 'vue'
import { useAuthStore } from '../store/auth'
import api from '../services/api'
import { toast } from 'vue3-toastify'

export default {
  name: 'DashboardView',
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

    return {
      statistics,
      loading,
      authStore,
      isAdmin
    }
  }
}
</script>
