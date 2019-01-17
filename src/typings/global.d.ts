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
    JWT_SECRET: string
    HOST: string
    PORT: number
    EXTERNAL_URL: string
    PROJECT_LOCATION: string
    LOADED_MODULES: { [module: string]: string }
    pkg: any
    IS_LICENSED: boolean
    IS_PRO_ENABLED: boolean
    CLUSTER_ENABLED: boolean
    ASSERT_LICENSED: Function
    BOTPRESS_VERSION: string
  }
}

declare var process: NodeJS.Process
declare var global: NodeJS.Global
declare type PRO_FEATURES = 'seats'
