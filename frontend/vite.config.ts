import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tsconfigPaths from 'vite-tsconfig-paths'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  build: {
    chunkSizeWarningLimit: 2000,
  },
  server: {
    proxy: {
      // Node.js backend routes → port 5001
      '/api/auth': {
        target: 'http://127.0.0.1:5001',
        changeOrigin: true,
      },
      '/api/backend': {
        target: 'http://127.0.0.1:5001',
        changeOrigin: true,
      },
      '/api/profiles': {
        target: 'http://127.0.0.1:5001',
        changeOrigin: true,
      },
      '/api/movies': {
        target: 'http://127.0.0.1:5001',
        changeOrigin: true,
      },
      '/api/health': {
        target: 'http://127.0.0.1:5001',
        changeOrigin: true,
      },
      '/api/ai/party': {
        target: 'http://127.0.0.1:5001',
        changeOrigin: true,
      },
      // Python AI engine routes → port 8000
      '/api/ai': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
      '/api/poster': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
      '/recommend': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
    }
  }
})
