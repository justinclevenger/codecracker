import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'
import { createRequire } from 'module'

const require = createRequire(import.meta.url)

const cryptoBrowserify = path.dirname(require.resolve('crypto-browserify'))
const bufferModule = path.dirname(require.resolve('buffer/'))
const streamBrowserify = path.dirname(require.resolve('stream-browserify'))

export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: '/codecracker/',
  resolve: {
    alias: {
      codecracker: path.resolve(__dirname, '../src/index.ts'),
      'node:crypto': cryptoBrowserify,
      'node:buffer': bufferModule,
      'node:stream': streamBrowserify,
      crypto: cryptoBrowserify,
      buffer: bufferModule,
      stream: streamBrowserify,
    },
  },
  define: {
    'process.env': {},
    global: 'globalThis',
  },
})
