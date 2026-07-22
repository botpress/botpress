import * as types from '../types'

export default {
  name: 'control',
  instantiationThreshold: 35000,
  sourceCode: `
import { z } from '@bpinternal/zui'

export const c = z.object({ a: z.string(), b: z.number() })
export type C = z.infer<typeof c>
`,
} satisfies types.BenchmarkCase
