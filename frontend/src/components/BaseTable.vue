<template>
  <div ref="containerRef" class="table-responsive" :style="{ maxHeight: shouldVirtualize ? props.maxHeight : 'none' }">
    <table class="table base-table" :class="tableClasses">
      <!-- Header -->
      <thead>
        <tr>
          <th
            v-for="column in columns"
            :key="column.key"
            :class="getHeaderClasses(column)"
            @click="handleSortClick(column)"
          >
            <div class="d-flex align-items-center">
              <span>{{ column.label }}</span>
              <span v-if="column.sortable" class="sort-icon ms-1">
                <svg
                  v-if="sortKey === column.key"
                  xmlns="http://www.w3.org/2000/svg"
                  width="12"
                  height="12"
                  fill="currentColor"
                  viewBox="0 0 16 16"
                  :class="['sort-arrow', { 'sort-asc': sortOrder === 'asc' }]"
                >
                  <path d="M8 1a.5.5 0 0 1 .5.5v11.793l3.146-3.147a.5.5 0 0 1 .708.708l-4 4a.5.5 0 0 1-.708 0l-4-4a.5.5 0 0 1 .708-.708L7.5 13.293V1.5A.5.5 0 0 1 8 1z"/>
                </svg>
                <svg
                  v-else
                  xmlns="http://www.w3.org/2000/svg"
                  width="12"
                  height="12"
                  fill="currentColor"
                  viewBox="0 0 16 16"
                  class="sort-placeholder"
                >
                  <path d="M3.5 6a.5.5 0 0 1-.5-.5v-2a.5.5 0 0 1 .5-.5h2a.5.5 0 0 1 0 1H4v1.5a.5.5 0 0 1-.5.5zm9 0a.5.5 0 0 1-.5-.5V4h-1.5a.5.5 0 0 1 0-1h2a.5.5 0 0 1 .5.5v2a.5.5 0 0 1-.5.5z"/>
                </svg>
              </span>
            </div>
          </th>
          <!-- Actions column header -->
          <th v-if="$slots.actions" class="actions-column">
            Műveletek
          </th>
        </tr>
      </thead>

      <!-- Body -->
      <tbody>
        <!-- Loading skeleton -->
        <template v-if="loading">
          <tr v-for="i in skeletonRows" :key="`skeleton-${i}`">
            <td v-for="column in columns" :key="`skeleton-${column.key}`">
              <div class="skeleton-cell"></div>
            </td>
            <td v-if="$slots.actions">
              <div class="skeleton-cell skeleton-cell-sm"></div>
            </td>
          </tr>
        </template>

        <!-- Empty state -->
        <template v-else-if="!items || items.length === 0">
          <tr>
            <td :colspan="totalColumns" class="text-center py-5">
              <slot name="empty">
                <div class="text-muted">
                  <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" fill="currentColor" class="mb-3 opacity-50" viewBox="0 0 16 16">
                    <path d="M14 1a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1h12zM2 0a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2H2z"/>
                    <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4z"/>
                  </svg>
                  <p class="mb-0">{{ emptyText }}</p>
                </div>
              </slot>
            </td>
          </tr>
        </template>

        <!-- Virtualized rows -->
        <template v-else-if="shouldVirtualize">
          <tr
            v-for="(item, index) in visibleItems"
            :key="getRowKey(item, startIndex + index)"
            :class="{ 'clickable': clickable }"
            :style="{ height: props.rowHeight + 'px' }"
            @click="handleRowClick(item)"
          >
            <td v-for="column in columns" :key="column.key">
              <slot :name="`cell-${column.key}`" :item="item" :value="getCellValue(item, column)">
                {{ getCellValue(item, column) }}
              </slot>
            </td>
            <!-- Actions column -->
            <td v-if="$slots.actions" class="actions-column" @click.stop>
              <slot name="actions" :item="item" :index="startIndex + index"></slot>
            </td>
          </tr>
          <!-- Spacer rows for virtualization -->
          <tr v-if="spacerBefore > 0" :style="{ height: spacerBefore * props.rowHeight + 'px' }">
            <td :colspan="totalColumns"></td>
          </tr>
          <tr v-if="spacerAfter > 0" :style="{ height: spacerAfter * props.rowHeight + 'px' }">
            <td :colspan="totalColumns"></td>
          </tr>
        </template>

        <!-- Regular rows -->
        <template v-else>
          <tr
            v-for="(item, index) in items"
            :key="getRowKey(item, index)"
            :class="{ 'clickable': clickable }"
            @click="handleRowClick(item)"
          >
            <td v-for="column in columns" :key="column.key">
              <slot :name="`cell-${column.key}`" :item="item" :value="getCellValue(item, column)">
                {{ getCellValue(item, column) }}
              </slot>
            </td>
            <!-- Actions column -->
            <td v-if="$slots.actions" class="actions-column" @click.stop>
              <slot name="actions" :item="item" :index="index"></slot>
            </td>
          </tr>
        </template>
      </tbody>
    </table>
  </div>
