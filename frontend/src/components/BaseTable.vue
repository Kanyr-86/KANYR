<template>
  <div class="table-responsive">
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

        <!-- Data rows -->
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
import { defineComponent, computed } from 'vue'

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
    }
  },

  emits: ['sort', 'row-click'],

  setup(props, { emit, slots }) {
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
     * Get header classes for a column
     */
    function getHeaderClasses(column) {
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
    function getCellValue(item, column) {
      const value = item[column.key]
      if (column.formatter && typeof column.formatter === 'function') {
        return column.formatter(value, item)
      }
      return value
    }

    /**
     * Get unique row key
     */
    function getRowKey(item, index) {
      return item.id || item._id || index
    }

    /**
     * Handle sort click on column header
     */
    function handleSortClick(column) {
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
    function handleRowClick(item) {
      emit('row-click', item)
    }

    return {
      tableClasses,
      totalColumns,
      skeletonRows,
      clickable,
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
  background-color: #f8f9fa;
  border-bottom: 2px solid #dee2e6;
  white-space: nowrap;
}

.base-table th.sortable {
  cursor: pointer;
  user-select: none;
  transition: background-color 0.2s ease;
}

.base-table th.sortable:hover {
  background-color: #e9ecef;
}

.base-table th.sorted {
  background-color: #e8f4fd;
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
  background-color: rgba(0, 123, 255, 0.05);
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
</style>