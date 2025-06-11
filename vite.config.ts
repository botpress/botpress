import { defineConfig } from 'vitest/config'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [],
  test: {
    setupFiles: ['./src/setup.test.ts'],
    environment: 'jsdom',
    globals: true,
    exclude: ['**/node_modules/**', './src/setup.test.ts'],
  },
})
