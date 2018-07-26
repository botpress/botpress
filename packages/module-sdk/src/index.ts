export type MiddlewareDefinition = {
  name: string
  description: string
  order: number
  handler: string
}

export type ModuleMetadata = {
  name: string
  version: string
  incomingMiddleware: Array<MiddlewareDefinition>
  outgoingMiddleware: Array<MiddlewareDefinition>
}
