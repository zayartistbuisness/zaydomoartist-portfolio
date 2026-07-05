import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

import { cloudflare } from "@cloudflare/vite-plugin";

export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    tailwindcss(),
    // Only use Cloudflare plugin in build/preview — it interferes with SPA routing in dev
    ...(mode !== 'development' ? [cloudflare()] : []),
  ],
}))