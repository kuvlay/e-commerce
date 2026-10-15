import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5175,
    host: true,
    hmr: {
      port: 5175,
      host: 'localhost'
    }
  },
  define: {
    // Polyfill process for browser compatibility with axios
    'process.env': {},
    'global': 'globalThis'
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.js',
  },
})