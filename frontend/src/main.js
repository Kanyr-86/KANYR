import { createApp } from 'vue'
import { createPinia } from 'pinia'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'
import Vue3Toastify from 'vue3-toastify'
import router from './router'
import App from './App.vue'
import './styles/variables.css'
import './styles/base.css'
import './style.css'

// Import component styles
import './styles/components/sidebar.css'
import './styles/components/cards.css'
import './styles/components/badges.css'
import './styles/components/buttons.css'
import './styles/components/tables.css'
import './styles/components/modals.css'
import './styles/components/notification-inbox.css'

// Optimized Bootstrap imports - only essential CSS
import './styles/bootstrap-optimized.css'
import 'bootstrap-icons/font/bootstrap-icons.css'

// Import global components
import AccessibleStatus from './components/AccessibleStatus.vue'

// Note: Bootstrap JS is NOT imported because we use custom Vue components
// If you need specific Bootstrap JS components (like tooltips), import them individually:
// import { Modal, Dropdown, Tooltip } from 'bootstrap/dist/js/bootstrap.esm.min.js'

import 'vue3-toastify/dist/index.css'

const app = createApp(App)
const pinia = createPinia()

// Add persistence plugin to Pinia
pinia.use(piniaPluginPersistedstate)

// Register global components
app.component('AccessibleStatus', AccessibleStatus)

app.use(pinia)
app.use(router)
app.use(Vue3Toastify, {
  autoClose: 3000,
  position: 'top-right',
  hideProgressBar: false,
  closeOnClick: true,
  pauseOnHover: true,
  draggable: true,
})
app.mount('#app')
