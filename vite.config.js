import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: './',   // relative paths — works on GitHub Pages regardless of repo name
  plugins: [react()],
  optimizeDeps: {
    include: ['plotly.js-dist-min']
  }
})
