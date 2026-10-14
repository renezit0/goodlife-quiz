import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// base relativa: o build é carregado via file:// pelo Electron
export default defineConfig({
  base: './',
  plugins: [react()],
  server: { port: 5180, strictPort: true },
})
