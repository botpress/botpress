import { defineConfig } from 'orval'

export default defineConfig({
  api: {
    input: './openapi.json',
    output: {
      mode: 'zod',
      target: 'src/gen/api.ts',
    },
  },
})
