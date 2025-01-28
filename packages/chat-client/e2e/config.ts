const _configKeys = ['API_URL', 'ENCRYPTION_KEY'] as const

const values: Partial<Record<ConfigKey, string>> = {}

export type ConfigKey = (typeof _configKeys)[number]
export const get = (key: ConfigKey): string => {
  const cached = values[key]
  if (cached) {
    return cached
  }

  const value = process.env[key]
  if (!value) {
    throw new Error(`${key} not set`)
  }

  values[key] = value
  console.info(`config: ${key}=${value}`)
  return value
}
