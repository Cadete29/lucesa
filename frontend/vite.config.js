import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { visualizer } from 'rollup-plugin-visualizer'

export default defineConfig({
  plugins: [
    react(),
    visualizer({
      filename: './dist/stats.html',
      open: true,
    })
  ],
  server: {
    allowedHosts: [
      '77fe952b7b48.ngrok-free.app', 
      '7363391fa0ef.ngrok-free.app',
      'localhost',
      '127.0.0.1'
    ],
    host: '0.0.0.0',
    port: 5173
  },
  define: {
    'process.env': {}
  },
  build: {
    chunkSizeWarningLimit: 800,
    rollupOptions: {
      output: {
        manualChunks(id) {
          // Crea chunks basados en rutas/carpetas
          if (id.includes('node_modules')) {
            // React y core
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router')) {
              return 'vendor-react'
            }
            
            // Dependencias de UI si las tienes
            if (id.includes('@mui') || id.includes('@material-ui') || id.includes('antd')) {
              return 'vendor-ui'
            }
            
            // Utilidades
            if (id.includes('axios') || id.includes('lodash') || id.includes('moment')) {
              return 'vendor-utils'
            }
            
            return 'vendor-other'
          }
          
          // Chunks por carpetas de tu aplicación
          if (id.includes('/src/pages/')) {
            const match = id.match(/\/src\/pages\/([^\/]+)/)
            if (match) {
              const pageName = match[1].toLowerCase()
              
              // Agrupa páginas relacionadas
              if (['pagoexitoso', 'pagoerror', 'pagopendiente'].includes(pageName)) {
                return 'pages-payment'
              }
              
              if (['privacy', 'terms', 'cookie', 'fya'].includes(pageName)) {
                return 'pages-legal'
              }
              
              if (['products', 'categories', 'productdetails'].includes(pageName)) {
                return 'pages-catalog'
              }
              
              if (['cart', 'checkout', 'orderconfirmation'].includes(pageName)) {
                return 'pages-checkout'
              }
              
              return `pages-${pageName}`
            }
          }
          
          // Chunks por componentes
          if (id.includes('/src/components/')) {
            const match = id.match(/\/src\/components\/([^\/]+)/)
            if (match) {
              const componentType = match[1].toLowerCase()
              return `components-${componentType}`
            }
          }
        }
      }
    }
  }
})