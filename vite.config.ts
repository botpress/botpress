import { defineConfig } from 'vitest/config'

import react from '@vitejs/plugin-react-swc'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  test: {
    setupFiles: ['./src/setup.test.ts'],
    environment: 'jsdom',
    globals: true,
    exclude: ['**/node_modules/**', './src/setup.test.ts'],
  },
})
