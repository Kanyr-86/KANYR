<template>
  <div 
    class="stat-card card h-100"
    :class="variantClass"
    role="region"
    :aria-label="`${title}: ${value}`"
  >
    <div class="card-body">
      <div class="stat-card-content">
        <div class="stat-icon" :class="iconBgClass">
          <i :class="icon"></i>
        </div>
        <div class="stat-info">
          <h6 class="stat-title">{{ title }}</h6>
          <div class="stat-value">
            <span v-if="loading" class="placeholder placeholder-glow" style="width: 60px; height: 2rem;"></span>
            <span v-else class="value">{{ formattedValue }}</span>
            <span v-if="suffix && !loading" class="suffix">{{ suffix }}</span>
          </div>
          <span v-if="subtitle" class="stat-subtitle">{{ subtitle }}</span>
        </div>
      </div>
      
      <!-- Progress bar (optional) -->
      <div v-if="showProgress" class="stat-progress mt-3">
        <div class="progress" style="height: 6px;">
          <div 
            class="progress-bar" 
            :class="progressClass"
            :style="{ width: `${progressPercentage}%` }"
            :aria-valuenow="progressPercentage"
            aria-valuemin="0"
            aria-valuemax="100"
          ></div>
        </div>
        <div class="progress-label d-flex justify-content-between mt-1">
          <small class="text-muted">{{ progressLabel }}</small>
          <small class="text-muted">{{ progressPercentage }}%</small>
        </div>
      </div>
      
      <!-- Trend indicator (optional) -->
      <div v-if="trend !== undefined && !loading" class="stat-trend mt-2">
        <span :class="trendClass">
          <i :class="trendIcon"></i>
          {{ Math.abs(trend) }}%
        </span>
        <small class="text-muted ms-2">{{ trendLabel }}</small>
      </div>
    </div>
  </div>
</template>

<script>
import { defineComponent, computed } from 'vue'

export default defineComponent({
  name: 'StatCard',
  props: {
    title: {
      type: String,
      required: true
    },
    value: {
      type: [Number, String],
      default: 0
    },
    suffix: {
      type: String,
      default: ''
    },
    subtitle: {
      type: String,
      default: ''
    },
    icon: {
      type: String,
      default: 'bi bi-graph-up'
    },
    variant: {
      type: String,
      default: 'primary',
      validator: (value) => ['primary', 'success', 'warning', 'danger', 'info'].includes(value)
    },
    loading: {
      type: Boolean,
      default: false
    },
    showProgress: {
      type: Boolean,
      default: false
    },
    progressValue: {
      type: Number,
      default: 0
    },
    progressMax: {
      type: Number,
      default: 100
    },
    progressLabel: {
      type: String,
      default: ''
    },
    trend: {
      type: Number,
      default: undefined
    },
    trendLabel: {
      type: String,
      default: 'az elmúlt időszakhoz képest'
    }
  },
  setup(props) {
    const variantClass = computed(() => `variant-${props.variant}`)
    
    const iconBgClass = computed(() => {
      const classes = {
        primary: 'bg-primary-subtle text-primary',
        success: 'bg-success-subtle text-success',
        warning: 'bg-warning-subtle text-warning',
        danger: 'bg-danger-subtle text-danger',
        info: 'bg-info-subtle text-info'
      }
      return classes[props.variant] || classes.primary
    })

    const progressClass = computed(() => {
      const classes = {
        primary: 'bg-primary',
        success: 'bg-success',
        warning: 'bg-warning',
        danger: 'bg-danger',
        info: 'bg-info'
      }
      return classes[props.variant] || classes.primary
    })

    const formattedValue = computed(() => {
      if (typeof props.value === 'number') {
        return props.value.toLocaleString('hu-HU')
      }
      return props.value
    })

    const progressPercentage = computed(() => {
      if (props.progressMax === 0) return 0
      return Math.round((props.progressValue / props.progressMax) * 100)
    })

    const trendClass = computed(() => {
      if (props.trend === undefined) return ''
      if (props.trend > 0) return 'text-success'
      if (props.trend < 0) return 'text-danger'
      return 'text-muted'
    })

    const trendIcon = computed(() => {
      if (props.trend === undefined) return ''
      if (props.trend > 0) return 'bi bi-arrow-up'
      if (props.trend < 0) return 'bi bi-arrow-down'
      return 'bi bi-arrow-right'
    })

    return {
      variantClass,
      iconBgClass,
      progressClass,
      formattedValue,
      progressPercentage,
      trendClass,
      trendIcon
    }
  }
})
</script>

<style scoped>
.stat-card {
  border: none;
  border-radius: var(--border-radius-lg, 12px);
  box-shadow: var(--shadow-card, 0 4px 6px -1px rgba(48, 77, 109, 0.15));
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  background-color: var(--card-bg, #ffffff);
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-elevated, 0 10px 15px -3px rgba(48, 77, 109, 0.15));
}

.stat-card-content {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: var(--border-radius-md, 8px);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  flex-shrink: 0;
}

/* Bootstrap 5 subtle background fallbacks */
.bg-primary-subtle {
  background-color: rgba(99, 173, 242, 0.15) !important;
}

.bg-success-subtle {
  background-color: rgba(16, 185, 129, 0.15) !important;
}

.bg-warning-subtle {
  background-color: rgba(245, 158, 11, 0.15) !important;
}

.bg-danger-subtle {
  background-color: rgba(239, 68, 68, 0.15) !important;
}

.bg-info-subtle {
  background-color: rgba(167, 204, 237, 0.15) !important;
}

.stat-info {
  flex: 1;
  min-width: 0;
}

.stat-title {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--text-secondary, #333f4f);
  margin: 0 0 0.25rem 0;
}

.stat-value {
  display: flex;
  align-items: baseline;
  gap: 0.25rem;
}

.stat-value .value {
  font-size: 1.75rem;
  font-weight: 700;
  color: var(--text-primary, #1e252f);
  line-height: 1.2;
}

.stat-value .suffix {
  font-size: 1rem;
  font-weight: 500;
  color: var(--text-tertiary, #545e75);
}

.stat-subtitle {
  font-size: 0.75rem;
  color: var(--text-tertiary, #545e75);
}

.stat-progress .progress {
  border-radius: 3px;
  background-color: var(--bg-tertiary, #e1e9f0);
}

.stat-progress .progress-label small {
  font-size: 0.7rem;
}

.stat-trend {
  font-size: 0.8rem;
  font-weight: 500;
}

/* Variants */
.variant-primary .stat-value .value {
  color: var(--primary-color, #63adf2);
}

.variant-success .stat-value .value {
  color: var(--success-color, #10b981);
}

.variant-warning .stat-value .value {
  color: var(--warning-color, #f59e0b);
}

.variant-danger .stat-value .value {
  color: var(--danger-color, #ef4444);
}

.variant-info .stat-value .value {
  color: var(--info-color, #a7cced);
}

/* Dark mode adjustments */
[data-theme="dark"] .stat-card {
  background-color: var(--card-bg, #242c38);
}

[data-theme="dark"] .stat-title {
  color: var(--text-secondary, #c3d3e1);
}

[data-theme="dark"] .stat-value .value {
  color: var(--text-primary, #f0f4f8);
}

[data-theme="dark"] .stat-subtitle {
  color: var(--text-tertiary, #82a0bc);
}

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  .stat-card {
    transition: none;
  }
  
  .stat-card:hover {
    transform: none;
  }
}
</style>