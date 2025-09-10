import { fileURLToPath, URL } from 'url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  server: {
    host: true,
    // Comment out ngrok settings for local development
    // allowedHosts: ['bbcde6e68363.ngrok-free.app'],
    // hmr: {
    //   protocol: 'wss',
    //   host: 'bbcde6e68363.ngrok-free.app'
    // }
  },
  css: {
    preprocessorOptions: {
      scss: {
        additionalData: '@use "@/assets/css/abstracts/variables.scss" as *;@use "@/assets/css/abstracts/mixins.scss" as *;'
      }
    }
  }
})
