import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import electron from 'vite-plugin-electron/simple'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    electron({
      main:{
        entry: 'electron/main.js',
      },
      preload:{
        input: 'electron/preload.mjs'
      }
    })
  ],
})
