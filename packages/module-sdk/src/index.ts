export type Direction = 'incoming' | 'outgoing'

export type MiddlewareDefinition = {
  name: string
  description: string
  order: number
  handler: Function
  direction: Direction
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

export type ModuleDefinition = {
  onInit: Function
  onReady: Function
  config: { [key: string]: ModuleConfigEntry }
}

export type ModuleConfigEntry = {
  type: 'bool' | 'any' | 'string'
  required: boolean
  default: any
  env?: string
}
