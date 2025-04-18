import { createApp } from 'vue'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import './assets/main.css'

// 调试信息 - 打印环境信息
console.log('应用启动 - 环境:', import.meta.env.MODE);

// 创建pinia实例
const pinia = createPinia()

// 初始化应用
const app = createApp(App)
app.use(pinia)

// 注册其他插件
app.use(router)
app.use(ElementPlus)

// 挂载应用
app.mount('#app')

// 调试信息 - 应用挂载完成
console.log('应用挂载完成');
