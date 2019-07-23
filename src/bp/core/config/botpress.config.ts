import { ConverseConfig } from 'botpress/sdk'
import { UniqueUser } from 'common/typings'
import { IncidentRule } from 'core/services/alerting-service'

export type BotpressCondition = '$isProduction' | '$isDevelopment'

export type ModuleConfigEntry = {
  location: string
  enabled: boolean
}

export interface DialogConfig {
  /**
   * Interval between executions of the janitor that checks for stale contexts and sessions.
   * @default 10s
   */
  janitorInterval: string
  /**
   * Interval before a session's context expires.
   * e.g. when the conversation is stale and has not reach the END of the flow.
   * This will reset the position of the user in the flow.
   * @default 2m
   */
  timeoutInterval: string
  /**
   * Interval before a session expires. e.g. when the user has not spoken for a while.
   * The session including its variable will be deleted.
   * @default 30m
   */
  sessionTimeoutInterval: string
}

/**
 * Configuration file definition for the Converse API
 */
export type ConverseConfig = {
  /**
   * The timeout of the converse API requests
   * @default 5s
   */
  timeout: string
}

export interface LogsConfig {
  /**
   * The database output will not record Debug logs.
   */
  dbOutput: {
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
  /**
   * The file output records everything that is displayed in the console logs.
   */
  fileOutput: {
    /**
     * Enable or disable the output of logs to the file system. A new file is created each day
     * @default false
     */
    enabled: boolean
    /**
     * The path (relative or absolute) to the logs folder.
     * @default ./
     */
    folder: string
    /**
     * The maximum file size that the log can reach before a new one is started (size in kb)
     * @default 10000
     */
    maxFileSize: number
  }
}

/**
 * Many configuration options allows you to specify textually the duration, interval, etc.
 * We use the library "ms", so head over to this page to see supported formats: https://www.npmjs.com/package/ms
 */

export type BotpressConfig = {
  version: string
  appSecret: string
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
     * There are two external URL that Botpress calls: https://license.botpress.io and https://duckling.botpress.io
     * If you are behind a corporare proxy, you can configure it below.
     * It is also possible to self-host Duckling, please check the documentation
     *
     * @example http://username:password@hostname:port
     */
    proxy?: string
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
    session: {
      /**
       * @default false
       */
      enabled: boolean
      /**
       * Time from Date.now() for expiry
       * Defaults to one hour
       * @default 1h
       */
      maxAge: string
    }
  }
  converse: ConverseConfig
  dialog: DialogConfig
  logs: LogsConfig
  modules: Array<ModuleConfigEntry>
  pro: {
    /**
     * These strategies are allowed to log on the Admin UI.
     * Once a user is logged on, he still needs individual access to respective workspaces
     * @default  ["default"]
     */
    collaboratorsAuthStrategies: string[]
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
    monitoring: MonitoringConfig
    /**
     * The alert service is an extension of the monitoring service. The monitoring collects data, while the alert service
     * analyzes them and opens an incident when configured threshold are met.
     */
    alerting: AlertingConfig
    /**
     * External Authentication makes it possible to authenticate end-users (chat users) from an other system
     * by using JWT tokens.
     *
     * In addition to authenticate the users, the JWT token can also contain arbitrary additional
     * data about the user that you would like to make Botpress aware of.
     *
     * The identity of the user will be checked for every incoming message and the additional data in the JWT token
     * will be available in `event.credentials`.
     */
    externalAuth?: ExternalAuthConfig
  }
  /**
   * An array of e-mails of users which will have root access to Botpress (manage users, server settings)
   * @example: [admin@botpress.io]
   */
  superAdmins: UniqueUser[]
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
  /**
   * An array of categories in which a bot can be created in your botpress installation. Good for platform use-cases.
   * @example: ['customer service', 'e-commerce', 'etc']
   * @default []
   */
  botCategories: string[]
  /**
   * When this option is enabled, Super Admins are able to reboot the Botpress Server via the Admin UI
   * We recommend disabling this in a production environment, and if you use a process management tool like PM2
   *
   * @default true
   */
  allowServerReboot: boolean
  fileUpload: {
    /**
     * Maximum file size for media files upload (in mb)
     * @default 10mb
     */
    maxFileSize: string
    /**
     * The list of allowed extensions for media file uploads
     * @default ["image/jpeg","image/png","image/gif"]
     */
    allowedMimeTypes: string[]
  }
  jwtToken: {
    /**
     * The duration for which the token granting access to manage Botpress will be active.
     * @default 6h
     */
    duration: string
    /**
     * When enabled, the token is refreshed every 5 minutes while the user is connected
     * @default true
     */
    allowRefresh: boolean
  }
  /**
   * When enabled, a bot revision will be stored in the revisions directory when it change or its about to change stage
   * @default false
   */
  autoRevision: boolean
  eventCollector: EventCollectorConfig
  /**
   * @default { "default": { "type": "basic", "allowSelfSignup": false, "options": { "maxLoginAttempt": 0} }}
   */
  authStrategies: {
    [strategyId: string]: AuthStrategy
  }
  /**
   * Displays the "Powered by Botpress" under the webchat.
   * Help us spread the word, enable this to show your support !
   * @default true
   */
  showPoweredBy: boolean
}

