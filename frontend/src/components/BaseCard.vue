<template>
  <div
    class="card base-card"
    :class="[
      variantClass,
      { 'card-shadow': shadow, 'card-hover': shadow }
    ]"
  >
    <!-- Header -->
    <div
      v-if="hasHeader"
      class="card-header"
      :class="{ 'border-bottom-0': loading }"
    >
      <slot name="header">
        <div class="d-flex justify-content-between align-items-start">
          <div>
            <h5 v-if="title" class="card-title mb-1">
              {{ title }}
            </h5>
            <p v-if="subtitle" class="card-subtitle text-muted mb-0 small">
              {{ subtitle }}
            </p>
          </div>
          <div v-if="$slots.actions" class="card-actions">
            <slot name="actions"></slot>
          </div>
        </div>
      </slot>
    </div>

    <!-- Body -->
    <div
      class="card-body"
      :class="{ 'p-0': noPadding, 'card-body-loading': loading }"
    >
      <!-- Skeleton Loader -->
      <template v-if="loading">
        <div class="skeleton-loader">
          <div class="skeleton-line skeleton-line-lg"></div>
          <div class="skeleton-line skeleton-line-md"></div>
          <div class="skeleton-line skeleton-line-sm"></div>
          <div class="skeleton-line skeleton-line-md"></div>
          <div class="skeleton-line skeleton-line-lg"></div>
        </div>
      </template>

      <!-- Content -->
      <template v-else>
        <slot></slot>
      </template>
    </div>

    <!-- Footer -->
    <div v-if="hasFooter && !loading" class="card-footer">
      <slot name="footer"></slot>
    </div>
  </div>
</template>

<script>
import { defineComponent, computed } from 'vue'

/**
 * BaseCard - A reusable card component with Bootstrap 5 styling
 * 
 * Features:
 * - Optional header with title, subtitle, and action buttons
 * - Loading state with skeleton loader
 * - Border color variants
 * - Optional shadow and hover effects
 * - Customizable padding
 * 
 * @example Basic card with title
 * ```vue
 * <BaseCard title="Student Information">
 *   <p>John Doe - Grade 10A</p>
 * </BaseCard>
 * ```
 * 
 * @example Card with all features
 * ```vue
 * <BaseCard
 *   title="Students"
 *   subtitle="32 active registrations"
 *   variant="primary"
 *   shadow
 * >
 *   <template #actions>
 *     <button class="btn btn-sm btn-primary">Add Student</button>
 *   </template>
 *   
 *   <ul class="list-group list-group-flush">
 *     <li class="list-group-item">John Doe</li>
 *     <li class="list-group-item">Jane Smith</li>
 *   </ul>
 *   
 *   <template #footer>
 *     <small class="text-muted">Last updated 2 mins ago</small>
 *   </template>
 * </BaseCard>
 * ```
 * 
 * @example Loading state
 * ```vue
 * <BaseCard title="Statistics" :loading="isLoading">
 *   <div>Content appears after loading</div>
 * </BaseCard>
 * ```
 * 
 * @example Custom header with badge
 * ```vue
 * <BaseCard>
 *   <template #header>
 *     <div class="d-flex justify-content-between align-items-center">
 *       <h5 class="mb-0">Custom Header</h5>
 *       <span class="badge bg-success">Active</span>
 *     </div>
 *   </template>
 *   <p>Card content</p>
 * </BaseCard>
 * ```
 * 
 * @example No padding for full-width content
 * ```vue
 * <BaseCard title="Chart" noPadding>
 *   <img src="chart.png" class="img-fluid" alt="Chart" />
 * </BaseCard>
 * ```
 * 
 * @example Danger variant for warnings
 * ```vue
 * <BaseCard 
 *   title="Inactive Students" 
 *   variant="danger"
 *   shadow
 * >
 *   <p>5 students have not logged in for 30 days</p>
 * </BaseCard>
 * ```
 */
export default defineComponent({
  name: 'BaseCard',

  props: {
    /**
     * Card title displayed in header
     * @type {string}
     */
    title: {
      type: String,
      default: ''
    },

    /**
     * Subtitle text displayed below title
     * @type {string}
     */
    subtitle: {
      type: String,
      default: ''
    },

    /**
     * Show skeleton loader when true
     * @type {boolean}
     */
    loading: {
      type: Boolean,
      default: false
    },

    /**
     * Remove default padding from card body
     * @type {boolean}
     */
    noPadding: {
      type: Boolean,
      default: false
    },

    /**
     * Border color variant
     * @type {'default' | 'primary' | 'success' | 'danger' | 'warning'}
     */
    variant: {
      type: String,
      default: 'default',
      validator: (value) => ['default', 'primary', 'success', 'danger', 'warning'].includes(value)
    },

    /**
     * Add shadow and hover effect
     * @type {boolean}
     */
    shadow: {
      type: Boolean,
      default: false
    }
  },

  setup(props, { slots }) {
    /**
     * Compute variant class for border color
     */
    const variantClass = computed(() => {
      const variantMap = {
        default: '',
        primary: 'border-primary',
        success: 'border-success',
        danger: 'border-danger',
        warning: 'border-warning'
      }
      return variantMap[props.variant] || ''
    })

    /**
     * Check if header should be rendered
     */
    const hasHeader = computed(() => {
      return props.title || props.subtitle || slots.header || slots.actions
    })

    /**
     * Check if footer should be rendered
     */
    const hasFooter = computed(() => {
      return !!slots.footer
    })

    return {
      variantClass,
      hasHeader,
      hasFooter
    }
  }
})
</script>

<style scoped>
.base-card {
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.card-shadow {
  box-shadow: 0 0.125rem 0.25rem rgba(0, 0, 0, 0.075);
}

.card-hover:hover {
  transform: translateY(-2px);
  box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.15);
}

.card-title {
  font-weight: 600;
  margin-bottom: 0;
}

.card-subtitle {
  font-size: 0.875rem;
}

.card-actions {
  flex-shrink: 0;
  margin-left: 1rem;
}

.card-header {
  background-color: transparent;
}

.card-footer {
  background-color: transparent;
}

/* Skeleton Loader Styles */
.skeleton-loader {
  padding: 1rem 0;
}

.skeleton-line {
  height: 1rem;
  background: linear-gradient(
    90deg,
    rgba(0, 0, 0, 0.06) 25%,
    rgba(0, 0, 0, 0.1) 50%,
    rgba(0, 0, 0, 0.06) 75%
  );
  background-size: 200% 100%;
  animation: skeleton-loading 1.5s infinite;
  border-radius: 0.25rem;
  margin-bottom: 0.75rem;
}

.skeleton-line:last-child {
  margin-bottom: 0;
}

.skeleton-line-lg {
  width: 100%;
}

.skeleton-line-md {
  width: 75%;
}

.skeleton-line-sm {
  width: 50%;
}

@keyframes skeleton-loading {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}

/* Border variants - add left border accent */
.base-card.border-primary {
  border-left: 4px solid var(--bs-primary, #0d6efd) !important;
}

.base-card.border-success {
  border-left: 4px solid var(--bs-success, #198754) !important;
}

.base-card.border-danger {
  border-left: 4px solid var(--bs-danger, #dc3545) !important;
}

.base-card.border-warning {
  border-left: 4px solid var(--bs-warning, #ffc107) !important;
}
</style>