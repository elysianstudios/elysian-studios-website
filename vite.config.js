import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: '/elysian-studios-website/',
  plugins: [react()],
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    rollupOptions: {
      output: {
        manualChunks: {
          vendor:    ['react', 'react-dom', 'react-router-dom'],
          gsap:      ['gsap'],
          lucide:    ['lucide-react'],
          dompurify: ['dompurify'],
        },
      },
    },
  },
})
