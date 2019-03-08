declare namespace NodeJS {
  export interface ExtraRequire {
    addToNodePath(path: string): void
    getPaths(): string[]
    overwritePaths(paths: string[])
  }

  export interface Global {
    printErrorDefault(err: Error): void
    require: ExtraRequire
  }

  export interface Process {
    VERBOSITY_LEVEL: number
    IS_PRODUCTION: boolean
    APP_SECRET: string
    HOST: string
    PORT: number
    EXTERNAL_URL: string
    LOCAL_URL: string
    PROJECT_LOCATION: string
    LOADED_MODULES: { [module: string]: string }
    pkg: any
    IS_LICENSED: boolean
    IS_PRO_ENABLED: boolean
    CLUSTER_ENABLED: boolean
    ASSERT_LICENSED: Function
    BOTPRESS_VERSION: string
    core_env: BotpressEnvironementVariables
    distro: OSDistribution
  }
}

declare var process: NodeJS.Process
declare var global: NodeJS.Global
declare type PRO_FEATURES = 'seats'

declare type BotpressEnvironementVariables = {
  /**
   * Set this to true if you're exposing Botpress through a reverse proxy such as Nginx
   * Read more: https://expressjs.com/en/guide/behind-proxies.html
   */
  REVERSE_PROXY?: string

  /** Replace the path of the NodeJS Native Extensions for external OS-specific libraries such as fastText and CRFSuite */
  NATIVE_EXTENSIONS_DIR?: string
}

declare interface OSDistribution {
  os: NodeJS.Platform
  /** The distribution, e.g. "centos", "ubuntu" */
  dist: string
  /** If a codename is available, for example "final" or "alpine" */
  codename: string
  /** The release number, for example 18.04 */
  release: string
}
