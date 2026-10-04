import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  resolve: {
    alias: {
      sonner: fileURLToPath(new URL('./src/sonner.tsx', import.meta.url)),
    },
  },
  plugins: [
    react(),
    tailwindcss(),
  ],
  build: {
    target: 'esnext',
    cssCodeSplit: true,
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('react')) return 'vendor';
            if (id.includes('chart.js') || id.includes('lucide')) return 'ui';
            if (id.includes('zustand') || id.includes('react-query')) return 'state';
            return 'vendor';
          }
        }
      }
    }
  },
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
