export type BotConfig = {
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
