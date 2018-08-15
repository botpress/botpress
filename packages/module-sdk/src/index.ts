export type MiddlewareDefinition = {
  name: string
  description: string
  order: number
  handler: Function
  direction: string
  enabled?: boolean
  /**
   * @deprecated since version 12.0
   */
  type?: string
  /**
   * @deprecated since version 12.0
   */
  module?: string
}

export type ModuleMetadata = {
  name: string
  version: string
  incomingMiddleware: Array<MiddlewareDefinition>
  outgoingMiddleware: Array<MiddlewareDefinition>
}
