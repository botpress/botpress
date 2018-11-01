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
    PORT: number
    PROXY_PORT: number
    PROJECT_LOCATION: string
    LOADED_MODULES: { [module: string]: string }
    pkg: any
    IS_LICENSED: boolean
    ASSERT_LICENSED: Function
    BOTPRESS_VERSION: string
    BOTPRESS_EDITION: 'ce' | 'pro' | 'ee'
  }
}

declare var process: NodeJS.Process
declare var global: NodeJS.Global
