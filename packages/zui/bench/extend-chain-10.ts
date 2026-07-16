import { z } from '@bpinternal/zui'

export const s0 = z.object({
  s0_k0: z.string(),
  s0_k1: z.string(),
  s0_k2: z.string(),
  s0_k3: z.string(),
  s0_k4: z.string(),
})

export const s1 = s0.extend({
  s1_k0: z.string(),
  s1_k1: z.string(),
  s1_k2: z.string(),
  s1_k3: z.string(),
  s1_k4: z.string(),
})

export const s2 = s1.extend({
  s2_k0: z.string(),
  s2_k1: z.string(),
  s2_k2: z.string(),
  s2_k3: z.string(),
  s2_k4: z.string(),
})

export const s3 = s2.extend({
  s3_k0: z.string(),
  s3_k1: z.string(),
  s3_k2: z.string(),
  s3_k3: z.string(),
  s3_k4: z.string(),
})

export const s4 = s3.extend({
  s4_k0: z.string(),
  s4_k1: z.string(),
  s4_k2: z.string(),
  s4_k3: z.string(),
  s4_k4: z.string(),
})

export const s5 = s4.extend({
  s5_k0: z.string(),
  s5_k1: z.string(),
  s5_k2: z.string(),
  s5_k3: z.string(),
  s5_k4: z.string(),
})

export const s6 = s5.extend({
  s6_k0: z.string(),
  s6_k1: z.string(),
  s6_k2: z.string(),
  s6_k3: z.string(),
  s6_k4: z.string(),
})

export const s7 = s6.extend({
  s7_k0: z.string(),
  s7_k1: z.string(),
  s7_k2: z.string(),
  s7_k3: z.string(),
  s7_k4: z.string(),
})

export const s8 = s7.extend({
  s8_k0: z.string(),
  s8_k1: z.string(),
  s8_k2: z.string(),
  s8_k3: z.string(),
  s8_k4: z.string(),
})

export const s9 = s8.extend({
  s9_k0: z.string(),
  s9_k1: z.string(),
  s9_k2: z.string(),
  s9_k3: z.string(),
  s9_k4: z.string(),
})

export const s10 = s9.extend({
  s10_k0: z.string(),
  s10_k1: z.string(),
  s10_k2: z.string(),
  s10_k3: z.string(),
  s10_k4: z.string(),
})

export type Out = z.infer<typeof s10>

export type In = z.input<typeof s10>
