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
}

/**
 * @property {string} type - The type of the event, i.e. image, text, timeout, etc
 * @property {string} channel - The channel of communication, i.e web, messenger, twillio
 * @property {string} target - The target of the event for a specific plateform, i.e
 */
export type BotpressEvent = {
  type: string
  channel: string
  target: string
  direction: Direction
  text?: string
  raw?: string
}
