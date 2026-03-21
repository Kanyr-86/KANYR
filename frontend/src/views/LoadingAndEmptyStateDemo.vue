<template>
  <div class="container-fluid">
    <div class="row">
      <div class="col-12">
        <div class="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h2>Test: Loading és Empty State Javítások</h2>
<p style="color: var(--text-muted)" class="mb-0">Demo a javított betöltési állapotokról és üres állapotokról</p>
          </div>
          <div class="d-flex gap-2">
            <button class="btn btn-primary" @click="toggleLoading">
              {{ loading ? 'Betöltés leállítása' : 'Betöltés indítása' }}
            </button>
            <button class="btn btn-warning" @click="toggleEmptyState">
              {{ showEmptyState ? 'Adatok megjelenítése' : 'Üres állapot mutatása' }}
            </button>
          </div>
        </div>

        <!-- Példa: Javított LoadingOverlay használata -->
        <div class="row mb-4">
          <div class="col-md-6">
            <div class="card">
              <div class="card-header">
                <h5>Javított LoadingOverlay Példák</h5>
              </div>
              <div class="card-body">
                <div class="mb-3">
                  <button class="btn btn-primary me-2" @click="showFetchingLoading = true">
                    Adatok betöltése
                  </button>
                  <button class="btn btn-success me-2" @click="showSavingLoading = true">
                    Mentés folyamatban
                  </button>
                  <button class="btn btn-danger me-2" @click="showDeletingLoading = true">
                    Törlés folyamatban
                  </button>
                  <button class="btn btn-warning me-2" @click="showTransferringLoading = true">
                    Áthelyezés folyamatban
                  </button>
                </div>
                
                <div class="alert alert-info">
                  <small>
                    <strong>Újdonságok:</strong> Kontextusfüggő üzenetek, típus-specifikus színek, 
                    progress bar támogatás, becslési idő, jobb hozzáférhetőség
                  </small>
                </div>
              </div>
            </div>
          </div>

          <div class="col-md-6">
            <div class="card">
              <div class="card-header">
                <h5>Javított EmptyState Példák</h5>
              </div>
              <div class="card-body">
                <div class="mb-3">
                  <button class="btn btn-info me-2" @click="showNotificationEmpty = true">
                    Értesítés üres állapot
                  </button>
                  <button class="btn btn-secondary me-2" @click="showSearchEmpty = true">
                    Keresés üres állapot
                  </button>
                  <button class="btn btn-dark me-2" @click="showPermissionEmpty = true">
                    Jogosultság üres állapot
                  </button>
                </div>
                
                <div class="alert alert-info">
                  <small>
                    <strong>Újdonságok:</strong> Kontextusfüggő ikonok, részletes leírások, 
                    hasznos útmutatások, akciógombok, másodlagos műveletek
                  </small>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- LoadingOverlay példák -->
        <LoadingOverlay 
          :show="showFetchingLoading" 
          message="Diákok betöltése..." 
          subMessage="Kérjük, várjon amíg betöltjük a diákok adatait"
          type="fetching"
          :estimatedTime="'Kb. 2-3 másodperc'"
          @click="showFetchingLoading = false"
        />

        <LoadingOverlay 
          :show="showSavingLoading" 
          message="Diák mentése..." 
          subMessage="Az adatok mentése folyamatban"
          type="saving"
          :showProgress="true"
          :progress="savingProgress"
          progressText="Feldolgozás alatt..."
          :estimatedTime="'Kb. 1 másodperc'"
          @click="showSavingLoading = false"
        />

        <LoadingOverlay 
          :show="showDeletingLoading" 
          message="Diák törlése..." 
          subMessage="A diák adatainak törlése folyamatban"
          type="deleting"
          :showProgress="true"
          :progress="deletingProgress"
          progressText="Törlés folyamatban..."
          :estimatedTime="'Kb. 3 másodperc'"
          @click="showDeletingLoading = false"
        />

        <LoadingOverlay 
          :show="showTransferringLoading" 
          message="Diák áthelyezése..." 
          subMessage="A diák szobába költöztetése folyamatban"
          type="transferring"
          :showProgress="true"
          :progress="transferringProgress"
          progressText="Költöztetés folyamatban..."
          :estimatedTime="'Kb. 5 másodperc'"
          @click="showTransferringLoading = false"
        />

        <!-- EmptyState példák -->
        <div class="row">
          <div class="col-md-4" v-if="showNotificationEmpty">
            <EmptyState
              icon="inbox"
              title="Nincsenek értesítések"
              description="Még nem érkezett új értesítés."
              contextText="Az értesítések akkor jelennek meg, amikor fontos változás történik a szobával vagy a diák adataival kapcsolatban."
              actionText="Diákok megtekintése"
              action-route="/students"
              action-icon="bi bi-people"
            >
              <template #secondaryActions>
                <button class="btn btn-outline-secondary btn-sm" @click="showNotificationEmpty = false">
                  <i class="bi bi-arrow-clockwise me-1"></i>Frissítés
                </button>
              </template>
            </EmptyState>
          </div>

          <div class="col-md-4" v-if="showSearchEmpty">
            <EmptyState
              icon="search"
              title="Nincs találat"
              description="A keresési feltételeknek nincs megfelelő eredmény."
              contextText="Próbálja meg más kulcsszavakkal vagy módosítsa a szűrőfeltételeket."
              actionText="Összes diák megtekintése"
              action-route="/students"
              action-icon="bi bi-list"
            >
              <template #secondaryActions>
                <button class="btn btn-outline-secondary btn-sm" @click="showSearchEmpty = false">
                  <i class="bi bi-x-circle me-1"></i>Szűrők törlése
                </button>
              </template>
            </EmptyState>
          </div>

          <div class="col-md-4" v-if="showPermissionEmpty">
            <EmptyState
              icon="lock"
              title="Hozzáférés korlátozva"
              description="Nincs engedélye a tartalom megtekintéséhez."
              contextText="Kérjen hozzáférést a rendszergazdától, vagy lépjen be másik fiókkal."
              actionText="Bejelentkezés"
              action-route="/login"
              action-icon="bi bi-box-arrow-in-right"
            >
              <template #secondaryActions>
                <button class="btn btn-outline-secondary btn-sm" @click="showPermissionEmpty = false">
                  <i class="bi bi-question-circle me-1"></i>Segítség kérése
                </button>
              </template>
            </EmptyState>
          </div>

          <!-- Alapértelmezett üres állapot -->
          <div class="col-md-4" v-if="showDefaultEmpty">
            <EmptyState
              title="Nincs megjeleníthető tartalom"
              description="Jelenleg nincs megjeleníthető tartalom ebben a szekcióban."
              contextText="Ez a szekció később lesz feltöltve tartalommal."
            />
          </div>
        </div>

        <!-- Összegzés -->
        <div class="row mt-4">
          <div class="col-12">
            <div class="card">
              <div class="card-header">
                <h5>Fejlesztési Összegzés</h5>
              </div>
              <div class="card-body">
                <div class="row">
                  <div class="col-md-6">
                    <h6>✅ Elvégzett Fejlesztések:</h6>
                    <ul class="list-group list-group-flush">
                      <li class="list-group-item d-flex justify-content-between align-items-center">
                        <span>Enhanced LoadingOverlay</span>
                        <span class="badge bg-success">Kész</span>
                      </li>
                      <li class="list-group-item d-flex justify-content-between align-items-center">
                        <span>Context-aware loading messages</span>
                        <span class="badge bg-success">Kész</span>
                      </li>
                      <li class="list-group-item d-flex justify-content-between align-items-center">
                        <span>Enhanced EmptyState component</span>
                        <span class="badge bg-success">Kész</span>
                      </li>
                      <li class="list-group-item d-flex justify-content-between align-items-center">
                        <span>NotificationInbox improvements</span>
                        <span class="badge bg-success">Kész</span>
                      </li>
                      <li class="list-group-item d-flex justify-content-between align-items-center">
                        <span>StudentNotificationsView improvements</span>
                        <span class="badge bg-success">Kész</span>
                      </li>
                      <li class="list-group-item d-flex justify-content-between align-items-center">
                        <span>StudentsView loading enhancements</span>
                        <span class="badge bg-success">Kész</span>
                      </li>
                      <li class="list-group-item d-flex justify-content-between align-items-center">
                        <span>RoomsView loading enhancements</span>
                        <span class="badge bg-success">Kész</span>
                      </li>
                    </ul>
                  </div>
                  <div class="col-md-6">
                    <h6>🎯 Javított Funkciók:</h6>
                    <ul class="list-group list-group-flush">
                      <li class="list-group-item d-flex justify-content-between align-items-center">
                        <span>Generic loading states → Context-aware</span>
                        <span class="badge bg-primary">Javítva</span>
                      </li>
                      <li class="list-group-item d-flex justify-content-between align-items-center">
                        <span>Simple empty states → Rich guidance</span>
                        <span class="badge bg-primary">Javítva</span>
                      </li>
                      <li class="list-group-item d-flex justify-content-between align-items-center">
                        <span>Basic icons → Semantic icons</span>
                        <span class="badge bg-primary">Javítva</span>
                      </li>
                      <li class="list-group-item d-flex justify-content-between align-items-center">
                        <span>Single action → Multiple actions</span>
                        <span class="badge bg-primary">Javítva</span>
                      </li>
                      <li class="list-group-item d-flex justify-content-between align-items-center">
                        <span>Improved accessibility</span>
                        <span class="badge bg-primary">Javítva</span>
                      </li>
                      <li class="list-group-item d-flex justify-content-between align-items-center">
                        <span>Better theme support</span>
                        <span class="badge bg-primary">Javítva</span>
                      </li>
                    </ul>
                  </div>
                </div>
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
import LoadingOverlay from '../components/LoadingOverlay.vue'
import EmptyState from '../components/layout/EmptyState.vue'

