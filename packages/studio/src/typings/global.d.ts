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
    IS_LICENSED?: boolean
    IS_PRO_AVAILABLE: boolean
    IS_PRO_ENABLED: boolean
    CLUSTER_ENABLED: boolean
    BOTPRESS_VERSION: string

    TELEMETRY_URL: string
    core_env: BotpressEnvironmentVariables
    distro: OSDistribution
    BOTPRESS_EVENTS: EventEmitter
    IS_FAILSAFE: boolean
    DISABLE_CONTENT_SANDBOX: boolean
    USE_JWT_COOKIES: boolean
  }
}

declare var process: NodeJS.Process
declare var global: NodeJS.Global
declare type PRO_FEATURES = 'seats'

/**
 * This is a copy of process.env to add typing and documentation to variables
 */
declare interface BotpressEnvironmentVariables {
  readonly STUDIO_PORT?: number
  readonly CORE_PORT?: number
  readonly ROOT_PATH?: string
  readonly PROJECT_LOCATION?: string

  readonly APP_SECRET?: string
  readonly PRO_ENABLED?: boolean
  readonly INTERNAL_PASSWORD?: string

  /** Replace the path of the NodeJS Native Extensions for external OS-specific libraries such as fastText and CRFSuite */
  readonly NATIVE_EXTENSIONS_DIR?: string

  /** Change the BPFS storage mechanism ("database" or "disk"). Defaults to "disk" */
  readonly BPFS_STORAGE?: 'database' | 'disk'

  /** The URL exposed by Botpress to external users (eg: when displaying links) */
  readonly EXTERNAL_URL?: string

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

  /** When running botpress in production, some optimizations are applied */
  readonly BP_PRODUCTION?: boolean

  /** Enable cluster mode */
  readonly CLUSTER_ENABLED?: boolean

  /**
   * Set this to true if you're exposing Botpress through a reverse proxy such as Nginx
   * Can also be either an IP address or a hostname
   * Read more: https://expressjs.com/en/guide/behind-proxies.html
   */
  readonly REVERSE_PROXY?: string

  /** Use this proxy connection string to access external services, like Duckling and Licensing
   *  This values overwrites the value defined in the global Botpress configuration
   * @example http://username:password@hostname:port
   */
  readonly BP_PROXY?: string

  /**
   * Disable the use of GZIP compression while serving assets to the end users
   */
  readonly BP_HTTP_DISABLE_GZIP?: boolean

  /**
   * Use to set default debug namespaces
   * @example bp:dialog:*,bp:nlu:intents:*
   */
  readonly DEBUG?: string

  /** Enable performance hooks to track incoming and outgoing events */
  readonly BP_DEBUG_IO?: boolean

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
   * Disable API call to generate a diagnostic report. Command line/environment variables will still work
   * @default false
   */
  readonly BP_DISABLE_SERVER_DIAG?: boolean

  /**
   * Prevents Botpress from closing cleanly when an error is encountered.
   * This only affects fatal errors, it will not affect business rules checks (eg: licensing)
   */
  readonly BP_FAILSAFE?: boolean

  /** When true, Redis will be used to keep active sessions in memory for better performances */
  readonly USE_REDIS_STATE?: boolean

  /** When true, content elements rendering will be executed outside of the sandbox */
  readonly DISABLE_CONTENT_SANDBOX?: boolean

  /**
   * Indicates how many child process to spawn as Machibe Learning workers.
   * Defaults to 4 if supported by CPU
   * @default 4
   */
  readonly BP_NUM_ML_THREADS?: number

  /**
   * Overrides the maximum file size allowed for the BPFS
   * @default 100mb
   */
  readonly BP_BPFS_MAX_FILE_SIZE?: string

  /**
   * Overrides the maximum concurrency for BPFS upload
   * @default 50
   */
  readonly BP_BPFS_UPLOAD_CONCURRENCY?: number

  /**
   * Overwrites the modules that are enabled by default.
   * Has to be formatted as JSON,
   * ex: ['nlu', 'nlu-testing']
   */
  readonly BP_ENABLED_MODULES?: string
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
