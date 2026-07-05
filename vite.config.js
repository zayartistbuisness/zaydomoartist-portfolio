import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

import { cloudflare } from "@cloudflare/vite-plugin";

export default defineConfig(() => ({
  plugins: [
    react(),
    tailwindcss(),
    // Full-stack dev: runs the Worker + D1 bindings alongside Vite with HMR,
    // and serves the SPA through the ASSETS binding.
    cloudflare(),
  ],
}))