export type BotConfig = {
  name: string
  description?: string
  author?: string
  version: string
  license?: string
  modules: BotModuleConfig[]
}

export type BotModuleConfig = {
  name: string
  enabled: boolean
  incomingMiddleware: MiddlewareConfig[]
  outgoingMiddleware: MiddlewareConfig[]
}

export type MiddlewareConfig = {
  name: string
  enabled: boolean
  order: number
}
