<template>
  <div class="page-content" :class="{ 'p-0': noPadding }">
    <slot></slot>
  </div>
</template>

<script>
import { defineComponent } from 'vue'

/**
 * PageContent - Wrapper component for page content with consistent padding
 * 
 * @example Basic usage
 * ```vue
 * <PageContent>
 *   <p>Your page content here</p>
 * </PageContent>
 * ```
 * 
 * @example No padding (for full-width content)
 * ```vue
 * <PageContent noPadding>
 *   <BaseTable :columns="columns" :items="items" />
 * </PageContent>
 * ```
 */
export default defineComponent({
  name: 'PageContent',

  props: {
    /**
     * Remove default padding
     * @type {boolean}
     */
    noPadding: {
      type: Boolean,
      default: false
    }
  }
})
</script>

<style scoped>
.page-content {
  padding: 1rem;
  background-color: var(--bg-primary);
  border-radius: 0.5rem;
  min-height: 200px;
}

@media (min-width: 768px) {
  .page-content {
    padding: 1.5rem;
  }
}

.page-content.p-0 {
  padding: 0;
  background-color: transparent;
  border-radius: 0;
}
</style>