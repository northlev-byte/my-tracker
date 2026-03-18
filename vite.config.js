import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const GAS_URL =
  "https://script.google.com/macros/s/AKfycbx43ILL71R_N4G-6wsq2wXDtHau_ky1Ei78Xfu1TLcQpvWv8OPSX9lDCkBgKm_ckIFp/exec";

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // In local dev, /api/proxy is forwarded server-side to GAS — no CORS
      "/api/proxy": {
        target: GAS_URL,
        changeOrigin: true,
        rewrite: () => "",
      },
    },
  },
})
