import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import checker from 'vite-plugin-checker'
import { resolve } from 'path'

export default defineConfig({
  plugins: [
    react(),
    checker({
      typescript: {
        tsconfigPath: 'tsconfig.app.json'
      },
      overlay: {
        initialIsOpen: false,
        position: 'tl',
        badgeStyle: 'display: none;'
      }
    })
  ],
  resolve: {
    alias: [
      { find: 'child-locator', replacement: resolve(__dirname, '../child-locator/src/index.ts') },
      { find: 'child-locator/', replacement: resolve(__dirname, '../child-locator/src/') },
    ],
  },
  server: {
    port: 59517,
    hmr: {
      overlay: false
    }
  },
  preview: {
    port: 59517
  }
})
