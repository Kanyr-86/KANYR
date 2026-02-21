<template>
  <div 
    class="loading-spinner" 
    :class="{ 'full-screen': fullScreen, 'inline': inline }"
    role="status"
    aria-live="polite"
    aria-label="Betöltés folyamatban"
  >
    <div class="spinner-wrapper">
      <div class="spinner" :class="sizeClass">
        <div class="spinner-blade"></div>
        <div class="spinner-blade"></div>
        <div class="spinner-blade"></div>
        <div class="spinner-blade"></div>
        <div class="spinner-blade"></div>
        <div class="spinner-blade"></div>
        <div class="spinner-blade"></div>
        <div class="spinner-blade"></div>
        <div class="spinner-blade"></div>
        <div class="spinner-blade"></div>
        <div class="spinner-blade"></div>
        <div class="spinner-blade"></div>
      </div>
      <p v-if="text" class="loading-text mt-3">{{ text }}</p>
    </div>
  </div>
</template>

<script>
import { defineComponent, computed } from 'vue'

export default defineComponent({
  name: 'LoadingSpinner',
  props: {
    text: {
      type: String,
      default: ''
    },
    fullScreen: {
      type: Boolean,
      default: false
    },
    inline: {
      type: Boolean,
      default: false
    },
    size: {
      type: String,
      default: 'md',
      validator: (value) => ['sm', 'md', 'lg'].includes(value)
    }
  },
  setup(props) {
    const sizeClass = computed(() => `spinner-${props.size}`)

    return {
      sizeClass
    }
  }
})
</script>

<style scoped>
.loading-spinner {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
}

.loading-spinner.full-screen {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(48, 77, 109, 0.9);
  z-index: 9999;
}

[data-theme="dark"] .loading-spinner.full-screen {
  background-color: rgba(26, 33, 41, 0.95);
}

.loading-spinner.inline {
  display: inline-flex;
  padding: 0.5rem;
}

.spinner-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.spinner {
  position: relative;
  display: inline-block;
}

.spinner-sm {
  width: 24px;
  height: 24px;
}

.spinner-md {
  width: 48px;
  height: 48px;
}

.spinner-lg {
  width: 72px;
  height: 72px;
}

.spinner-blade {
  position: absolute;
  left: 50%;
  top: 0;
  width: 10%;
  height: 25%;
  background: var(--primary-color, #63adf2);
  border-radius: 50px;
  transform-origin: center 200%;
  animation: spinner-fade 1s linear infinite;
}

.spinner-sm .spinner-blade {
  width: 12%;
  height: 30%;
  border-radius: 3px;
}

.spinner-lg .spinner-blade {
  width: 8%;
  height: 22%;
  border-radius: 10px;
}

.spinner-blade:nth-child(1) {
  transform: rotate(0deg);
  animation-delay: 0s;
}
.spinner-blade:nth-child(2) {
  transform: rotate(30deg);
  animation-delay: 0.083s;
}
.spinner-blade:nth-child(3) {
  transform: rotate(60deg);
  animation-delay: 0.166s;
}
.spinner-blade:nth-child(4) {
  transform: rotate(90deg);
  animation-delay: 0.249s;
}
.spinner-blade:nth-child(5) {
  transform: rotate(120deg);
  animation-delay: 0.332s;
}
.spinner-blade:nth-child(6) {
  transform: rotate(150deg);
  animation-delay: 0.415s;
}
.spinner-blade:nth-child(7) {
  transform: rotate(180deg);
  animation-delay: 0.498s;
}
.spinner-blade:nth-child(8) {
  transform: rotate(210deg);
  animation-delay: 0.581s;
}
.spinner-blade:nth-child(9) {
  transform: rotate(240deg);
  animation-delay: 0.664s;
}
.spinner-blade:nth-child(10) {
  transform: rotate(270deg);
  animation-delay: 0.747s;
}
.spinner-blade:nth-child(11) {
  transform: rotate(300deg);
  animation-delay: 0.83s;
}
.spinner-blade:nth-child(12) {
  transform: rotate(330deg);
  animation-delay: 0.913s;
}

@keyframes spinner-fade {
  0% {
    opacity: 1;
  }
  100% {
    opacity: 0.15;
  }
}

.loading-text {
  color: var(--text-secondary, rgba(255, 255, 255, 0.9));
  font-size: 1rem;
  font-weight: 500;
  margin: 0;
}

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  .spinner-blade {
    animation: none;
    opacity: 0.5;
  }
  
  .spinner-blade:nth-child(odd) {
    opacity: 1;
  }
}
</style>