</template>

<script>
import { defineComponent, computed, ref, onMounted, onUnmounted, watch } from 'vue'

/**
 * BaseTable - A reusable data table component with Bootstrap 5 styling
 * 
 * Features:
 * - Sortable columns with visual indicators
 * - Loading skeleton animation
 * - Empty state message
 * - Custom cell rendering via slots (cell-[key])
 * - Row click handling
 * - Action buttons column
 * - Responsive horizontal scroll
 * - Virtualization for large datasets (100+ items)
 * - Performance optimizations with memoization
 * 
 * Usage:
 * - columns: Array of { key, label, sortable?, formatter? }
 * - items: Array of data objects
 * - Slots: cell-[key] for custom cells, actions for row buttons
 * - Emits: sort({ key, order }), row-click(item)
 * 
 * Example columns:
 * { key: 'name', label: 'Név', sortable: true }
 * { key: 'price', label: 'Ár', formatter: (v) => v + ' Ft' }
 */
export default defineComponent({
  name: 'BaseTable',

  props: {
    /**
     * Column definitions
     * @type {Array<{key: string, label: string, sortable?: boolean, formatter?: Function}>}
     */
    columns: {
      type: Array,
      required: true,
      validator: (value) => {
        return value.every(col => col.key && col.label)
      }
    },

    /**
     * Array of data items
     * @type {Array}
     */
    items: {
      type: Array,
      default: () => []
    },

    /**
     * Show loading skeleton
     * @type {boolean}
     */
    loading: {
      type: Boolean,
      default: false
    },

    /**
     * Current sort column key
     * @type {string}
     */
    sortKey: {
      type: String,
      default: ''
    },

    /**
     * Sort order
     * @type {'asc' | 'desc'}
     */
    sortOrder: {
      type: String,
      default: 'asc',
      validator: (value) => ['asc', 'desc'].includes(value)
    },

    /**
     * Empty state message (Hungarian)
     * @type {string}
     */
    emptyText: {
      type: String,
      default: 'Nincs megjeleníthető adat'
    },

    /**
     * Enable row hover effect
     * @type {boolean}
     */
    hoverable: {
      type: Boolean,
      default: true
    },

    /**
     * Striped rows
     * @type {boolean}
     */
    striped: {
      type: Boolean,
      default: false
    },

    /**
     * Enable virtualization for performance (auto-enabled for 100+ items)
     * @type {boolean}
     */
    virtualized: {
      type: Boolean,
      default: null
    },

    /**
     * Maximum height for virtualized table
     * @type {string}
     */
    maxHeight: {
      type: String,
      default: '500px'
    },

    /**
     * Estimated row height for virtualization
     * @type {number}
     */
    rowHeight: {
      type: Number,
      default: 50
    }
  },

  emits: ['sort', 'row-click'],

  setup(props, { emit, slots }) {
    const containerRef = ref(null)
    const scrollTop = ref(0)
    const startIndex = ref(0)
    const endIndex = ref(0)
    const visibleItems = ref([])

    // Auto-enable virtualization for large datasets
    const shouldVirtualize = computed(() => {
      if (props.virtualized !== null) {
        return props.virtualized
      }
      return props.items.length >= 100
    })

    /**
     * Calculate visible items for virtualization
     */
    const calculateVisibleItems = () => {
      if (!shouldVirtualize.value || props.loading || !props.items.length) {
        return
      }

      const container = containerRef.value
      if (!container) return

      const containerHeight = container.clientHeight
      const totalItems = props.items.length
      const visibleCount = Math.ceil(containerHeight / props.rowHeight) + 2 // +2 for buffer
      const maxStartIndex = Math.max(0, totalItems - visibleCount)
      
      startIndex.value = Math.min(Math.floor(scrollTop.value / props.rowHeight), maxStartIndex)
      endIndex.value = Math.min(startIndex.value + visibleCount, totalItems)
      
      visibleItems.value = props.items.slice(startIndex.value, endIndex.value)
    }

    /**
     * Handle scroll event
     */
    const handleScroll = () => {
      if (containerRef.value) {
        scrollTop.value = containerRef.value.scrollTop
        calculateVisibleItems()
      }
    }

    /**
     * Debounced scroll handler
     */
    let scrollTimeout = null
    const debouncedScrollHandler = () => {
      if (scrollTimeout) {
        clearTimeout(scrollTimeout)
      }
      scrollTimeout = setTimeout(handleScroll, 16) // ~60fps
    }

    /**
     * Computed table classes
     */
    const tableClasses = computed(() => {
      const classes = []
      if (props.hoverable) classes.push('table-hover')
      if (props.striped) classes.push('table-striped')
      return classes
    })

    /**
     * Total columns count (including actions)
     */
    const totalColumns = computed(() => {
      return props.columns.length + (slots.actions ? 1 : 0)
    })

    /**
     * Number of skeleton rows to show
     */
    const skeletonRows = computed(() => {
      return Math.min(5, props.items?.length || 5)
    })

    /**
     * Check if rows are clickable
     */
    const clickable = computed(() => {
      return !!emit && emit('row-click') !== undefined
    })

    /**
     * Spacer rows for virtualization
     */
    const spacerBefore = computed(() => {
      return shouldVirtualize.value ? startIndex.value : 0
    })

    const spacerAfter = computed(() => {
      return shouldVirtualize.value ? (props.items.length - endIndex.value) : 0
    })

    /**
     * Get header classes for a column
     */
    const getHeaderClasses = (column) => {
      const classes = []
      if (column.sortable) {
        classes.push('sortable')
      }
      if (props.sortKey === column.key) {
        classes.push('sorted')
      }
      return classes
    }

    /**
     * Get cell value, applying formatter if present
     */
    const getCellValue = (item, column) => {
      const value = item[column.key]
      if (column.formatter && typeof column.formatter === 'function') {
        return column.formatter(value, item)
      }
      return value
    }

    /**
     * Get unique row key
     */
    const getRowKey = (item, index) => {
      return item.id || item._id || index
    }

    /**
     * Handle sort click on column header
     */
    const handleSortClick = (column) => {
      if (!column.sortable) return

      let newOrder = 'asc'
      if (props.sortKey === column.key) {
        newOrder = props.sortOrder === 'asc' ? 'desc' : 'asc'
      }

      emit('sort', { key: column.key, order: newOrder })
    }

    /**
     * Handle row click
     */
    const handleRowClick = (item) => {
      emit('row-click', item)
    }

    // Watch for items changes and recalculate visible items
    watch(() => props.items.length, () => {
      if (shouldVirtualize.value) {
        calculateVisibleItems()
      }
    })

    // Watch for container size changes
    let resizeObserver = null
    onMounted(() => {
      if (shouldVirtualize.value && containerRef.value) {
        containerRef.value.addEventListener('scroll', debouncedScrollHandler, { passive: true })
        calculateVisibleItems()

        // Observe container size changes
        resizeObserver = new ResizeObserver(() => {
          calculateVisibleItems()
        })
        resizeObserver.observe(containerRef.value)
      }
    })

    onUnmounted(() => {
      if (scrollTimeout) {
        clearTimeout(scrollTimeout)
      }
      if (containerRef.value) {
        containerRef.value.removeEventListener('scroll', debouncedScrollHandler)
      }
      if (resizeObserver) {
        resizeObserver.disconnect()
      }
    })

    return {
      containerRef,
      tableClasses,
      totalColumns,
      skeletonRows,
      clickable,
      spacerBefore,
      spacerAfter,
      visibleItems,
      shouldVirtualize,
      getHeaderClasses,
      getCellValue,
      getRowKey,
      handleSortClick,
      handleRowClick
    }
  }
})
</script>

