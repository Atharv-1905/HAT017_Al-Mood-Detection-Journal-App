import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // In Electron, we load from file:// so assets must use relative paths
  base: process.env.ELECTRON === 'true' ? './' : '/',
  build: {
    // Output to dist/ which Electron loads in production
    outDir: 'dist',
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return;
          if (id.includes('react') || id.includes('scheduler')) return 'vendor-react';
          if (id.includes('recharts') || id.includes('d3')) return 'vendor-charts';
          if (id.includes('framer-motion')) return 'vendor-motion';
          if (id.includes('lucide-react')) return 'vendor-icons';
          return 'vendor-misc';
        },
      },
    },
  },
  server: {
    // Ensure Vite dev server is accessible to Electron
    port: 5173,
    strictPort: true,
  },
})
