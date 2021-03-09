import { ConverseConfig } from 'botpress/sdk'
import { CookieOptions } from 'express'
import { Algorithm } from 'jsonwebtoken'

import { ActionServer, UniqueUser } from '../../common/typings'
import { IncidentRule } from '../services/alerting-service'

export type BotpressCondition = '$isProduction' | '$isDevelopment'

export interface ModuleConfigEntry {
  location: string
  enabled: boolean
}

export interface DialogConfig {
  /**
   * @title Janitor Execution Interval
   * @description Interval between executions of the janitor that checks for stale contexts and sessions.
   * @default 10s
   */
  janitorInterval: string
  /**
   * @title User Context Timeout Interval
   * @description Interval before a session's context expires.
   * e.g. when the conversation is stale and has not reached the END of the flow.
   * This will reset the position of the user in the flow.
   * @default 2m
   */
  timeoutInterval: string
  /**
   * @title Session Timeout Interval
   * @description Interval before a session expires. e.g. when the user has not spoken for a while.
   * The session including its variable will be deleted.
   * @default 30m
   */
  sessionTimeoutInterval: string
}

export interface LogsConfig {
  /**
   * @title Database Output
   * @description Store logs on the database (except debug logs)
   */
  dbOutput: {
    /**
     * @title Expiration
     * @description Logs will be kept for this amount of time in the database
     * @default 2 weeks
     */
    expiration: string
    /**
     * @title Janitor Execution Interval
     * @default 30s
     */
    janitorInterval: string
  }
  /**
   * @title File Output
   * @description This will logs everything displayed in the console in a file. A new file is created each day
   */
  fileOutput: {
    /**
     * @title Enabled
     * @default false
     */
    enabled: boolean
    /**
     * @title Log File Location
     * @description The path (relative or absolute) to the logs folder.
     * @default ./
     */
    folder: string
    /**
     * @title Maximum File Size
     * @description The maximum file size that the log can reach before a new one is started (size in kb)
     * @default 10000
     */
    maxFileSize: number
  }
}

/**
 * Many configuration options allows you to specify textually the duration, interval, etc.
 * We use the library "ms", so head over to this page to see supported formats: https://www.npmjs.com/package/ms
 */

