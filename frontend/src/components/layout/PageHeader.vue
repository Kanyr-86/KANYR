<template>
  <div class="page-header">
    <!-- Breadcrumbs -->
    <nav v-if="breadcrumbs && breadcrumbs.length" aria-label="breadcrumb">
      <ol class="breadcrumb mb-2">
        <li
          v-for="(crumb, index) in breadcrumbs"
          :key="index"
          :class="['breadcrumb-item', { active: index === breadcrumbs.length - 1 }]"
        >
          <router-link v-if="crumb.to && index < breadcrumbs.length - 1" :to="crumb.to">
            {{ crumb.label }}
          </router-link>
          <span v-else>{{ crumb.label }}</span>
        </li>
      </ol>
    </nav>

    <!-- Header Content -->
    <div class="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-2">
      <div>
        <h1 class="page-title h3 mb-1">{{ title }}</h1>
        <p v-if="subtitle" class="page-subtitle text-muted mb-0">
          {{ subtitle }}
        </p>
      </div>
      <div v-if="$slots.actions" class="page-actions">
        <slot name="actions"></slot>
      </div>
    </div>
  </div>
</template>

<script>
import { defineComponent } from 'vue'

/**
 * PageHeader - Consistent page header component with title, subtitle, and breadcrumbs
 * 
 * @example Basic usage
 * ```vue
 * <PageHeader 
 *   title="Diákok" 
 *   subtitle="Összes regisztrált diák listája" 
 * />
 * ```
 * 
 * @example With breadcrumbs and actions
 * ```vue
 * <PageHeader
 *   title="Diák szerkesztése"
 *   :breadcrumbs="[
 *     { label: 'Kezdőlap', to: '/' },
 *     { label: 'Diákok', to: '/students' },
 *     { label: 'Szerkesztés' }
 *   ]"
 * >
 *   <template #actions>
 *     <BaseButton variant="primary">Mentés</BaseButton>
 *   </template>
 * </PageHeader>
 * ```
 */
export default defineComponent({
  name: 'PageHeader',

  props: {
    /**
     * Page title
     * @type {string}
     */
    title: {
      type: String,
      required: true
    },

    /**
     * Optional subtitle
     * @type {string}
     */
    subtitle: {
      type: String,
      default: ''
    },

    /**
     * Breadcrumb items
     * @type {Array<{label: string, to?: string|object}>}
     */
    breadcrumbs: {
      type: Array,
      default: () => []
    }
  }
})
</script>

<style scoped>
.page-header {
  margin-bottom: 1.5rem;
}

.page-title {
  font-weight: 600;
  color: var(--text-primary);
}

.page-subtitle {
  font-size: 0.875rem;
}

.page-actions {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.breadcrumb {
  font-size: 0.875rem;
}
</style>