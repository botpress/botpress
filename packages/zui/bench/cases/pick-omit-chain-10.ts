import * as types from '../types'

export default {
  name: 'pick-omit-chain-10',
  instantiationThreshold: 67000,
  sourceCode: `
import { z } from '@bpinternal/zui'

export const s0 = z.object({
  s0_k0: z.string(),
  s0_k1: z.string(),
  s0_k2: z.string(),
  s0_k3: z.string(),
  s0_k4: z.string(),
  s0_k5: z.string(),
  s0_k6: z.string(),
  s0_k7: z.string(),
  s0_k8: z.string(),
  s0_k9: z.string(),
  s0_k10: z.string(),
  s0_k11: z.string(),
  s0_k12: z.string(),
  s0_k13: z.string(),
  s0_k14: z.string(),
  s0_k15: z.string(),
  s0_k16: z.string(),
  s0_k17: z.string(),
  s0_k18: z.string(),
  s0_k19: z.string(),
})

export const s1 = s0.pick({
  s0_k0: true,
  s0_k1: true,
  s0_k2: true,
  s0_k3: true,
  s0_k4: true,
  s0_k5: true,
  s0_k6: true,
  s0_k7: true,
  s0_k8: true,
  s0_k9: true,
  s0_k10: true,
  s0_k11: true,
  s0_k12: true,
  s0_k13: true,
  s0_k14: true,
  s0_k15: true,
  s0_k16: true,
  s0_k17: true,
  s0_k18: true,
})

export const s2 = s1.omit({ s0_k0: true })

export const s3 = s2.extend({
  s3_k0: z.string(),
  s3_k1: z.string(),
  s3_k2: z.string(),
})

export const s4 = s3.pick({
  s0_k1: true,
  s0_k2: true,
  s0_k3: true,
  s0_k4: true,
  s0_k5: true,
  s0_k6: true,
  s0_k7: true,
  s0_k8: true,
  s0_k9: true,
  s0_k10: true,
  s0_k11: true,
  s0_k12: true,
  s0_k13: true,
  s0_k14: true,
  s0_k15: true,
  s0_k16: true,
  s0_k17: true,
  s0_k18: true,
  s3_k0: true,
  s3_k1: true,
})

export const s5 = s4.omit({ s0_k1: true })

export const s6 = s5.extend({
  s6_k0: z.string(),
  s6_k1: z.string(),
  s6_k2: z.string(),
})

export const s7 = s6.pick({
  s0_k2: true,
  s0_k3: true,
  s0_k4: true,
  s0_k5: true,
  s0_k6: true,
  s0_k7: true,
  s0_k8: true,
  s0_k9: true,
  s0_k10: true,
  s0_k11: true,
  s0_k12: true,
  s0_k13: true,
  s0_k14: true,
  s0_k15: true,
  s0_k16: true,
  s0_k17: true,
  s0_k18: true,
  s3_k0: true,
  s3_k1: true,
  s6_k0: true,
  s6_k1: true,
})

export const s8 = s7.omit({ s0_k2: true })

export const s9 = s8.extend({
  s9_k0: z.string(),
  s9_k1: z.string(),
  s9_k2: z.string(),
})

export const s10 = s9.pick({
  s0_k3: true,
  s0_k4: true,
  s0_k5: true,
  s0_k6: true,
  s0_k7: true,
  s0_k8: true,
  s0_k9: true,
  s0_k10: true,
  s0_k11: true,
  s0_k12: true,
  s0_k13: true,
  s0_k14: true,
  s0_k15: true,
  s0_k16: true,
  s0_k17: true,
  s0_k18: true,
  s3_k0: true,
  s3_k1: true,
  s6_k0: true,
  s6_k1: true,
  s9_k0: true,
  s9_k1: true,
})

export type Out = z.infer<typeof s10>
`,
} satisfies types.BenchmarkCase
