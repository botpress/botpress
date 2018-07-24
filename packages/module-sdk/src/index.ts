export type MiddlewareDefinition = {
  route: string
  name: string
  description: string
}

export type ModuleMetadata = {
  name: string
  version: string
  incomingMiddleware: Array<MiddlewareDefinition>
  outgoingMiddleware: Array<MiddlewareDefinition>
}
