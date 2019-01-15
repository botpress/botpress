export type DatabaseType = 'postgres' | 'sqlite'

export type BotpressCondition = '$isProduction' | '$isDevelopment'

export type ModuleConfigEntry = {
  location: string
  enabled: boolean
}

export interface DatabaseConfig {
  migrations?: string
  /**
   * @default sqlite
   */
  type: DatabaseType
  url?: string
  /**
   * @default %BOTPRESS_DIR%/data/storage/core.sqlite
   */
  location?: string
  /**
   * @default localhost
   */
  host?: string
  /**
   * @default 5432
   */
  port?: number
  /**
   * @default postgres
   */
  user?: string
  /**
   * @default
   */
  password?: string
  ssl?: boolean
  /**
   * @default botpress_test
   */
  database?: string
}

export interface DialogConfig {
  /**
   * Interval between executions of the janitor to check for stale sessions
   * @default 10s
   */
  janitorInterval: string
  /**
   * The delay before a stale session will get sweeped by the janitor
   * @default 2m
   */
  timeoutInterval: string
  /**
   * The delay before we consider that it is a new interaction (ex: different subject). We keep the user's last messages
   * and variables in the session context to customize interactions.
   * @default 30m
   */
  sessionTimeoutInterval: string
}

export interface LogsConfig {
  /**
   * Logs will be kept for this amount of time in the database
   * @default 2 weeks
   */
  expiration: string
  /**
   * @default 30s
   */
  janitorInterval: string
}

export type BotpressConfig = {
  jwtSecret: string
  httpServer: {
    /**
     * @default localhost
     */
    host: string
    /**
     * @default 3000
     */
    port: number
    /**
     * @default 0
     */
    backlog: number
    /**
     * @default 100kb
     */
    bodyLimit: string | number
    cors: {
      /**
       * @default true
       */
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
  dialog: DialogConfig
  logs: LogsConfig
  modules: Array<ModuleConfigEntry>
  pro: {
    /**
     * When pro features are enabled, the license key must be provided
     * @default false
     */
    enabled: boolean
    /**
     * The license key for the server.  Optionally you can use the BP_LICENSE_KEY env variable.
     * You can purchase a license on https://botpress.io
     * For usage with Botpress Pro/Enterprise.
     * @default paste your license key here
     */
    licenseKey: string
  }
  /**
   * When enabled, Botpress collects anonymous data about the bot's usage
   * @default true
   */
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
