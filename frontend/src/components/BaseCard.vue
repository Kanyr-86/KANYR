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
<p v-if="subtitle" class="card-subtitle mb-0 small" style="color: var(--text-muted)">
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
/* BaseCard component styles moved to frontend/src/styles/components/cards.css */
</style>
