import { defineConfig } from 'vitest/config'
import { nodePolyfills } from 'vite-plugin-node-polyfills'

import react from '@vitejs/plugin-react-swc'
import path from 'path'
// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    nodePolyfills({
      include: ['path', 'process'],
    }),
  ],
  resolve: {
    alias: {
      zod: path.resolve(__dirname, './src/zod/index.ts'),
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
  },
})
