export type ModuleDefinition = {
  onInit: Function
  onReady: Function
  config: { [key: string]: ModuleConfigEntry }
  defaultConfigJson?: string
  serveFile?: ((path: string) => Promise<Buffer>)
}

export type ModuleConfigEntry = {
  type: 'bool' | 'any' | 'string'
  required: boolean
  default: any
  env?: string
}
