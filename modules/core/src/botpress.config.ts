export type BotpressConfig = {
  database: BotpressConfigDatabaseEntry
}

export type BotpressConfigDatabaseEntry = {
  type: DatabaseType
  location?: string
  host?: string
  port?: number
  user?: string
  password?: string
  database?: string
}

export type DatabaseType = 'postgres' | 'sqlite'
