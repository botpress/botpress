import zod from 'zod'

export const CONFIG_ENV_KEY = 'CHILD_PROCESS_CONFIGURATION'

export type Config = zod.infer<typeof configSchema>
export const configSchema = zod.union([
  zod.object({
    type: zod.literal('code'),
    code: zod.string(),
    env: zod.record(zod.string(), zod.string()).optional(),
  }),
  zod.object({
    type: zod.literal('file'),
    file: zod.string(),
    env: zod.record(zod.string(), zod.string()).optional(),
  }),
])
