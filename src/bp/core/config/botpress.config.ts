export type DatabaseType = 'postgres' | 'sqlite'

export type BotpressCondition = '$isProduction' | '$isDevelopment'

export type ModuleConfigEntry = {
  location: string
  enabled: boolean
}

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
  janitorInterval: string
  timeoutInterval: string
}

export interface LogsConfig {
  expiration: string
  janitorInterval: string
}

export type BotpressConfig = {
  jwtSecret: string
  httpServer: {
    host?: string
    port: number
    proxyPort: number
    backlog: number
    bodyLimit: string | number
    cors: {
      enabled?: boolean
      origin?: string
    }
  }
  database: DatabaseConfig
  ghost: {
    enabled: boolean | BotpressCondition
  }
  dialog: DialogConfig
  logs: LogsConfig
  modules: Array<ModuleConfigEntry>
  /**
   * The license key for the server.  Optionally you can use the BP_LICENSE_KEY env variable.
   * You can purchase a license on https://botpress.io
   * For usage with Botpress Pro/Enterprise.
   */
  licenseKey: string
  allowStats: boolean
}