export interface ExternalAuthConfig {
  /** Set to true to enable external authentification
   * @default false
   */
  enabled: boolean
  /**
   * If provided, the audience of the token will be checked against the provided value(s).
   * [Click here](https://www.npmjs.com/package/jsonwebtoken#jwtverifytoken-secretorpublickey-options-callback) to learn more.
   */
  audience?: string | string[]
  /**
   * If provided, the issuer of the token will be checked against the provided value(s).
   * [Click here](https://www.npmjs.com/package/jsonwebtoken#jwtverifytoken-secretorpublickey-options-callback) to learn more.
   */
  issuer?: string | string[]
  /**
   * The algorithms allowed to validate the JWT tokens.
   * @default ["HS256"]
   */
  algorithms: string[]
  /**
   * You need to provide the public key used to verify the JWT token authenticity.
   * If not provided, the public key will be read from `data/global/end_users_auth.key`
   * @default insert key here
   */
  publicKey?: string
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

export type AuthStrategyType = 'basic' | 'saml' | 'ldap'

export interface AuthStrategy {
  readonly id: string
  /**
   * Defines which authentication strategy to use. When the strategy is changed, accounts created before may no longer log in.
   * @default basic
   */
  type: AuthStrategyType
  /**
   * Defines custom options based on the chosen authentication strategy
   */
  options: AuthStrategySaml | AuthStrategyLdap | AuthStrategyBasic | undefined
  /**
   * Maps the values returned by your provider to Botpress user parameters.
   * @example fieldMapping: { email: 'emailAddress', fullName: 'givenName' }
   */
  fieldMapping?: FieldMapping
  /**
   * When enabled, users are able to register new accounts by themselves. For example, if you use the SAML strategy and this is enabled,
   * any user able to sign in using your SAML provider will create automatically an account on Botpress.
   * @default false
   */
  allowSelfSignup: boolean
}

export interface AuthStrategyBasic {
  /**
   * The maximum number of wrong passwords the user can enter before his account is locked out.
   * Set it to 0 for unlimited tries
   * @default 0
   */
  maxLoginAttempt: number
  /**
   * The amount of time the account will be locked out after reaching the threshold of max login attempt.
   * Leave undefined to never automatically unlock the user. The delay is reset on each attempt.
   * To unlock a user, edit manually the file data/global/workspaces.json and set "locked_out" to false
   *
   * @example 10m (unlock after 10 minutes - resets unsuccessful attempts)
   */
  lockoutDuration?: string
  /**
   * The password will expire after the duration specified here, prompting the user to change it
   * @example 30d (expires in 30 days)
   * @default
   */
  passwordExpiryDelay?: string
  /**
   * The minimum length of the password. None if undefined.
   */
  passwordMinLength?: number
  /**
   * When enabled, the password must have at least one character from 3 of these categories: lowercase, uppercase, number, special char
   * @default false
   */
  requireComplexPassword?: boolean
}

/**
 *  SAML Options, identical to the "passeport-saml" NPM library
 *  @see https://github.com/bergie/passport-saml
 */
export interface AuthStrategySaml {
  /**
   * This is the page of the external SAML IdP where users will login
   */
  entryPoint: string
  /**
   * The callback url is called by the SAML provider with the payload. The path provided here is absolute.
   * @default http://localhost:3000/admin/login-callback
   */
  callbackUrl: string
  /**
   * The callback url is called by the SAML provider with the payload. The path provided here is relative to ${externalUrl}/admin
   * For example, if you use the default callback, it will be available at http://localhost:3000/admin/login-callback
   * @default /login-callback
   */
  path?: string
  /**
   * The `entityID` you provided the IdP
   * @default botpress-server-saml
   */
  issuer: string
  /**
   * The public PEM certificate provided by the SAML IdP, starting with "-----BEGIN CERTIFICATE-----"
   * The string should be provided as one line (use \n for new lines)
   * @default <paste PEM certificate>
   */
  cert: string
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

export type FieldMapping = { [bpAttribute: string]: string }

export interface MonitoringConfig {
  /**
   * To enable server monitoring, you need to enable the Pro version and configure your Redis server.
   * @default false
   */
  enabled: boolean
  /**
   * The interval between data collection of metrics and usage. The lower the value brings more details,
   * but comes at the cost of more storage required & processing time when viewing data.
   * @default 10s
   */
  collectionInterval: string
  /**
   * Data older than this will be cleared periodically.
   * @default 10d
   */
  retentionPeriod: string
  /**
   * The delay between execution of the janitor which removes statistics outside of the previously defined period
   * @default 15m
   */
  janitorInterval: string
}

export interface AlertingConfig {
  /**
   * To enable the alerting service, you need to enable the monitoring first.
   * @default false
   */
  enabled: boolean
  /**
   * Interval between each executions of the rule checker
   * @default 10s
   */
  watcherInterval: string
  /**
   * The duration for which resolved incidents will be kept
   * @default 10d
   */
  retentionPeriod: string
  /**
   * Delay between the execution of the janitor which removes resolved incidents.
   * @default 15m
   */
  janitorInterval: string
  /**
   * The list of rules which triggers an incident. When triggered, the OnIncidentChangedStatus hook
   * is called with the incident.
   */
  rules: IncidentRule[]
}

export interface EventCollectorConfig {
  /**
   * When enabled, incoming and outgoing events will be saved on the database.
   * It is required for some modules to work proprely (eg: history, testing, developer tools on channel web)
   * @default true
   */
  enabled: boolean
  /**
   * Events are batched then sent to the database. Change the delay to save them more frequently or not.
   * @default 1s
   */
  collectionInterval: string
  /**
   * The duration for which events will be kept in the database
   * @default 30d
   */
  retentionPeriod: string
  /**
   * Specify an array of event types that won't be persisted to the database. For example, typing events and visits
   * may not provide you with useful informations
   * @default ["visit","typing"]
   */
  ignoredEventTypes: string[]
  /**
   * Specify an array of properties that will be stripped from the event before being saved. For example, the "state" property of the event
   * contains a lot of details about the user session (context, attributes, etc) and may not be useful in some cases.
   * @default []
   */
  ignoredEventProperties: string[]
}
