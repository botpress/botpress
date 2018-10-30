declare namespace NodeJS {
  export interface Global {
    printErrorDefault(err: Error): void
    addToNodePath(path: string): void
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
  }
}

declare var process: NodeJS.Process
declare var global: NodeJS.Global
declare var addToNodePath
