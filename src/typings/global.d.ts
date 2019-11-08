declare namespace NodeJS {
  export interface ExtraRequire {
    addToNodePath(path: string): void
    getPaths(): string[]
    overwritePaths(paths: string[])
  }

  export interface Global {
    printErrorDefault(err: Error): void
    DEBUG: IDebug
    require: ExtraRequire
    rewire: (name: string) => string
    printBotLog(botId: string, args: any[]): void
    printLog(args: any[]): void
  }

  export interface Process {
    VERBOSITY_LEVEL: number
    IS_PRODUCTION: boolean // TODO: look to remove this
    BPFS_STORAGE: 'database' | 'disk'
    APP_SECRET: string
    /**
     * Path to the global APP DATA folder, shared across all installations of Botpress Server
     * Use this folder to store stuff you'd like to cache, like NLU language models etc
     */
    APP_DATA_PATH: string
    HOST: string
    PORT: number
    PROXY?: string
    EXTERNAL_URL: string
    LOCAL_URL: string
    /** This is the subfolder where Botpress is located (ex: /botpress/). It is extracted from the external URL */
    ROOT_PATH: string
    PROJECT_LOCATION: string
    LOADED_MODULES: { [module: string]: string }
    pkg: any
    IS_LICENSED: boolean
    IS_PRO_AVAILABLE: boolean
    IS_PRO_ENABLED: boolean
    CLUSTER_ENABLED: boolean
    ASSERT_LICENSED: Function
    BOTPRESS_VERSION: string
    core_env: BotpressEnvironementVariables
    distro: OSDistribution
    BOTPRESS_EVENTS: EventEmitter
    AUTO_MIGRATE: boolean
    IS_FAILSAFE: boolean
    /** A random ID generated on server start to identify each server in a cluster */
    SERVER_ID: string
  }
}

declare var process: NodeJS.Process
declare var global: NodeJS.Global
declare type PRO_FEATURES = 'seats'

/**
 * This is a copy of process.env to add typing and documentation to variables
 */
declare type BotpressEnvironementVariables = {
  /** Replace the path of the NodeJS Native Extensions for external OS-specific libraries such as fastText and CRFSuite */
  readonly NATIVE_EXTENSIONS_DIR?: string

  /** Change the BPFS storage mechanism ("database" or "disk"). Defaults to "disk" */
  readonly BPFS_STORAGE?: 'database' | 'disk'

  /**
   * The connection string for redis
   * @example redis://username:password@localhost:6379
   */
  readonly REDIS_URL?: string

  /**
   * The database connection string. The first part indicates which database to use
   * @example postgres://user:pass@host/db
   */
  readonly DATABASE_URL?: string

  /** If pro features are enabled or not. When enabled, the license key must be provided */
  readonly PRO_ENABLED?: boolean

  /** When running botpress in production, some optimizations are applied*/
  readonly BP_PRODUCTION?: boolean

  /** Enable cluster mode */
  readonly CLUSTER_ENABLED?: boolean

  /** When you change the botpress executable, it will migrate data automatically if this is set */
  readonly AUTO_MIGRATE?: boolean

  /** Server license key */
  readonly BP_LICENSE_KEY?: string

  /**
   * Set this to true if you're exposing Botpress through a reverse proxy such as Nginx
   * Read more: https://expressjs.com/en/guide/behind-proxies.html
   */
  readonly REVERSE_PROXY?: string

  /** Use this proxy connexion string to access external services, like Duckling and Licensing
   *  This values overwrites the value defined in the global Botpress configuration
   * @example http://username:password@hostname:port
   */
  readonly BP_PROXY?: string

  /**
   * Use to set default debug namespaces
   * @example bp:dialog:*,bp:nlu:intents:*
   */
  readonly DEBUG?: string

  /**
   * Overrides the auto-computed `process.APP_DATA_PATH` path
   * @see Process.APP_DATA_PATH
   */

  readonly APP_DATA_PATH?: string

  /**
   * Truthy if running the official Botpress docker image
   */
  readonly BP_IS_DOCKER?: boolean

  /**
   * The max size of the in-memory, in-process cache.
   * Defaults to '1gb'
   */
  readonly BP_MAX_MEMORY_CACHE_SIZE?: string

  /**
   * When set to true, Botpress will not automatically restart on crash
   * @default false
   */
  readonly BP_DISABLE_AUTO_RESTART?: boolean

  /**
   * Define the maximum number of time the server will be automatically restarted.
   * @default 5
   */
  readonly BP_MAX_SERVER_REBOOT?: number

  /**
   * Disable API calls to the serverConfig endpoint (which may return sensitive data - only for super admins
   * @default false
   */
  readonly BP_DISABLE_SERVER_CONFIG?: boolean

  /**
   * Prevents Botpress from closing cleanly when an error is encountered.
   * This only affects fatal errors, it will not affect business rules checks (eg: licensing)
   */
  readonly BP_FAILSAFE?: boolean

  /**
   * When true, it will not store/load the state from redis to speed up event processing
   * Adding temporarily until the feature is battle-tested
   */
  readonly BP_NO_REDIS_STATE?: boolean
}

interface IDebug {
  (module: string, botId?: string): IDebugInstance
}

interface IDebugInstance {
  readonly enabled: boolean

  (msg: string, extra?: any): void
  /**
   * Use to print a debug message prefixed with the botId
   * @param botId The bot Id
   * @param message The debug message
   */
  forBot(botId: string, message: string, extra?: any): void
  sub(namespace: string): IDebugInstance
}

declare var DEBUG: IDebug

declare interface OSDistribution {
  os: NodeJS.Platform
  /** The distribution, e.g. "centos", "ubuntu" */
  dist: string
  /** If a codename is available, for example "final" or "alpine" */
  codename: string
  /** The release number, for example 18.04 */
  release: string
}

declare interface Dic<T> {
  [Key: string]: T
}