<style scoped>
.base-table {
  margin-bottom: 0;
}

.base-table th {
  font-weight: 600;
  background-color: var(--bg-tertiary);
  border-bottom: 2px solid var(--border-secondary);
  white-space: nowrap;
}

.base-table th.sortable {
  cursor: pointer;
  user-select: none;
  transition: background-color 0.2s ease;
}

.base-table th.sortable:hover {
  background-color: var(--bg-tertiary);
}

.base-table th.sorted {
  background-color: var(--bg-tertiary);
}

.sort-icon {
  display: inline-flex;
  align-items: center;
  opacity: 0.5;
}

.base-table th.sorted .sort-icon {
  opacity: 1;
}

.sort-arrow {
  transition: transform 0.2s ease;
}

.sort-arrow.sort-asc {
  transform: rotate(180deg);
}

.sort-placeholder {
  opacity: 0.3;
}

.base-table tbody tr.clickable {
  cursor: pointer;
}

.base-table tbody tr.clickable:hover {
  background-color: rgba(59, 130, 246, 0.05);
}

.actions-column {
  width: 1%;
  white-space: nowrap;
  text-align: right;
}

/* Skeleton loader */
.skeleton-cell {
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
}

.skeleton-cell-sm {
  width: 50%;
  margin-left: auto;
}

