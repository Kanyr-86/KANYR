<template>
  <div class="occupancy-chart card h-100">
    <div class="card-header">
      <h6 class="mb-0">
        <i class="bi bi-pie-chart me-2"></i>
        {{ title }}
      </h6>
    </div>
    <div class="card-body">
      <div v-if="loading" class="text-center py-4">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">Betöltés...</span>
        </div>
      </div>
      
      <div v-else class="chart-container">
        <!-- Donut Chart -->
        <div class="donut-chart" :style="{ '--occupied': occupiedPercentage, '--available': availablePercentage }">
          <svg viewBox="0 0 36 36" class="circular-chart">
            <path
              class="circle-bg"
              d="M18 2.0845
                a 15.9155 15.9155 0 0 1 0 31.831
                a 15.9155 15.9155 0 0 1 0 -31.831"
            />
            <path
              class="circle occupied"
              :stroke-dasharray="`${occupiedPercentage}, 100`"
              d="M18 2.0845
                a 15.9155 15.9155 0 0 1 0 31.831
                a 15.9155 15.9155 0 0 1 0 -31.831"
            />
            <text x="18" y="20.35" class="percentage">{{ occupiedPercentage }}%</text>
          </svg>
        </div>
        
        <!-- Legend -->
        <div class="chart-legend">
          <div class="legend-item">
            <span class="legend-color occupied"></span>
            <span class="legend-label">Foglalt</span>
            <span class="legend-value">{{ occupied }}</span>
          </div>
          <div class="legend-item">
            <span class="legend-color available"></span>
            <span class="legend-label">Szabad</span>
            <span class="legend-value">{{ available }}</span>
          </div>
          <div class="legend-item total">
            <span class="legend-label">Összesen</span>
            <span class="legend-value">{{ total }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { defineComponent, computed } from 'vue'

export default defineComponent({
  name: 'OccupancyChart',
  props: {
    title: {
      type: String,
      default: 'Foglaltság'
    },
    occupied: {
      type: Number,
      default: 0
    },
    total: {
      type: Number,
      default: 0
    },
    loading: {
      type: Boolean,
      default: false
    }
  },
  setup(props) {
    const available = computed(() => Math.max(0, props.total - props.occupied))
    
    const occupiedPercentage = computed(() => {
      if (props.total === 0) return 0
      return Math.round((props.occupied / props.total) * 100)
    })
    
    const availablePercentage = computed(() => {
      return 100 - occupiedPercentage.value
    })

    return {
      available,
      occupiedPercentage,
      availablePercentage
    }
  }
})
</script>

<style scoped>
.occupancy-chart {
  border: none;
  border-radius: var(--border-radius-lg, 12px);
  box-shadow: var(--shadow-card, 0 4px 6px -1px rgba(48, 77, 109, 0.15));
  background-color: var(--card-bg, #ffffff);
}

.card-header {
  background-color: transparent;
  border-bottom: 1px solid var(--border-primary, #a5bcd2);
  padding: 1rem 1.25rem;
}

.card-header h6 {
  color: var(--text-primary, #1e252f);
  font-weight: 600;
}

.chart-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.5rem;
}

/* Donut Chart */
.donut-chart {
  width: 160px;
  height: 160px;
}

.circular-chart {
  display: block;
  width: 100%;
  height: 100%;
}

.circle-bg {
  fill: none;
  stroke: var(--bg-tertiary, #e1e9f0);
  stroke-width: 3.8;
}

.circle {
  fill: none;
  stroke-width: 3.8;
  stroke-linecap: round;
  animation: progress 1s ease-out forwards;
  transform: rotate(-90deg);
  transform-origin: center;
}

.circle.occupied {
  stroke: var(--success-color, #10b981);
}

@keyframes progress {
  0% {
    stroke-dasharray: 0 100;
  }
}

.percentage {
  fill: var(--text-primary, #1e252f);
  font-size: 0.5rem;
  font-weight: 700;
  text-anchor: middle;
}

/* Legend */
.chart-legend {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  width: 100%;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem 0.75rem;
  border-radius: var(--border-radius-sm, 6px);
  background-color: var(--bg-secondary, #f0f4f8);
}

.legend-item.total {
  margin-top: 0.5rem;
  background-color: transparent;
  border-top: 1px solid var(--border-primary, #a5bcd2);
  padding-top: 0.75rem;
}

.legend-color {
  width: 12px;
  height: 12px;
  border-radius: 3px;
}

.legend-color.occupied {
  background-color: var(--success-color, #10b981);
}

.legend-color.available {
  background-color: var(--info-color, #a7cced);
}

.legend-label {
  flex: 1;
  font-size: 0.875rem;
  color: var(--text-secondary, #333f4f);
}

.legend-value {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text-primary, #1e252f);
}

/* Dark mode */
[data-theme="dark"] .occupancy-chart {
  background-color: var(--card-bg, #242c38);
}

[data-theme="dark"] .card-header {
  border-color: var(--border-primary, #445775);
}

[data-theme="dark"] .card-header h6 {
  color: var(--text-primary, #f0f4f8);
}

[data-theme="dark"] .circle-bg {
  stroke: var(--bg-tertiary, #333d4f);
}

[data-theme="dark"] .percentage {
  fill: var(--text-primary, #f0f4f8);
}

[data-theme="dark"] .legend-item {
  background-color: var(--bg-tertiary, #333d4f);
}

[data-theme="dark"] .legend-item.total {
  border-color: var(--border-primary, #445775);
  background-color: transparent;
}

[data-theme="dark"] .legend-label {
  color: var(--text-secondary, #c3d3e1);
}

[data-theme="dark"] .legend-value {
  color: var(--text-primary, #f0f4f8);
}

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  .circle {
    animation: none;
  }
}

/* Responsive */
@media (max-width: 576px) {
  .donut-chart {
    width: 140px;
    height: 140px;
  }
}
</style>