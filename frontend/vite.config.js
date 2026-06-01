import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: true, 
    port: 5176,
    cors: true,
    hmr: {
      clientPort: 443 
    },
    proxy: {
      '/api': 'http://127.0.0.1:8083' 
    }
  }
})