@keyframes skeleton-loading {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}

/* Empty state */
.base-table td.text-center {
  border-bottom: none;
}

/* Dark theme overrides for BaseTable */
[data-theme="dark"] .base-table {
  background-color: var(--bg-page);
}

[data-theme="dark"] .base-table th {
  background-color: var(--bg-tertiary);
  border-bottom-color: var(--border-primary);
}

[data-theme="dark"] .base-table th.sortable:hover {
  background-color: var(--bg-tertiary);
}

[data-theme="dark"] .base-table th.sorted {
  background-color: var(--bg-tertiary);
}

[data-theme="dark"] .base-table tbody tr {
  background-color: var(--bg-card);
  border-color: var(--border-primary);
}

[data-theme="dark"] .base-table tbody tr:hover {
  background-color: var(--bg-tertiary);
}

[data-theme="dark"] .base-table tbody tr.clickable:hover {
  background-color: rgba(59, 130, 246, 0.1);
}

[data-theme="dark"] .sort-icon {
  opacity: 0.7;
}

[data-theme="dark"] .sort-placeholder {
  opacity: 0.4;
}

[data-theme="dark"] .skeleton-cell {
  background: linear-gradient(
    90deg,
    rgba(255, 255, 255, 0.06) 25%,
    rgba(255, 255, 255, 0.1) 50%,
    rgba(255, 255, 255, 0.06) 75%
  );
}

/* High contrast theme overrides for BaseTable */
[data-theme="high-contrast"] .base-table {
  background-color: var(--bg-page);
}

[data-theme="high-contrast"] .base-table th {
  background-color: var(--bg-card);
  border-bottom: 2px solid #000000;
}

[data-theme="high-contrast"] .base-table th.sortable:hover {
  background-color: var(--bg-tertiary);
}

[data-theme="high-contrast"] .base-table th.sorted {
  background-color: var(--bg-tertiary);
}

[data-theme="high-contrast"] .base-table tbody tr {
  background-color: var(--bg-card);
  border: 1px solid #000000;
}

[data-theme="high-contrast"] .base-table tbody tr:hover {
  background-color: var(--bg-tertiary);
}

[data-theme="high-contrast"] .base-table tbody tr.clickable:hover {
  background-color: rgba(0, 0, 0, 0.1);
}

[data-theme="high-contrast"] .sort-icon {
  opacity: 1;
}

[data-theme="high-contrast"] .sort-placeholder {
  opacity: 0.6;
}

[data-theme="high-contrast"] .skeleton-cell {
  background: linear-gradient(
    90deg,
    rgba(0, 0, 0, 0.1) 25%,
    rgba(0, 0, 0, 0.2) 50%,
    rgba(0, 0, 0, 0.1) 75%
  );
}
</style>
