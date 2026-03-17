<template>
  <nav aria-label="breadcrumb" class="breadcrumb-container">
    <ol class="breadcrumb m-0">
      <li 
        v-for="(crumb, index) in breadcrumbs" 
        :key="index"
        class="breadcrumb-item"
        :class="{ active: index === breadcrumbs.length - 1 }"
      >
        <router-link 
          v-if="index < breadcrumbs.length - 1 && crumb.to"
          :to="crumb.to"
          class="breadcrumb-link"
        >
          {{ crumb.title }}
        </router-link>
        <span v-else class="breadcrumb-text">
          {{ crumb.title }}
        </span>
      </li>
    </ol>
  </nav>
</template>

<script setup>
import { computed, watch } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()

// Breadcrumb definitions with hierarchical structure
const breadcrumbMap = {
  // Admin routes
  'Dashboard': { title: 'Admin Dashboard', to: '/dashboard' },
  'Students': { title: 'Diákok', to: '/students' },
  'Parents': { title: 'Szülők', to: '/parents' },
  'Rooms': { title: 'Szobák', to: '/rooms' },
  'Reports': { title: 'Riportok', to: '/reports' },
  
  // Student routes
  'StudentDashboard': { title: 'Diák Dashboard', to: '/student-dashboard' },
  'StudentRooms': { title: 'Szobám', to: '/student-rooms' },
  'StudentNotifications': { title: 'Értesítések', to: '/student-notifications' },
  
  // Auth routes
  'Login': { title: 'Bejelentkezés', to: '/login' },
  'NotFound': { title: 'Oldal nem található', to: null }
}

// Generate breadcrumbs based on current route
const breadcrumbs = computed(() => {
  const routeName = route.name
  const crumbs = []
  
  if (!routeName) return crumbs
  
  // Get the current breadcrumb
  const currentCrumb = breadcrumbMap[routeName]
  if (!currentCrumb) return crumbs
  
  // Add home/dashboard breadcrumb for non-root routes
  if (routeName !== 'Dashboard' && routeName !== 'StudentDashboard' && routeName !== 'Login') {
    const isStudentRoute = routeName.startsWith('Student')
    const homeRoute = isStudentRoute ? 'StudentDashboard' : 'Dashboard'
    const homeCrumb = breadcrumbMap[homeRoute]
    
    if (homeCrumb) {
      crumbs.push({
        title: homeCrumb.title,
        to: homeCrumb.to
      })
    }
  }
  
  // Add current breadcrumb
  crumbs.push({
    title: currentCrumb.title,
    to: currentCrumb.to
  })
  
  return crumbs
})

// Watch for route changes to update breadcrumbs
watch(() => route.name, () => {
  // Breadcrumbs update automatically via computed property
}, { immediate: true })
</script>

<style scoped>
.breadcrumb-container {
  background-color: var(--bg-card);
  border: 1px solid var(--border-primary);
  border-radius: var(--border-radius-md);
  padding: 8px 16px;
  margin-bottom: 16px;
  box-shadow: var(--shadow-sm);
}

.breadcrumb {
  background-color: transparent;
  padding: 0;
  margin: 0;
  font-size: 0.875rem;
}

.breadcrumb-item {
  color: var(--text-secondary);
}

.breadcrumb-item + .breadcrumb-item::before {
  color: var(--text-tertiary);
  content: "›";
  padding: 0 8px;
}

.breadcrumb-link {
  color: var(--text-secondary);
  text-decoration: none;
  transition: color 0.2s ease;
  font-weight: 500;
}

.breadcrumb-link:hover {
  color: var(--primary-600);
  text-decoration: none;
}

.breadcrumb-text {
  color: var(--text-primary);
  font-weight: 600;
}

.breadcrumb-item.active .breadcrumb-text {
  color: var(--text-primary);
  font-weight: 700;
}

/* Dark theme adjustments */
[data-theme="dark"] .breadcrumb-container {
  background-color: var(--bg-card);
  border-color: var(--border-secondary);
}

[data-theme="dark"] .breadcrumb-item {
  color: var(--text-secondary);
}

[data-theme="dark"] .breadcrumb-item + .breadcrumb-item::before {
  color: var(--text-tertiary);
}

[data-theme="dark"] .breadcrumb-link {
  color: var(--text-secondary);
}

[data-theme="dark"] .breadcrumb-link:hover {
  color: var(--primary-400);
}

[data-theme="dark"] .breadcrumb-text {
  color: var(--text-primary);
}

/* High contrast theme adjustments */
[data-theme="high-contrast"] .breadcrumb-container {
  background-color: var(--bg-page);
  border: 2px solid var(--border-primary);
}

[data-theme="high-contrast"] .breadcrumb-item {
  color: var(--text-primary);
}

[data-theme="high-contrast"] .breadcrumb-item + .breadcrumb-item::before {
  color: var(--text-primary);
}

[data-theme="high-contrast"] .breadcrumb-link {
  color: var(--text-primary);
  border-bottom: 1px solid transparent;
}

[data-theme="high-contrast"] .breadcrumb-link:hover {
  color: var(--text-inverse);
  background-color: var(--text-primary);
  text-decoration: none;
  padding: 2px 4px;
  border-radius: 4px;
}

[data-theme="high-contrast"] .breadcrumb-text {
  color: var(--text-primary);
  font-weight: 700;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .breadcrumb-container {
    padding: 6px 12px;
    margin-bottom: 12px;
  }
  
  .breadcrumb {
    font-size: 0.8rem;
  }
  
  .breadcrumb-item + .breadcrumb-item::before {
    padding: 0 6px;
  }
}
</style>