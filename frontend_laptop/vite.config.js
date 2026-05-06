import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import basicSsl from '@vitejs/plugin-basic-ssl'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    basicSsl() // This forces HTTPS, which is REQUIRED for mobile phones to access the webcam over local Wi-Fi!
  ],
  server: {
    host: true, 
  }
})
