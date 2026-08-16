import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import { initTheme } from './lib/theme'
import { initLocale } from './lib/locale'
import { useAuth } from './lib/useAuth'
import { registerSW } from 'virtual:pwa-register'
import './assets/index.css'

initTheme()
initLocale()
registerSW({ immediate: true })

const { hydrate } = useAuth()

void hydrate().then(() => {
  createApp(App).use(router).mount('#app')
})
