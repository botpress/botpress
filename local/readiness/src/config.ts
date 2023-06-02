import chalk from 'chalk'
import { z } from 'zod'

const postgresCheck = z.object({
  type: z.literal('postgres'),
  name: z.string(),
  uri: z.string(),
})

export type PostgresCheck = z.infer<typeof postgresCheck>

const httpCheck = z.object({
  type: z.literal('http'),
  name: z.string(),
  url: z.string(),
})

export type HttpCheck = z.infer<typeof httpCheck>

const redisCheck = z.object({
  type: z.literal('redis'),
  name: z.string(),
  uri: z.string(),
})

export type RedisCheck = z.infer<typeof redisCheck>

const configSchema = z.array(z.discriminatedUnion('type', [postgresCheck, httpCheck, redisCheck]))

export type Config = z.infer<typeof configSchema>

export const getConfig = () => {
  const configContent = process.env.CONFIG

  if (!configContent) {
    throw new Error(`${chalk.red('Missing config!')} Please set the CONFIG environment variable`)
  }

  try {
    const config = JSON.parse(configContent)
    const parsedConfig = configSchema.safeParse(config)

    if (!parsedConfig.success) {
      const zodError = parsedConfig.error.errors[0]

      if (zodError) {
        throw new Error(`path: .${zodError.path.join('.')}, message: ${zodError.message}`)
      } else {
        throw new Error('Unknown error')
      }
    }

    return parsedConfig.data
  } catch (err) {
    if (typeof err === 'object' && err !== null) {
      if ('message' in err) {
        throw new Error(`Invalid config: ${err?.message}`)
      }
    }

    throw new Error(`Invalids config: ${err}`)
  }
}
