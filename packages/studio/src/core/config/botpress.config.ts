import { ConverseConfig } from 'botpress/sdk'
import { ActionServer, UniqueUser } from 'common/typings'
import { CookieOptions } from 'express'
import { Algorithm } from 'jsonwebtoken'

export type BotpressCondition = '$isProduction' | '$isDevelopment'

export interface ModuleConfigEntry {
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
   * e.g. when the conversation is stale and has not reached the END of the flow.
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

export interface BotpressConfig {
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
     * @default 10mb
     */
    bodyLimit: string | number
    /**
     * CORS policy for the server. You can provide other configuration parameters
     * listed on this page: https://expressjs.com/en/resources/middleware/cors.html
     */
    cors: {
      /**
       * @default true
       */
      enabled?: boolean
      origin?: string
      credentials?: boolean
    }
    /**
     * Represents the complete base URL exposed externally by your bot. This is useful if you configure the bot
     * locally and use NGINX as a reverse proxy to handle HTTPS. It should include the protocol and no trailing slash.
     * If unset, it will be constructed from the real host/port
     * @example https://botpress.com
     * @default
     */
    externalUrl: string
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
    /**
     * Configure the priority for establishing socket connections for webchat and studio users.
     * If the first method is not supported, it will fallback on the second.
     * If the first is supported but it fails with an error, it will not fallback.
     * @default ["websocket","polling"]
     */
    socketTransports: string[]
    rateLimit: {
      /**
       * * Security option to rate limit potential attacker trying to brute force something
       * @default false
       */
      enabled: boolean
      /**
       * Time window to compute rate limiting
       * @default 30s
       */
      limitWindow: string
      /**
       * * Maximum number of request in limit window to ban an IP. Keep in mind that this includes admin, studio and chat request so don't put it too low
       * @default 600
       */
      limit: number
    }
    /**
     * Adds default headers to the server's responses
     * @default {"X-Powered-By":"Botpress"}
     */
    headers: { [name: string]: string }
  }
  modules: Array<ModuleConfigEntry>
  pro: {
    /**
     * Configure the branding of the admin panel and the studio. A valid license is required
     */
    branding: {
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
   * An array of e-mails of users which will have root access to Botpress (manage users, server settings)
   * @example: [admin@botpress.com]
   */
  superAdmins: UniqueUser[]
  /**
   * When enabled, Botpress collects anonymous data about the bot's usage
   * @default true
   */
  sendUsageStats: boolean
  fileUpload: {
    /**
     * Maximum file size for media files upload (in mb)
     * @default 25mb
     */
    maxFileSize: string
    /**
     * The list of allowed extensions for media file uploads
     * @default ["image/jpeg","image/png","image/gif","audio/mpeg","video/mp4"]
     */
    allowedMimeTypes: string[]
  }
  jwtToken: {
    /**
     * The duration for which the token granting access to manage Botpress will be active.
     * @default 1h
     */
    duration: string
    /**
     * When enabled, the token is refreshed every 5 minutes while the user is connected
     * @default true
     */
    allowRefresh: boolean
    /**
     * Use an HTTP-Only secure cookie instead of the local storage for the JWT Token
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
   * Displays the "Powered by Botpress" under the webchat.
   * Help us spread the word, enable this to show your support !
   * @default true
   */
  showPoweredBy: boolean
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
}

export type AuthStrategyType = 'basic' | 'saml' | 'ldap' | 'oauth2'

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