export interface BotpressConfig {
  /**
   * @title HTTP Server Configuration
   */
  httpServer: {
    /**
     * @title Hostname
     * @description This is the host where the HTTP server will listen. Most of the time, it will be "localhost"
     * @default localhost
     */
    host: string
    /**
     * @title Port
     * @default 3000
     */
    port: number
    /**
     * There are three external URLs that Botpress calls: https://license.botpress.io, https://duckling.botpress.io and https://lang-01.botpress.io
     * If you are behind a corporate proxy, you can configure it below.
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
     * @title Request Body Max Limit
     * @default 10mb
     */
    bodyLimit: string | number
    /**
     * @title Cross-Origin Resource Sharing Configuration
     * @description CORS policy for the server. You can provide other configuration parameters
     * listed on this page: https://expressjs.com/en/resources/middleware/cors.html
     */
    cors: {
      /**
       * @title Enabled
       * @default true
       */
      enabled?: boolean
      /**
       * @title Allowed Origin
       * @description Configure the allowed hosts for the CORS policy
       */
      origin?: string
      /**
       * @title Send Credentials
       * @description This is required when using "useCookieStorage"
       */
      credentials?: boolean
    }
    /**
     * @title External URL
     * @description Represents the complete base URL exposed externally by your bot. This is useful if you configure the bot
     * locally and use NGINX as a reverse proxy to handle HTTPS. It should include the protocol and no trailing slash.
     * If unset, it will be constructed from the real host/port
     * @example https://botpress.com
     * @default
     */
    externalUrl?: string
    /**
     * @title HTTP Session
     * @description The session is required for some authentication mechanism
     */
    session: {
      /**
       * @title Enabled
       * @default false
       */
      enabled: boolean
      /**
       * @title Max Age
       * @description Time from Date.now() for expiry
       * Defaults to one hour
       * @default 1h
       */
      maxAge: string
    }
    /**
     * @title Socket Transports
     * @description sConfigure the priority for establishing socket connections for webchat and studio users.
     * If the first method is not supported, it will fallback on the second.
     * If the first is supported but it fails with an error, it will not fallback.
     * @default ["websocket","polling"]
     */
    socketTransports: string[]
    /**
     * @title Rate Limiter
     * @description Limit the number of requests a single host may send to your backend
     */
    rateLimit: {
      /**
       * @title Enabled
       * @description Security option to rate limit potential attacker trying to brute force something
       * @default false
       */
      enabled: boolean
      /**
       * @title Limit Window
       * @description Time window to compute rate limiting
       * @default 30s
       */
      limitWindow: string
      /**
       * @title Maximum Number of Requests
       * @description Maximum number of request in limit window to ban an IP. Keep in mind that this includes admin, studio and chat request so don't put it too low
       * @default 600
       */
      limit: number
    }
    /**
     * @title Custom Headers
     * @description Adds default headers to the server's responses
     * @default {"X-Powered-By":"Botpress"}
     */
    headers: { [name: string]: string }
  }
  /**
   * @title Converse Configuration
   */
  converse: ConverseConfig
  /**
   * @title Dialog Engine Configuration
   */
  dialog: DialogConfig
  /**
   * @title Logs Configuration
   */
  logs: LogsConfig
  /**
   * @title Modules Configuration
   */
  modules: Array<ModuleConfigEntry>
  /**
   * @title Botpress Enterprise Configuration
   */
  pro: {
    /**
     * @title Collaborators Authentication Strategies
     * @description These strategies are allowed to log on the Admin UI.
     * Once a user is logged on, he still needs individual access to respective workspaces
     * @default  ["default"]
     */
    collaboratorsAuthStrategies: string[]
    /**
     * @title Enabled
     * @description When pro features are enabled, the license key must be provided
     * @default false
     */
    enabled: boolean
    /**
     * @title License Key
     * @description The license key for the server.  Optionally you can use the BP_LICENSE_KEY env variable.
     * You can purchase a license on https://botpress.com
     * For usage with Botpress Pro/Enterprise.
     * @default paste your license key here
     */
    licenseKey: string
    /**
     * @title Monitoring Configuration
     */
    monitoring: MonitoringConfig
    /**
     * @title Alerting Configuration
     * @description The alert service is an extension of the monitoring service. The monitoring collects data, while the alert service
     * analyzes them and opens an incident when configured threshold are met.
     */
    alerting: AlertingConfig
    /**
     * @title External Authentication
     * @description External Authentication makes it possible to authenticate end-users (chat users) from another system
     * by using JWT tokens.
     *
     * In addition to authenticate the users, the JWT token can also contain arbitrary additional
     * data about the user that you would like to make Botpress aware of.
     *
     * The identity of the user will be checked for every incoming message and the additional data in the JWT token
     * will be available in `event.credentials`.
     */
    externalAuth?: ExternalAuthConfig
    /**
     * @title White Labeling
     * @description Configure the branding of the admin panel and the studio. A valid license is required
     */
    branding: {
      admin: {
        /**
         * Change the name displayed in the title bar on the admin panel
         * @example "Botpress Admin Panel"
         */
        title?: string
        /**
         * Replace the default favicon
         * @example "assets/ui-studio/public/img/favicon.png"
         */
        favicon?: string
        /**
         * Path to your custom stylesheet
         * @example "assets/custom/my-stylesheet.css"
         */
        customCss?: string
      }
      studio: {
        /**
         * Change the name displayed in the title bar on the studio
         * @example "Botpress Studio"
         */
        title?: string
        /**
         * Replace the default favicon
         * @example "assets/ui-studio/public/img/favicon.png"
         */
        favicon?: string
        /**
         * Path to your custom stylesheet
         * @example "assets/my-stylesheet.css"
         */
        customCss: string
      }
    }
  }
  /**
   * @title Super Administrators
   * @description An array of e-mails of users which will have root access to Botpress (manage users, server settings)
   * @example: [admin@botpress.com]
   */
  superAdmins: UniqueUser[]
  /**
   * @title Telemetry
   * @description When enabled, Botpress collects anonymous data about the bot's usage
   * @default true
   */
  sendUsageStats: boolean
  /**
   * @title Data Retention Configuration
   * @description When this feature is enabled, fields saved as user attributes will be automatically erased when they expires. The timer is reset each time the value is modified
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
   * @title Allow Server Reboot
   * @description When this option is enabled, Super Admins are able to reboot the Botpress Server via the Admin UI
   * We recommend disabling this in a production environment, and if you use a process management tool like PM2
   *
   * @default true
   */
  allowServerReboot: boolean
  /**
   * @title Media File Upload
   */
  fileUpload: {
    /**
     * @title Maximum File Size
     * @description Maximum file size for media files upload (in mb)
     * @default 10mb
     */
    maxFileSize: string
    /**
     * @title Allowed Mime Types
     * @description The list of allowed extensions for media file uploads
     * @default ["image/jpeg","image/png","image/gif"]
     */
    allowedMimeTypes: string[]
  }
  /**
   * @title JWT Token Configuration
   */
  jwtToken: {
    /**
     * @title Duration
     * @description The duration for which the token granting access to manage Botpress will be active.
     * @default 1h
     */
    duration: string
    /**
     * @title Allow Refresh
     * @description When enabled, the token is refreshed every 5 minutes while the user is connected
     * @default true
     */
    allowRefresh: boolean
    /**
     * @title Use Cookie Storage
     * @description Use an HTTP-Only secure cookie instead of the local storage for the JWT Token
     * @default false
     */
    useCookieStorage: boolean
    /**
     * Configure the options of the cookie sent to the user, for example the domain
     * @default {}
     */
    cookieOptions?: CookieOptions
  }
  /**
   * When enabled, a bot revision will be stored in the revisions directory when it change or its about to change stage
   * @default false
   */
  autoRevision: boolean
  /**
   * @title Event Collector
   */
  eventCollector: EventCollectorConfig
  /**
   * @title Bot Monitoring
   */
  botMonitoring: BotMonitoringConfig
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
  /**
   * When true, the bot will avoid repeating itself. By default it is disabled.
   * Use in conjunction with BP_DECISION_MIN_NO_REPEAT to set the time before the bot will repeat itself
   * @default false
   */
  noRepeatPolicy: boolean
  /**
   * By adding this, you'll make possible to translate a bot in more languages than those supported by your botpress language server
   * Warning: This means that Botpress NLU won't be working properly and you'll need to handle NLU on your own with a **beforeIncoming** Hook.
   * @example [{name: 'Swedish', code: 'sv'}]
   * @default []
   */
  additionalLanguages?: { name: string; code: string }[]

