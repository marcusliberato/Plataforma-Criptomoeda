import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: './src/test/setup.js',
    css: true,
  },
  build: {
    rollupOptions: {
      input: {
        main: 'index.html',
        mercado: 'mercado.html',
        transacoes: 'transacoes.html',
      },
    },
  },
})
