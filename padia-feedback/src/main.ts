import { createApp } from 'vue'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import './assets/main.css'
import { setupI18n } from './i18n'

// 创建pinia实例
const pinia = createPinia()

// 创建应用
const app = createApp(App)
app.use(router)
app.use(ElementPlus)
app.use(pinia)

// 设置i18n并挂载到应用
const i18n = setupI18n()
app.use(i18n)

app.mount('#app')
