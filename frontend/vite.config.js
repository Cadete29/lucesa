import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    allowedHosts: [
      '6809d6fce692.ngrok-free.app', 
      '1f43c734cc4b.ngrok-free.app',// Tu dominio de ngrok
      'localhost',
      '127.0.0.1'
    ],
    host: '0.0.0.0',  // Importante para ngrok
    port: 5173
  },
  define: {
    'process.env': {}
  }
})