<template>
  <div class="container-fluid">
    <div class="row">
      <div class="col-12">
        <h2>KANYR Dashboard</h2>
        <div class="row">
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
                <p class="card-text">{{ statistics.occupancyRate || 0 }}%</p>
              </div>
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
                <router-link to="/students" class="btn btn-primary me-2">Diákok kezelése</router-link>
                <router-link to="/rooms" class="btn btn-secondary">Szobák kezelése</router-link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'
import { useAuthStore } from '../store/auth'
import api from '../services/api'
import { toast } from 'vue3-toastify'

export default {
  name: 'DashboardView',
  setup() {
    const statistics = ref({})
    const loading = ref(false)
    const authStore = useAuthStore()

    const fetchStatistics = async () => {
      loading.value = true
      try {
        const response = await api.get('/diak/statistics')
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
      loading
    }
  }
}
</script>
