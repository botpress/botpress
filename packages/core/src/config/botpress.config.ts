export type DatabaseType = 'postgres' | 'sqlite'

export interface DatabaseConfig {
  migrations?: string
  type: DatabaseType
  url?: string
  location?: string
  host?: string
  port?: number
  user?: string
  password?: string
  ssl?: boolean
  database?: string
}

export interface DialogConfig {
  janitorInterval: number
  timeoutInterval: number
}

export type BotpressConfig = {
  httpServer: {
    host?: string
    port: number
    backlog: number
    bodyLimit: string | number
  }
  database: DatabaseConfig
  dialog: DialogConfig
}
