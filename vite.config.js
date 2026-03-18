import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Used only for local dev proxy — in production Vercel routes /api/proxy to api/proxy.js
const GAS_ORIGIN = "https://script.google.com";
const GAS_PATH   = "/macros/s/AKfycbwvyKRtB0edbEhb3kFul0NMm5TXCWypZIXii-P1okvX1M6NEdjL6-kzFAtIEtE3BeEd/exec";

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // In local dev, /api/proxy → GAS (server-to-server, no CORS restriction)
      "/api/proxy": {
        target: GAS_ORIGIN,
        changeOrigin: true,
        rewrite: () => GAS_PATH,
      },
    },
  },
})
