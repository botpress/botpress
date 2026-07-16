import { z } from '@bpinternal/zui'

export const c = z.object({ a: z.string(), b: z.number() })
export type C = z.infer<typeof c>
