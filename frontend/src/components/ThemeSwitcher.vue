<template>
  <div class="theme-switcher">
    <button
      class="btn theme-toggle-btn"
      @click="toggleTheme"
      :title="theme === 'light' ? 'Sötét mód bekapcsolása' : 'Világos mód bekapcsolása'"
      :aria-label="theme === 'light' ? 'Sötét mód bekapcsolása' : 'Világos mód bekapcsolása'"
      :aria-pressed="theme === 'dark'"
    >
      <span class="theme-icon" v-if="theme === 'light'">
        <i class="bi bi-moon-fill"></i>
      </span>
      <span class="theme-icon" v-else>
        <i class="bi bi-sun-fill"></i>
      </span>
    </button>
  </div>
</template>

<script>
import { defineComponent, computed, onMounted } from 'vue'
import { useThemeStore } from '../store/theme'

export default defineComponent({
  name: 'ThemeSwitcher',
  setup() {
    const themeStore = useThemeStore()

    // Téma betöltése komponens mountolásakor
    onMounted(() => {
      themeStore.loadTheme()
    })

    const theme = computed(() => themeStore.theme)

    const toggleTheme = () => {
      themeStore.toggleTheme()
    }

    return {
      theme,
      toggleTheme
    }
  }
})
</script>

<style scoped>
.theme-switcher {
  display: inline-flex;
  align-items: center;
}

.theme-toggle-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  padding: 0;
  border-radius: 50%;
  background-color: transparent;
  border: 2px solid rgba(255, 255, 255, 0.5);
  color: rgba(255, 255, 255, 0.9);
  transition: all 0.3s ease;
}

.theme-toggle-btn:hover {
  background-color: rgba(255, 255, 255, 0.1);
  border-color: rgba(255, 255, 255, 0.8);
  color: #ffffff;
  transform: rotate(15deg);
}

.theme-toggle-btn:focus {
  outline: none;
  box-shadow: 0 0 0 3px rgba(99, 173, 242, 0.5);
}

.theme-icon {
  display: flex;
  align-items: center;
  justify-content: center;
}

.theme-icon i {
  font-size: 1.1rem;
}

/* Animáció a nap/hold ikonokhoz */
.theme-toggle-btn:hover .theme-icon i {
  animation: wiggle 0.5s ease-in-out;
}

@keyframes wiggle {
  0%, 100% { transform: rotate(0deg); }
  25% { transform: rotate(-10deg); }
  75% { transform: rotate(10deg); }
}

/* Sötét mód gomb stílus */
[data-theme="dark"] .theme-toggle-btn {
  border-color: rgba(255, 255, 255, 0.3);
  color: rgba(255, 255, 255, 0.8);
}

[data-theme="dark"] .theme-toggle-btn:hover {
  background-color: rgba(255, 255, 255, 0.15);
  border-color: rgba(255, 255, 255, 0.6);
  color: #ffffff;
}
</style>