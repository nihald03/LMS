import { defineConfig } from 'vite'
import reactSwc from '@vitejs/plugin-react-swc'
import path from 'path'

export default defineConfig({
  plugins: [reactSwc()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    target: 'esnext',
    minify: 'terser',
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendors': ['react', 'react-dom', 'react-router-dom'],
          'ui-vendors': ['lucide-react', 'react-hot-toast'],
        }
      }
    },
    chunkSizeWarningLimit: 1000,
  }
})