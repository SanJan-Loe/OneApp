import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'
import electron from 'vite-plugin-electron'
export default defineConfig({
  plugins: [
    vue({
      template: {
        compilerOptions: {
          isCustomElement: tag => ['webview', 'WebView'].includes(tag)
        }
      }
    }),
    electron({
      entry: 'electron/main.ts',
      onstart(options) {
        options.startup()
      },
      vite: {
        configFile: 'tsconfig.electron.json',
        resolve: {
          extensions: ['.mts', '.ts', '.js', '.json']
        },
        build: {
          outDir: 'dist-electron',
          target: 'node20',
          minify: 'terser',
          rollupOptions: {
            input: {
              main: 'electron/main.ts',
              preload: 'electron/preload.mts'
            },
            external: ['electron'],
            output: {
              format: 'es',
              entryFileNames: '[name].js',
              chunkFileNames: '[name]-[hash].js',
              generatedCode: {
                constBindings: true
              }
            }
          },
          watch: {}
        }
      }
    })
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  build: {
    minify: 'terser',
    sourcemap: process.env.NODE_ENV !== 'production',
    outDir: 'dist',
    emptyOutDir: true,
    target: 'esnext',
    modulePreload: {
      polyfill: false
    },
    terserOptions: {
      ecma: 2020,
      compress: {
        drop_console: process.env.NODE_ENV === 'production',
        passes: 3
      }
    }
  },
  esbuild: {
    target: 'es2022',
    legalComments: 'none'
  }
})
