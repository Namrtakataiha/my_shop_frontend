import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // Necessary for Docker
    port: 5173,
    watch: {
      usePolling: true, // For Windows WSL/Docker file watching
    }
  }
})
