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
    host: string
    port: number
    backlog: number
    bodyLimit: string | number
    cors: {
      enabled?: boolean
      origin?: string
    }
    /**
     * Represents the complete base URL exposed externally by your bot. This is useful if you configure the bot
     * locally and use NGINX as a reverse proxy to handle HTTPS. It should include the protocol and no trailing slash.
     * If unset, it will be constructed from the real host/port
     * @example https://botpress.io
     */
    externalUrl?: string
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
  sendUsageStats: boolean
  /**
   * When this feature is enabled, fields saved as user attributes will be automatically erased when they expires. The timer is reset each time the value is modified
   * Setting a policy called "email": "30d" means that once an email is set, it will be removed in 30 days, unless it is changed in that timespan
   */
  dataRetention?: DataRetentionConfig
}

export interface DataRetentionConfig {
  /**
   * The janitor will check for expired fields at the set interval (second, minute, hour, day)
   * @example 1m
   */
  janitorInterval: string
  policies: RetentionPolicy
}

/**
 * @example "profile.email": "30d"
 */
export type RetentionPolicy = {
  [key: string]: string
}
