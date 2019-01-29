import { AuthUser } from 'core/misc/interfaces'

export type DatabaseType = 'postgres' | 'sqlite'
export type AuthStrategy = 'basic' | 'saml' | 'ldap'

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
   * @default botpress
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

    redis: {
      /**
       * Whether or not Redis is enabled.  You must enable Redis in order to use the Botpress in cluster mode.
       * @default false
       */
      enabled: boolean
      /**
       * The full URL of the Redis server.  Each node in the Botpress cluster must be able to connect to this Redis server.
       * Format = [redis[s]:]//[[user][:password@]][host][:port][/db-number][?db=db-number[&password=bar[&option=value]]]
       * See http://www.iana.org/assignments/uri-schemes/prov/redis for more information
       * @default redis://127.0.0.1:6379
       */
      url: string
    }
    auth: {
      /**
       * Defines which authentication strategy to use. When the strategy is changed, accounts created before may no longer log in.
       * @default basic
       */
      strategy: AuthStrategy
      /**
       * Defines custom options based on the chosen authentication strategy
       */
      options: AuthStrategySaml | AuthStrategyLdap | undefined
      /**
       * Maps the values returned by your provider to Botpress user parameters.
       * @example fieldMapping: { email: 'emailAddress', fullName: 'givenName' }
       */
      fieldMapping: FieldMapping
      /**
       * When enabled, users are able to register new accounts by themselves. For example, if you use the SAML strategy and this is enabled,
       * any user able to sign in using your SAML provider will create automatically an account on Botpress.
       * @default false
       */
      allowSelfSignup: boolean
    }
  }
  /**
   * An array of e-mails of users which will have root access to Botpress (manage users, server settings)
   * @example: [admin@botpress.io]
   */
  superAdmins: string[]
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
   * @default 10m
   */
  janitorInterval: string
  policies: RetentionPolicy
}

/**
 * @example "profile.email": "30d"
 * @default {}
 */
export type RetentionPolicy = {
  [key: string]: string
}

export interface AuthStrategySaml {
  /**
   * This is the page of the external saml provider where users will input their username / password
   */
  authEndpoint: string
  /**
   * The callback url is called by the SAML provider with the payload. The path provided here is relative to ${externalUrl}/admin
   * For example, if you use the default callback, it will be available at http://localhost:3000/admin/login-callback
   * @default /login-callback
   */
  callbackUrl: string
  issuer: string
  certificate: string
  /**
   * Change if there is a significant time difference between this server and your identity provider
   * @default 5000
   */
  acceptedClockSkewMs: number
}

export interface AuthStrategyLdap {
  serverUrl: string
  /**
   * @example cn=read-only-admin,dc=example,dc=com
   */
  bindDn: string
  bindCredentials: string
  /**
   * @example dc=example,dc=com
   */
  searchBase: string
  /**
   * @example (uid={{username}})
   */
  searchFilter: string
  timeout: number
  tlsEnabled: boolean
  /**
   * Path to certificates on the file system
   * @example certificates: ["/path/to/ca/certificate.pem"]
   */
  certificates: string[]
}

export type FieldMapping = { [key in keyof Partial<AuthUser>]?: string }
