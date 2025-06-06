import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import fs from 'fs'
import path from 'path'
import { IssueStatus } from './src/db/models/index.js'

interface ApiError extends Error {
  code?: string
  errno?: number
  sqlState?: string
  sqlMessage?: string
  sql?: string
  parameters?: unknown
}

// 处理错误消息
const handleError = (error: unknown): string => {
  if (error instanceof Error) {
    const apiError = error as ApiError
    return apiError.message || '未知错误'
  }
  return '未知错误'
}

// 检查文件是否存在
function checkFileExists(filePath: string): boolean {
  try {
    return fs.existsSync(filePath)
  } catch (err) {
    console.error(`Error checking file ${filePath}:`, err)
    return false
  }
}

// 检查关键文件
const mainPath = path.resolve(__dirname, 'src/main.ts')
const appPath = path.resolve(__dirname, 'src/App.vue')
const zhPath = path.resolve(__dirname, 'src/locales/zh.ts')
const enPath = path.resolve(__dirname, 'src/locales/en.ts')
console.log(`main.ts exists: ${checkFileExists(mainPath)}`)
console.log(`App.vue exists: ${checkFileExists(appPath)}`)
console.log(`zh.ts exists: ${checkFileExists(zhPath)}`)
console.log(`en.ts exists: ${checkFileExists(enPath)}`)

// https://vitejs.dev/config/
export default defineConfig({
  base: '/',
  plugins: [
    vue()
  ],
  server: {
    host: '0.0.0.0',
    port: 5173,
    proxy: {
      // 代理所有API请求，包括/issues、/auth等
      '^/(issues|auth|modules|comments|developer|qiniu-token)': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        rewrite: (path) => `/api${path}`,
        configure: (proxy, _options) => {
          proxy.on('error', (err, _req, _res) => {
            console.log('代理错误', err);
          });
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            console.log('代理请求', req.method, req.url);
          });
          proxy.on('proxyRes', (proxyRes, req, _res) => {
            console.log('代理响应', req.method, req.url);
          });
        }
      },
      // 保持原有配置作为备用
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
        configure: (proxy, _options) => {
          proxy.on('error', (err, _req, _res) => {
            console.log('代理错误', err);
          });
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            console.log('代理请求', req.method, req.url);
          });
          proxy.on('proxyRes', (proxyRes, req, _res) => {
            console.log('代理响应', req.method, req.url);
          });
        }
      },
      '/qiniu-token': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/qiniu-token/, '/api/qiniu-token'),
        configure: (proxy, _options) => {
          proxy.on('error', (err, _req, _res) => {
            console.log('七牛云代理错误', err);
          });
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            console.log('七牛云代理请求', req.method, req.url);
          });
          proxy.on('proxyRes', (proxyRes, req, _res) => {
            console.log('七牛云代理响应', req.method, req.url);
          });
        }
      }
    }
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  optimizeDeps: {
    // 将WASM模块标记为外部模块，避免Vite尝试打包它
    exclude: ['@node-rs/jieba'],
    esbuildOptions: {
      define: {
        global: 'globalThis'
      },
      plugins: [
        {
          name: 'external-wasm',
          setup(build) {
            // 告诉esbuild将@node-rs/jieba-wasm32-wasi视为外部模块
            build.onResolve({ filter: /^@node-rs\/jieba-wasm32-wasi/ }, () => {
              return { external: true }
            })
          }
        }
      ]
    }
  },
  build: {
    sourcemap: true,
    minify: 'terser'
  },
  define: {
    'import.meta.env.VITE_APP_LANG': JSON.stringify('zh-CN') // 确保环境变量注入
  },
  clearScreen: false
})
