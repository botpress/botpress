import { z } from '@botpress/sdk'

export const CONFIG_ENV_KEY = 'CHILD_PROCESS_CONFIGURATION'

export type Config = z.infer<typeof configSchema>
export const configSchema = z.union([
  z.object({
    type: z.literal('code'),
    code: z.string(),
    env: z.record(z.string(), z.string()).optional(),
  }),
  z.object({
    type: z.literal('file'),
    file: z.string(),
    env: z.record(z.string(), z.string()).optional(),
  }),
])
