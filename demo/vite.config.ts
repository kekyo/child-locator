import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [
    react()
  ],
  server: {
    port: 59517,
    hmr: {
      overlay: false
    }
  },
  preview: {
    port: 59517
  }
})
