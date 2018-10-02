declare namespace NodeJS {
  export interface Global {
    printErrorDefault(err: Error): void
    addToNodePath(path: string): void
  }

  export interface Process {
    pkg: any
  }
}

declare var process: NodeJS.Process
declare var global: NodeJS.Global
declare var addToNodePath
