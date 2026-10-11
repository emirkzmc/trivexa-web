import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath, URL } from 'node:url'
import { visualizer } from 'rollup-plugin-visualizer'
import viteCompression from 'vite-plugin-compression'

export default defineConfig({
  resolve: {
    alias: {
      sonner: fileURLToPath(new URL('./src/sonner.tsx', import.meta.url)),
    },
  },
  plugins: [
    react({
      // Fast Refresh only in dev
      babel: {
        compact: process.env.NODE_ENV === 'production',
      },
    }),
    tailwindcss(),
    // Gzip compression
    viteCompression({
      algorithm: 'gzip',
      ext: '.gz',
      threshold: 10240, // Only compress files > 10KB
      deleteOriginFile: false,
    }),
    // Brotli compression (better than gzip)
    viteCompression({
      algorithm: 'brotliCompress',
      ext: '.br',
      threshold: 10240,
      deleteOriginFile: false,
    }),
    // Bundle analyzer (run with ANALYZE=true npm run build)
    process.env.ANALYZE === 'true' && visualizer({
      open: true,
      filename: 'dist/stats.html',
      gzipSize: true,
      brotliSize: true,
    }),
  ].filter(Boolean),
  build: {
    target: 'es2020', // Better browser support than esnext
    cssCodeSplit: true,
    sourcemap: process.env.NODE_ENV !== 'production', // Source maps only in dev
    minify: 'oxc', // Vite 8 default; 'esbuild' requires a separate esbuild install
    chunkSizeWarningLimit: 500, // Warn for chunks > 500KB
    rollupOptions: {
      output: {
        // Optimized chunk splitting strategy
        manualChunks(id) {
          // Core vendor chunk
          if (id.includes('node_modules')) {
            // React core
            if (id.includes('react') || id.includes('react-dom') || id.includes('scheduler')) {
              return 'react-vendor'
            }

            // Router
            if (id.includes('react-router')) {
              return 'router'
            }

            // State management
            if (id.includes('zustand') || id.includes('@tanstack/react-query')) {
              return 'state'
            }

            // Charts
            if (id.includes('chart.js') || id.includes('react-chartjs')) {
              return 'charts'
            }

            // Icons (usually large)
            if (id.includes('lucide-react')) {
              return 'icons'
            }

            // Forms
            if (id.includes('react-hook-form') || id.includes('zod')) {
              return 'forms'
            }

            // UI libraries
            if (id.includes('react-toastify') || id.includes('sonner')) {
              return 'ui-libs'
            }

            // Everything else in vendor
            return 'vendor'
          }
        },
        // Asset naming with hashing
        assetFileNames: (assetInfo) => {
          const name = assetInfo.name ?? ''

          if (/\.(png|jpe?g|gif|svg|webp|avif)$/.test(name)) {
            return `assets/images/[name]-[hash][extname]`
          }

          if (/\.(woff2?|eot|ttf|otf)$/.test(name)) {
            return `assets/fonts/[name]-[hash][extname]`
          }

          return `assets/[name]-[hash][extname]`
        },
        // Chunk naming with hashing
        chunkFileNames: 'js/[name]-[hash].js',
        entryFileNames: 'js/[name]-[hash].js',
      },
    },
    // Optimize dependencies
    commonjsOptions: {
      transformMixedEsModules: true,
    },
  },
  // Dependency optimization
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      '@tanstack/react-query',
      'zustand',
      'lucide-react',
    ],
    exclude: ['@vite/client', '@vite/env'],
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
