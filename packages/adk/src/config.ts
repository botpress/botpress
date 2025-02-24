import { z } from '@botpress/sdk'

const configSchema = z.object({})

type Config = z.infer<typeof configSchema>

export const defineConfig = (config: Config = {}) => {
  return config
}