  /**
   * Action Servers to be used when dispatching actions.
   */

  actionServers: ActionServersConfig
  /**
   * Whether or not to display experimental features throughout the UI. These are subject
   * to change and can be unstable.
   * @default false
   */
  experimental: boolean

  telemetry: {
    /**
     * The number of entries stored in the telemetry database
     * @default 1000
     */
    entriesLimit: number
  }
  /**
   * @title Current Version
   * @description This is the current version of Botpress. Do not change this manually
   * @readonly
   */
  version: string
  /**
   * @title Application Secret
   * @description This secret is used to encrypt various
   */
  appSecret: string
}

export interface ExternalAuthConfig {
  /**
   * @title Enabled
   * @default false
   */
  enabled: boolean
  /**
   * @title Audience
   * @description If provided, the audience of the token will be checked against the provided value(s).
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
  algorithms: Algorithm[]
  /**
   * You need to provide the public key used to verify the JWT token authenticity.
   * If not provided, the public key will be read from `data/global/end_users_auth.key`
   * @default insert key here
   */
  publicKey?: string
  /**
   * @title JWKS Client
   * @description Alternatively, you can configure a client to fetch a JWKS file for the public key.
   * The audience, issuer and algorithms must also be provided.
   * @default undefined
   */
  jwksClient?: {
    /**
     * The full URL to the jwks.json file
     */
    jwksUri: string
    /**
     * The ID of the key in the jwks file
     */
    keyId: string
    /**
     * Provide additional options to pass to jwks-rsa (https://github.com/auth0/node-jwks-rsa)
     */
    [keyName: string]: any
  }
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
export interface RetentionPolicy {
  [key: string]: string
}

export type AuthStrategyType = 'basic' | 'saml' | 'ldap' | 'oauth2'

export interface AuthStrategy {
  readonly id?: string
  /**
   * Defines which authentication strategy to use. When the strategy is changed, accounts created before may no longer log in.
   * @default basic
   */
  type: AuthStrategyType
  /**
   * Set a label to display to users instead of the ID (ex: Botpress SSO)
   */
  label?: string
  /**
   * Defines custom options based on the chosen authentication strategy.
   */
  options: AuthStrategySaml | AuthStrategyLdap | AuthStrategyBasic | AuthStrategyOauth2 | undefined
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
   * @default 3
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

export interface AuthStrategyOauth2 {
  authorizationURL: string
  tokenURL: string
  clientID: string
  clientSecret: string
  /**
   * Scopes that should be requested from the service provider. Don't forget to map them in the fieldMapping property
   * @default openid profile email
   */
  scope: string | string[]
  /**
   * The Callback URL on this server where the service provider will return the user. Replace the last part with the strategy ID
   * @default http://localhost:3000/api/v1/auth/login-callback/oauth2/myauth
   */
  callbackURL: string
  /*
   * Set this URL if your access token doesn't include user data. Botpress will query that URL to fetch user information
   * @example https://botpress.com/userinfo
   */
  userInfoURL?: string
  /** If the access token is a JWT token, set the parameters below to decode it. */
  jwtToken?: {
    /** If provided, the audience of the token will be checked against the provided value(s). */
    audience?: string | string[]
    /** If provided, the issuer of the token will be checked against the provided value(s). */
    issuer?: string | string[]
    /**
     * The algorithms allowed to validate the JWT tokens.
     * @default ["HS256"]
     */
    algorithms: Algorithm[]
    /**
     * The public certificate starting with "-----BEGIN CERTIFICATE-----"
     * The string should be provided as one line (use \n for new lines)
     * If the key is not set, it will try to read the file `data/global/oauth2_YOUR_STRATEGY_ID.pub`
     */
    publicKey?: string
  }
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

export interface FieldMapping {
  [bpAttribute: string]: string
}

export interface MonitoringConfig {
  /**
   * @title Enabled
   * @description To enable server monitoring, you need to enable the Pro version and configure your Redis server.
   * @default false
   */
  enabled: boolean
  /**
   * @title Collection Interval
   * @description The interval between data collection of metrics and usage. The lower the value brings more details,
   * but comes at the cost of more storage required & processing time when viewing data.
   * @default 10s
   */
  collectionInterval: string
  /**
   * @title Retention Period
   * @description Data older than this will be cleared periodically.
   * @default 10d
   */
  retentionPeriod: string
  /**
   * @title Janitor Interval
   * @description The delay between execution of the janitor which removes statistics outside of the previously defined period
   * @default 15m
   */
  janitorInterval: string
}

export interface AlertingConfig {
  /**
   * @title Enabled
   * @description To enable the alerting service, you need to enable the monitoring first.
   * @default false
   */
  enabled: boolean
  /**
   * @title Watcher Interval
   * @description Interval between each executions of the rule checker
   * @default 10s
   */
  watcherInterval: string
  /**
   * @title Retention Period
   * @description The duration for which resolved incidents will be kept
   * @default 10d
   */
  retentionPeriod: string
  /**
   * @title Janitor Interval
   * @description Delay between the execution of the janitor which removes resolved incidents.
   * @default 15m
   */
  janitorInterval: string
  /**
   * @title Rules
   * @description The list of rules which triggers an incident. When triggered, the OnIncidentChangedStatus hook
   * is called with the incident.
   * @default []
   */
  rules: IncidentRule[]
}

export interface BotMonitoringConfig {
  /**
   * This must be enabled for the hook OnBotError to work properly.
   * @default true
   */
  enabled: boolean
  /**
   * The interval between which logs are accumulated before triggering the OnBotError hook.
   * Set this value higher if the hook is triggered too often.
   * @default 1m
   */
  interval: string
}

export interface EventCollectorConfig {
  /**
   * @title Enabled
   * @description When enabled, incoming and outgoing events will be saved on the database.
   * It is required for some modules to work properly (eg: history, testing, developer tools on channel web)
   * @default true
   */
  enabled: boolean
  /**
   * Events are batched then sent to the database. Change the delay to save them more frequently or not.
   * @default 1s
   */
  collectionInterval: string
  /**
   * @title Retention Period
   * @description The duration for which events will be kept in the database
   * @default 30d
   */
  retentionPeriod: string
  /**
   * @title Ignored Event Types
   * @description Specify an array of event types that won't be persisted to the database. For example, typing events and visits
   * may not provide you with useful information
   * @default ["visit","typing"]
   */
  ignoredEventTypes: string[]
  /**
   * @title Ignored Event Properties
   * @description Specify an array of properties that will be stripped from the event before being saved. For example, the "state" property of the event
   * contains a lot of details about the user session (context, attributes, etc) and may not be useful in some cases.
   * @default []
   */
  ignoredEventProperties: string[]
  /**
   * These properties are only stored with the event when the user is logged on the studio
   * @default ["ndu.triggers","ndu.predictions","nlu.predictions","state","processing","activeProcessing"]
   */
  debuggerProperties: string[]
}

interface ActionServersConfig {
  local: {
    /**
     * Port on which the local Action Server listens
     * @default 4000
     */
    port: number
    /**
     * Whether or not the enable the local Action Server
     * @default true
     */
    enabled: boolean
  }
  /**
   * The list of remote Action Servers
   * @default []
   */
  remotes: ActionServer[]
}
