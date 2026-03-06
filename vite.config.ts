import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  resolve: {
    alias: {
      sonner: fileURLToPath(new URL('./src/sonner.tsx', import.meta.url)),
    },
  },
  plugins: [
    tailwindcss(),
  ],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:3500',
        changeOrigin: true,
      },
      '/uploads': {
        target: 'http://localhost:3500',
        changeOrigin: true,
      }
    }
  },
})  
