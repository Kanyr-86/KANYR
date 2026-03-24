<template>
  <div class="theme-toggle" :class="{ 'theme-toggle-collapsed': collapsed }">
    <div class="theme-toggle-header">
      <i class="bi bi-circle-half" :class="iconClass"></i>
      <span v-if="!collapsed" class="theme-label">Téma</span>
    </div>
    
    <div class="theme-controls">
      <button 
        v-for="theme in themes" 
        :key="theme.value"
        class="theme-btn"
        :class="{
          'theme-btn-active': currentTheme === theme.value,
          'theme-btn-collapsed': collapsed
        }"
        @click="setTheme(theme.value)"
        :title="theme.label"
        :aria-pressed="currentTheme === theme.value"
      >
        <i class="bi" :class="theme.icon"></i>
        <span v-if="!collapsed" class="theme-name">{{ theme.label }}</span>
      </button>
    </div>
    
    <div class="theme-indicator" :class="`theme-indicator-${currentTheme}`"></div>
  </div>
</template>

<script>
import { computed } from 'vue'
import { useThemeStore } from '../store/theme'

export default {
  name: 'ThemeToggle',
  props: {
    collapsed: {
      type: Boolean,
      default: false
    }
  },
  setup() {
    const themeStore = useThemeStore()
    
    const currentTheme = computed(() => themeStore.theme)
    const isDark = computed(() => themeStore.isDark)
    
    const iconClass = computed(() => {
      if (isDark.value) {
        return 'bi-moon-stars-fill text-warning'
      }
      return 'bi-sun-fill text-warning'
    })
    
    const themes = [
      {
        value: 'light',
        label: 'Világos',
        icon: 'bi-sun-fill'
      },
      {
        value: 'dark',
        label: 'Sötét',
        icon: 'bi-moon-stars-fill'
      }
    ]
    
    const setTheme = (theme) => {
      themeStore.setTheme(theme)
    }
    
    return {
      currentTheme,
      isDark,
      iconClass,
      themes,
      setTheme
    }
  }
}
</script>

<style scoped>
.theme-toggle {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px;
  background: var(--bg-tertiary);
  border: 1px solid var(--border-primary);
  border-radius: 12px;
  transition: all 0.3s ease;
  box-shadow: var(--shadow-sm);
}

.theme-toggle-collapsed {
  padding: 10px;
  gap: 6px;
}

.theme-toggle-collapsed .theme-controls {
  flex-direction: row;
  flex-wrap: wrap;
  justify-content: center;
  gap: 4px;
}

.theme-toggle-header {
  display: flex;
  align-items: center;
  gap: 10px;
  font-weight: 600;
  color: var(--text-secondary);
  font-size: 0.875rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.theme-label {
  transition: opacity 0.3s ease;
}

.theme-controls {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.theme-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: var(--bg-card);
  border: 1px solid var(--border-primary);
  border-radius: 8px;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.2s ease;
  text-align: left;
  width: 100%;
  font-size: 0.875rem;
}

.theme-btn:hover {
  background: var(--bg-tertiary);
  border-color: var(--border-secondary);
  color: var(--text-primary);
  transform: translateX(2px);
}

.theme-btn-active {
  background: var(--primary-50);
  border-color: var(--primary-500);
  color: var(--primary-600);
  font-weight: 600;
  box-shadow: 0 2px 8px rgba(99, 102, 241, 0.2);
}

.theme-btn-active:hover {
  background: var(--primary-100);
  transform: translateX(2px);
}

.theme-btn-collapsed {
  justify-content: center;
  padding: 8px;
  width: 36px;
  height: 36px;
  margin: 0 auto;
}

.theme-name {
  flex: 1;
  transition: opacity 0.3s ease;
}

.theme-indicator {
  height: 3px;
  border-radius: 2px;
  background: var(--primary-500);
  transition: all 0.3s ease;
  margin-top: 4px;
}

.theme-indicator-dark {
  background: var(--secondary-500);
}

/* Dark theme adjustments */
[data-theme="dark"] .theme-toggle {
  background: var(--bg-tertiary);
  border-color: var(--border-primary);
}

[data-theme="dark"] .theme-btn {
  background: var(--bg-card);
  border-color: var(--border-primary);
  color: var(--text-secondary);
}

[data-theme="dark"] .theme-btn:hover {
  background: var(--bg-tertiary);
  border-color: var(--border-secondary);
  color: var(--text-primary);
}

[data-theme="dark"] .theme-btn-active {
  background: rgba(99, 102, 241, 0.15);
  border-color: var(--primary-500);
  color: var(--primary-300);
}

[data-theme="dark"] .theme-btn-active:hover {
  background: rgba(99, 102, 241, 0.2);
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .theme-toggle {
    padding: 12px;
  }
  
  .theme-toggle-header {
    font-size: 0.8rem;
  }
  
  .theme-btn {
    font-size: 0.8rem;
    padding: 6px 10px;
  }
}

/* Accessibility improvements */
.theme-btn:focus {
  outline: 2px solid var(--primary-500);
  outline-offset: 2px;
}

.theme-btn:active {
  transform: translateY(1px);
}

/* Smooth transitions for theme changes */
.theme-toggle {
  will-change: background-color, border-color;
}

.theme-btn {
  will-change: background-color, border-color, color, transform;
}
</style>