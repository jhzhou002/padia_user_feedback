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

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
  ],
  server: {
    host: '0.0.0.0',
    port: 5173,
    proxy: {
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
      }
    }
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  clearScreen: false
})
