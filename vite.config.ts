import { defineConfig } from 'vite'
import uni from '@dcloudio/vite-plugin-uni'
import { resolve } from 'path'
import fileServerPlugin from './vite-plugin-file-server'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [uni(), fileServerPlugin()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@/api': resolve(__dirname, 'src/api'),
      '@/components': resolve(__dirname, 'src/components'),
      '@/pages': resolve(__dirname, 'src/pages'),
      '@/store': resolve(__dirname, 'src/store'),
      '@/utils': resolve(__dirname, 'src/utils'),
      '@/types': resolve(__dirname, 'src/types')
    }
  },
  server: {
    port: 3000,
    host: true,
    open: false
  },
  build: {
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true
      }
    },
    sourcemap: false,
    chunkSizeWarningLimit: 1500
  }
})
