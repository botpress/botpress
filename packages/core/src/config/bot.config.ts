export interface DialogConfig {
  timeoutInterval: number
}

export type BotConfig = {
  name: string
  active: boolean
  description?: string
  author?: string
  version: string
  license?: string
  imports: {
    modules: string[]
    contentTypes: string[]
    incomingMiddleware: string[]
    outgoingMiddleware: string[]
  }
  dialog?: DialogConfig
}