export default {
  name: 'LoadingAndEmptyStateDemo',
  components: {
    LoadingOverlay,
    EmptyState
  },
  setup() {
    const loading = ref(false)
    const showEmptyState = ref(false)
    
    // LoadingOverlay állapotok
    const showFetchingLoading = ref(false)
    const showSavingLoading = ref(false)
    const showDeletingLoading = ref(false)
    const showTransferringLoading = ref(false)
    
    // Progress értékek
    const savingProgress = ref(0)
    const deletingProgress = ref(0)
    const transferringProgress = ref(0)
    
    // EmptyState állapotok
    const showNotificationEmpty = ref(false)
    const showSearchEmpty = ref(false)
    const showPermissionEmpty = ref(false)
    const showDefaultEmpty = ref(false)

    // Progress animációk
    const startProgressAnimation = (progressRef, duration = 3000) => {
      const startTime = Date.now()
      const animate = () => {
        const elapsed = Date.now() - startTime
        const progress = Math.min((elapsed / duration) * 100, 100)
        progressRef.value = Math.floor(progress)
        
        if (progress < 100) {
          requestAnimationFrame(animate)
        }
      }
      animate()
    }

    // Eseménykezelők
    const toggleLoading = () => {
      loading.value = !loading.value
    }

    const toggleEmptyState = () => {
      showEmptyState.value = !showEmptyState.value
    }

    // LoadingOverlay kezelők
    const showFetchingLoadingHandler = () => {
      showFetchingLoading.value = true
    }

    const showSavingLoadingHandler = () => {
      showSavingLoading.value = true
      startProgressAnimation(savingProgress, 2000)
    }

    const showDeletingLoadingHandler = () => {
      showDeletingLoading.value = true
      startProgressAnimation(deletingProgress, 3000)
    }

    const showTransferringLoadingHandler = () => {
      showTransferringLoading.value = true
      startProgressAnimation(transferringProgress, 5000)
    }

    // EmptyState kezelők
    const showNotificationEmptyHandler = () => {
      showNotificationEmpty.value = true
      showSearchEmpty.value = false
      showPermissionEmpty.value = false
      showDefaultEmpty.value = false
    }

    const showSearchEmptyHandler = () => {
      showSearchEmpty.value = true
      showNotificationEmpty.value = false
      showPermissionEmpty.value = false
      showDefaultEmpty.value = false
    }

    const showPermissionEmptyHandler = () => {
      showPermissionEmpty.value = true
      showNotificationEmpty.value = false
      showSearchEmpty.value = false
      showDefaultEmpty.value = false
    }

    const showDefaultEmptyHandler = () => {
      showDefaultEmpty.value = true
      showNotificationEmpty.value = false
      showSearchEmpty.value = false
      showPermissionEmpty.value = false
    }

    onMounted(() => {
      // Alapértelmezett üres állapot megjelenítése
      showDefaultEmpty.value = true
    })

    return {
      loading,
      showEmptyState,
      // LoadingOverlay állapotok
      showFetchingLoading,
      showSavingLoading,
      showDeletingLoading,
      showTransferringLoading,
      // Progress értékek
      savingProgress,
      deletingProgress,
      transferringProgress,
      // EmptyState állapotok
      showNotificationEmpty,
      showSearchEmpty,
      showPermissionEmpty,
      showDefaultEmpty,
      // Eseménykezelők
      toggleLoading,
      toggleEmptyState,
      showFetchingLoadingHandler,
      showSavingLoadingHandler,
      showDeletingLoadingHandler,
      showTransferringLoadingHandler,
      showNotificationEmptyHandler,
      showSearchEmptyHandler,
      showPermissionEmptyHandler,
      showDefaultEmptyHandler
    }
  }
}
</script>

<style scoped>
.card {
  box-shadow: var(--shadow-card);
  border: 1px solid var(--border-primary);
}

.card-header {
  background-color: var(--bg-tertiary);
  border-bottom: 1px solid var(--border-secondary);
}

.list-group-item {
  border: none;
  padding: 0.5rem 1rem;
}

.list-group-item:last-child {
  border-bottom: 1px solid var(--border-primary);
}

.badge {
  font-size: 0.75rem;
  padding: 0.25rem 0.5rem;
}

/* High contrast theme support */
[data-theme="high-contrast"] .card {
  border: 2px solid var(--border-primary);
}

[data-theme="high-contrast"] .card-header {
  background-color: var(--bg-page);
  border-bottom: 2px solid var(--border-primary);
  color: var(--text-inverse);
}

/* Dark theme support */
[data-theme="dark"] .card {
  background: var(--bg-card);
  border-color: var(--border-dark);
}

[data-theme="dark"] .card-header {
  background-color: var(--bg-tertiary);
  border-bottom-color: var(--border-dark);
}
</style>