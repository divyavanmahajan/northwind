import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    host: true, // For Docker
    port: 5173,
    // API Proxy Configuration
    // Proxies all /api/* requests to the backend server
    // This eliminates CORS issues during development
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false,
        // WebSocket support for potential real-time features
        ws: true,
      }
    }
  }
})