import * as types from '../types.js'

export default {
  name: 'control',
  instantiationThreshold: 35000,
  sourceCode: `
import { z, IntegrationDefinition } from '@botpress/sdk'

export default new IntegrationDefinition({
  name: 'control',
  version: '0.0.1',
  configuration: {
    schema: z.object({ apiKey: z.string() }),
  },
  actions: {
    doThing: {
      input: { schema: z.object({ foo: z.string() }) },
      output: { schema: z.object({ bar: z.string() }) },
    },
  },
  events: {
    onThing: {
      schema: z.object({ baz: z.string() }),
    },
  },
})
`,
} satisfies types.BenchmarkCase
