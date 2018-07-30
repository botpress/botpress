export type MiddlewareDefinition = {
  name: string
  description: string
  order: number
  handler: string
  /**
   * @deprecated since version 12.0
   */
  type?: string
  /**
   * @deprecated since version 12.0
   */
  module?: string
  /**
   * @deprecated since version 12.0
   */
  enabled?: boolean
}

export type ModuleMetadata = {
  name: string
  version: string
  incomingMiddleware: Array<MiddlewareDefinition>
  outgoingMiddleware: Array<MiddlewareDefinition>
}
