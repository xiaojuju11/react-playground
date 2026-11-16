import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // monaco 的 worker（尤其 ts.worker）内部还有动态 import，
  // 用默认的 iife 打包会直接报 "code splitting is not supported"，
  // 必须改用 es 模块 worker。
  worker: {
    format: 'es',
  },
  build: {
    // monaco 主包本身就 3MB+，默认 500KB 的告警阈值只会刷屏
    chunkSizeWarningLimit: 4000,
  },
})
