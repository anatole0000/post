import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import { createPinia } from 'pinia'
import { useUserStore } from '@/stores/user'

import 'bootstrap/dist/css/bootstrap.min.css'

const pinia = createPinia()
const app = createApp(App)
app.use(pinia)
app.use(router)

const userStore = useUserStore()
userStore.loadFromStorage()

app.mount('#app')
