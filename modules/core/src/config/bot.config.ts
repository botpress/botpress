export type BotConfig = {
  name: string
  description?: string
  author?: string
  version: string
  license?: string
  modules: [
    {
      name: string
      enabled: boolean
      incomingMiddleware: MiddlewareConfig[]
      outgoingMiddleware: MiddlewareConfig[]
    }
  ]
}

export type MiddlewareConfig = {
  name: string
  enabled: boolean
}
