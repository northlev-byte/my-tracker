import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Used only for local dev proxy — in production Vercel routes /api/proxy to api/proxy.js
const GAS_ORIGIN = "https://script.google.com";
const GAS_PATH   = "/macros/s/AKfycby9rmRaKYipf88AuEdfucwTlq1manzjtUEprI00SiRPJv8LUL-n5oASRjN6YG8YeqLf/exec";

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
