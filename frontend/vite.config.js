import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: true, 
    port: 5176,
    cors: true,
    allowedHosts: true, // Разрешаем запросы с доменов trycloudflare.com
    hmr: {
      clientPort: 443 // Заставляем веб-сокеты идти через HTTPS-туннель
    },
    proxy: {
      '/api': 'http://backend:8083' 
    }
  }
})