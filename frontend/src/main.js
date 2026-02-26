import { createApp } from 'vue'
import { createPinia } from 'pinia'
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
import 'bootstrap/dist/css/bootstrap.min.css'
import 'bootstrap-icons/font/bootstrap-icons.css'
import 'bootstrap'
import 'vue3-toastify/dist/index.css'

const app = createApp(App)
const pinia = createPinia()

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
